use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

pub const CONFIG_FILE: &str = "cpforge.toml";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub language: String,
    pub main: PathBuf,
    pub brute: PathBuf,
    pub generator: PathBuf,
    pub checker: String,
    pub time_limit_ms: u64,
}

impl Default for ProjectConfig {
    fn default() -> Self {
        Self {
            language: "cpp".to_string(),
            main: PathBuf::from("main.cpp"),
            brute: PathBuf::from("brute.cpp"),
            generator: PathBuf::from("gen.cpp"),
            checker: "exact".to_string(),
            time_limit_ms: 2000,
        }
    }
}

#[derive(Debug, Clone)]
pub struct Project {
    pub root: PathBuf,
    pub config: ProjectConfig,
}

impl Project {
    pub fn load_from(start: impl AsRef<Path>) -> Result<Self> {
        let start = start.as_ref();
        let root = find_project_root(start)
            .with_context(|| format!("no {CONFIG_FILE} found from {}", start.display()))?;
        let config_path = root.join(CONFIG_FILE);
        let config_text = fs::read_to_string(&config_path)
            .with_context(|| format!("failed to read {}", config_path.display()))?;
        let config = toml::from_str(&config_text)
            .with_context(|| format!("failed to parse {}", config_path.display()))?;
        Ok(Self { root, config })
    }

    pub fn resolve(&self, path: impl AsRef<Path>) -> PathBuf {
        let path = path.as_ref();
        if path.is_absolute() {
            path.to_path_buf()
        } else {
            self.root.join(path)
        }
    }

    pub fn tests_dir(&self) -> PathBuf {
        self.root.join(".tests")
    }

    pub fn build_dir(&self) -> PathBuf {
        self.root.join(".cpforge").join("build")
    }

    pub fn samples_dir(&self) -> PathBuf {
        self.root.join("samples")
    }
}

pub fn find_project_root(start: &Path) -> Option<PathBuf> {
    let mut current = if start.is_file() {
        start.parent()?.to_path_buf()
    } else {
        start.to_path_buf()
    };

    loop {
        if current.join(CONFIG_FILE).is_file() {
            return Some(current);
        }
        if !current.pop() {
            return None;
        }
    }
}

pub fn init_project(target: &Path, force: bool) -> Result<()> {
    if target.exists() && !target.is_dir() {
        anyhow::bail!("{} exists and is not a directory", target.display());
    }

    fs::create_dir_all(target).with_context(|| format!("failed to create {}", target.display()))?;
    fs::create_dir_all(target.join("samples"))
        .with_context(|| format!("failed to create {}", target.join("samples").display()))?;

    write_new(target.join(CONFIG_FILE), &default_config_text(), force)?;
    write_new(target.join("main.cpp"), MAIN_CPP, force)?;
    write_new(target.join("brute.cpp"), BRUTE_CPP, force)?;
    write_new(target.join("gen.cpp"), GEN_CPP, force)?;
    write_new(target.join("checker.cpp"), CHECKER_CPP, force)?;
    write_new(target.join("input.txt"), "1\n", force)?;
    write_new(target.join("expected.txt"), "1\n", force)?;
    write_new(target.join("output.txt"), "", force)?;
    write_new(target.join("notes.md"), "# Notes\n\n", force)?;
    write_new(target.join("samples").join("sample_1.in"), "1\n", force)?;
    write_new(
        target.join("samples").join("sample_1.expected"),
        "1\n",
        force,
    )?;

    Ok(())
}

fn write_new(path: PathBuf, contents: &str, force: bool) -> Result<()> {
    if path.exists() && !force {
        anyhow::bail!(
            "{} already exists; pass --force to overwrite",
            path.display()
        );
    }

    fs::write(&path, contents).with_context(|| format!("failed to write {}", path.display()))
}

fn default_config_text() -> String {
    toml::to_string_pretty(&ProjectConfig::default()).expect("default config serializes")
}

const MAIN_CPP: &str = r#"#include <bits/stdc++.h>
using namespace std;

#ifdef LOCAL
template <class T>
void _dbg_one(const char* name, const T& value) {
    cerr << name << " = " << value << '\n';
}
#define debug(x) _dbg_one(#x, x)
#else
#define debug(x)
#endif

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    long long n;
    if (cin >> n) {
        cout << n << '\n';
    }
    return 0;
}
"#;

const BRUTE_CPP: &str = r#"#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    long long n;
    if (cin >> n) {
        cout << n << '\n';
    }
    return 0;
}
"#;

const GEN_CPP: &str = r#"#include <bits/stdc++.h>
using namespace std;

int main(int argc, char** argv) {
    unsigned long long seed = 1;
    if (argc > 1) {
        seed = stoull(argv[1]);
    }

    mt19937_64 rng(seed);
    cout << uniform_int_distribution<int>(1, 10)(rng) << '\n';
    return 0;
}
"#;

const CHECKER_CPP: &str = r#"#include <bits/stdc++.h>
using namespace std;

int main(int argc, char** argv) {
    // Reserved for future custom checker support.
    // v0.1 supports built-in exact and ignore_whitespace checkers.
    return 0;
}
"#;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn project_init_writes_config() {
        let temp = tempfile::tempdir().unwrap();
        let root = temp.path().join("A");
        init_project(&root, false).unwrap();

        assert!(root.join(CONFIG_FILE).is_file());
        assert!(root.join("main.cpp").is_file());
        assert!(root.join("samples").join("sample_1.in").is_file());
    }
}
