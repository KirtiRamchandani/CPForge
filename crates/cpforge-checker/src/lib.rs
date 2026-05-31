use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CheckerMode {
    Exact,
    IgnoreWhitespace,
}

impl CheckerMode {
    pub fn from_config(value: &str) -> anyhow::Result<Self> {
        match value.trim().to_ascii_lowercase().as_str() {
            "diff" | "exact" => Ok(Self::Exact),
            "ignore_whitespace" | "whitespace" | "tokens" => Ok(Self::IgnoreWhitespace),
            other => anyhow::bail!("unsupported checker mode `{other}`"),
        }
    }
}

impl fmt::Display for CheckerMode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Exact => write!(f, "exact"),
            Self::IgnoreWhitespace => write!(f, "ignore_whitespace"),
        }
    }
}

impl FromStr for CheckerMode {
    type Err = anyhow::Error;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        Self::from_config(value)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CheckResult {
    pub accepted: bool,
    pub mode: CheckerMode,
    pub diff: Option<String>,
}

pub fn compare(expected: &str, actual: &str, mode: CheckerMode) -> CheckResult {
    let expected = normalize_newlines(expected);
    let actual = normalize_newlines(actual);
    let accepted = match mode {
        CheckerMode::Exact => expected == actual,
        CheckerMode::IgnoreWhitespace => expected.split_whitespace().eq(actual.split_whitespace()),
    };

    CheckResult {
        accepted,
        mode,
        diff: (!accepted).then(|| format_diff(&expected, &actual, mode)),
    }
}

pub fn format_diff(expected: &str, actual: &str, mode: CheckerMode) -> String {
    match mode {
        CheckerMode::Exact => exact_diff(expected, actual),
        CheckerMode::IgnoreWhitespace => token_diff(expected, actual),
    }
}

fn exact_diff(expected: &str, actual: &str) -> String {
    let expected_lines: Vec<&str> = expected.lines().collect();
    let actual_lines: Vec<&str> = actual.lines().collect();
    let max_lines = expected_lines.len().max(actual_lines.len());

    for index in 0..max_lines {
        let expected_line = expected_lines
            .get(index)
            .copied()
            .unwrap_or("<missing line>");
        let actual_line = actual_lines.get(index).copied().unwrap_or("<missing line>");
        if expected_line != actual_line {
            let caret = first_char_difference(expected_line, actual_line)
                .map(|pos| format!("{}^", " ".repeat(pos)))
                .unwrap_or_else(|| "^".to_string());
            return format!(
                "First difference at line {}:\nExpected: {}\nFound:    {}\n          {}",
                index + 1,
                printable_line(expected_line),
                printable_line(actual_line),
                caret
            );
        }
    }

    let expected_bytes = expected.len();
    let actual_bytes = actual.len();
    format!(
        "Outputs differ only by trailing newline/bytes: expected {expected_bytes} bytes, found {actual_bytes} bytes"
    )
}

fn token_diff(expected: &str, actual: &str) -> String {
    let expected_tokens: Vec<&str> = expected.split_whitespace().collect();
    let actual_tokens: Vec<&str> = actual.split_whitespace().collect();
    let max_tokens = expected_tokens.len().max(actual_tokens.len());

    for index in 0..max_tokens {
        let expected_token = expected_tokens
            .get(index)
            .copied()
            .unwrap_or("<missing token>");
        let actual_token = actual_tokens
            .get(index)
            .copied()
            .unwrap_or("<missing token>");
        if expected_token != actual_token {
            return format!(
                "First token difference at token {}:\nExpected: {}\nFound:    {}",
                index + 1,
                expected_token,
                actual_token
            );
        }
    }

    "Token streams differ".to_string()
}

fn first_char_difference(left: &str, right: &str) -> Option<usize> {
    let mut offset = 0;
    let mut left_chars = left.chars();
    let mut right_chars = right.chars();

    loop {
        match (left_chars.next(), right_chars.next()) {
            (Some(a), Some(b)) if a == b => offset += a.len_utf8(),
            (Some(_), Some(_)) | (Some(_), None) | (None, Some(_)) => return Some(offset),
            (None, None) => return None,
        }
    }
}

fn printable_line(line: &str) -> String {
    if line.is_empty() {
        "<empty>".to_string()
    } else {
        line.to_string()
    }
}

fn normalize_newlines(text: &str) -> String {
    text.replace("\r\n", "\n").replace('\r', "\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exact_checker_rejects_whitespace_difference() {
        let result = compare("1 2\n", "1 2", CheckerMode::Exact);
        assert!(!result.accepted);
        assert!(result.diff.unwrap().contains("bytes"));
    }

    #[test]
    fn whitespace_checker_compares_tokens() {
        let result = compare("1   2\n3", "1 2 3\n", CheckerMode::IgnoreWhitespace);
        assert!(result.accepted);
    }

    #[test]
    fn exact_checker_ignores_platform_line_endings() {
        let result = compare("1\n2\n", "1\r\n2\r\n", CheckerMode::Exact);
        assert!(result.accepted);
    }

    #[test]
    fn token_diff_points_to_first_bad_token() {
        let result = compare("10 20 30", "10 20 31", CheckerMode::IgnoreWhitespace);
        assert_eq!(
            result.diff.unwrap(),
            "First token difference at token 3:\nExpected: 30\nFound:    31"
        );
    }
}
