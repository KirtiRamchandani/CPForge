use anyhow::Result;
use std::collections::BTreeSet;

#[derive(Debug, Clone)]
pub struct ShrinkOptions {
    pub max_passes: usize,
}

impl Default for ShrinkOptions {
    fn default() -> Self {
        Self { max_passes: 6 }
    }
}

#[derive(Debug, Clone)]
pub struct ShrinkReport {
    pub original_bytes: usize,
    pub final_bytes: usize,
    pub original_lines: usize,
    pub final_lines: usize,
    pub original_tokens: usize,
    pub final_tokens: usize,
    pub accepted_reductions: usize,
    pub passes: usize,
}

pub fn shrink_text<F>(
    initial: &str,
    options: ShrinkOptions,
    mut preserves_failure: F,
) -> Result<(String, ShrinkReport)>
where
    F: FnMut(&str) -> Result<bool>,
{
    if !preserves_failure(initial)? {
        anyhow::bail!("initial input does not reproduce the failure");
    }

    let mut current = initial.to_string();
    let original_bytes = current.len();
    let original_lines = count_lines(&current);
    let original_tokens = count_tokens(&current);
    let mut accepted_reductions = 0;
    let mut passes = 0;

    loop {
        if passes >= options.max_passes {
            break;
        }

        passes += 1;
        let mut changed = false;

        if shrink_lines(&mut current, &mut preserves_failure)? {
            changed = true;
            accepted_reductions += 1;
        }

        if shrink_tokens(&mut current, &mut preserves_failure)? {
            changed = true;
            accepted_reductions += 1;
        }

        if shrink_integers(&mut current, &mut preserves_failure)? {
            changed = true;
            accepted_reductions += 1;
        }

        if !changed {
            break;
        }
    }

    let report = ShrinkReport {
        original_bytes,
        final_bytes: current.len(),
        original_lines,
        final_lines: count_lines(&current),
        original_tokens,
        final_tokens: count_tokens(&current),
        accepted_reductions,
        passes,
    };

    Ok((current, report))
}

fn shrink_lines<F>(current: &mut String, preserves_failure: &mut F) -> Result<bool>
where
    F: FnMut(&str) -> Result<bool>,
{
    let mut changed = false;

    loop {
        let lines: Vec<String> = current.lines().map(ToString::to_string).collect();
        if lines.len() <= 1 {
            return Ok(changed);
        }

        let mut accepted = false;
        let mut chunk = lines.len() / 2;

        while chunk >= 1 {
            let mut start = 0;
            while start < lines.len() {
                let end = (start + chunk).min(lines.len());
                let candidate_lines: Vec<String> = lines
                    .iter()
                    .enumerate()
                    .filter_map(|(idx, line)| {
                        ((idx < start) || (idx >= end)).then_some(line.clone())
                    })
                    .collect();

                if candidate_lines.is_empty() {
                    start += chunk;
                    continue;
                }

                let candidate = normalize_lines(&candidate_lines);
                if preserves_failure(&candidate)? {
                    *current = candidate;
                    changed = true;
                    accepted = true;
                    break;
                }

                start += chunk;
            }

            if accepted {
                break;
            }

            chunk /= 2;
        }

        if !accepted {
            return Ok(changed);
        }
    }
}

fn shrink_tokens<F>(current: &mut String, preserves_failure: &mut F) -> Result<bool>
where
    F: FnMut(&str) -> Result<bool>,
{
    let mut changed = false;

    loop {
        let tokens: Vec<String> = current
            .split_whitespace()
            .map(ToString::to_string)
            .collect();
        if tokens.len() <= 1 {
            return Ok(changed);
        }

        let mut accepted = false;
        let mut chunk = tokens.len() / 2;

        while chunk >= 1 {
            let mut start = 0;
            while start < tokens.len() {
                let end = (start + chunk).min(tokens.len());
                let candidate_tokens: Vec<String> = tokens
                    .iter()
                    .enumerate()
                    .filter_map(|(idx, token)| {
                        ((idx < start) || (idx >= end)).then_some(token.clone())
                    })
                    .collect();

                if candidate_tokens.is_empty() {
                    start += chunk;
                    continue;
                }

                let candidate = normalize_tokens(&candidate_tokens);
                if preserves_failure(&candidate)? {
                    *current = candidate;
                    changed = true;
                    accepted = true;
                    break;
                }

                start += chunk;
            }

            if accepted {
                break;
            }

            chunk /= 2;
        }

        if !accepted {
            return Ok(changed);
        }
    }
}

fn shrink_integers<F>(current: &mut String, preserves_failure: &mut F) -> Result<bool>
where
    F: FnMut(&str) -> Result<bool>,
{
    let mut tokens: Vec<String> = current
        .split_whitespace()
        .map(ToString::to_string)
        .collect();
    let mut changed = false;

    for index in 0..tokens.len() {
        let Ok(original) = tokens[index].parse::<i128>() else {
            continue;
        };

        let original_token = tokens[index].clone();
        let mut best = original;
        let mut best_text = None;

        for candidate_value in integer_candidates(original) {
            if candidate_value == original || candidate_value.abs() >= best.abs() {
                continue;
            }

            tokens[index] = candidate_value.to_string();
            let candidate_text = normalize_tokens(&tokens);
            if preserves_failure(&candidate_text)? {
                best = candidate_value;
                best_text = Some(candidate_text);
            }
        }

        if let Some(candidate_text) = best_text {
            tokens[index] = best.to_string();
            *current = candidate_text;
            changed = true;
        } else {
            tokens[index] = original_token;
        }
    }

    Ok(changed)
}

fn integer_candidates(value: i128) -> Vec<i128> {
    let mut values = BTreeSet::new();
    values.insert(0);
    values.insert(1);
    values.insert(-1);
    values.insert(2);
    values.insert(-2);
    for small in -16..=16 {
        values.insert(small);
    }

    let mut cursor = value;
    while cursor != 0 {
        cursor /= 2;
        values.insert(cursor);
        if cursor > 0 {
            values.insert(cursor - 1);
        } else if cursor < 0 {
            values.insert(cursor + 1);
        }
    }

    let mut result: Vec<i128> = values.into_iter().collect();
    result.sort_by_key(|candidate| (candidate.abs(), *candidate));
    result
}

fn normalize_lines(lines: &[String]) -> String {
    let mut output = lines.join("\n");
    output.push('\n');
    output
}

fn normalize_tokens(tokens: &[String]) -> String {
    let mut output = tokens.join(" ");
    output.push('\n');
    output
}

fn count_lines(text: &str) -> usize {
    text.lines().count()
}

fn count_tokens(text: &str) -> usize {
    text.split_whitespace().count()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shrinks_integer_toward_small_failure() {
        let initial = "100 50\n";
        let (shrunk, report) = shrink_text(initial, ShrinkOptions::default(), |candidate| {
            let nums: Vec<i32> = candidate
                .split_whitespace()
                .map(|token| token.parse::<i32>())
                .collect::<Result<Vec<_>, _>>()?;
            Ok(nums.len() == 2 && nums[0] >= 4 && nums[1] == 50)
        })
        .unwrap();

        assert_eq!(shrunk, "4 50\n");
        assert!(report.accepted_reductions > 0);
    }

    #[test]
    fn rejects_non_failing_initial_input() {
        let err = shrink_text("1\n", ShrinkOptions::default(), |_| Ok(false)).unwrap_err();
        assert!(err.to_string().contains("does not reproduce"));
    }
}
