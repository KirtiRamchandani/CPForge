use anyhow::{Context, Result};
use cpforge_core::Project;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Debug, Clone)]
pub struct BuiltTargets {
    pub main: PathBuf,
    pub brute: PathBuf,
    pub generator: PathBuf,
}

#[derive(Debug, Clone)]
pub struct RunResult {
    pub stdout: String,
    pub stderr: String,
    pub duration_ms: u128,
    pub status: ProcessStatus,
}

impl RunResult {
    pub fn ok(&self) -> bool {
        matches!(self.status, ProcessStatus::Success)
    }

    pub fn verdict(&self) -> &'static str {
        match self.status {
            ProcessStatus::Success => "OK",
            ProcessStatus::Exit(_) => "RE",
            ProcessStatus::TimedOut => "TLE",
            ProcessStatus::SpawnFailed => "CE",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProcessStatus {
    Success,
    Exit(Option<i32>),
    TimedOut,
    SpawnFailed,
}

impl ProcessStatus {
    pub fn describe(&self) -> String {
        match self {
            Self::Success => "success".to_string(),
            Self::Exit(Some(code)) => {
                let hint = exit_hint(*code);
                if hint.is_empty() {
                    format!("exit code {code}")
                } else {
                    format!("exit code {code} ({hint})")
                }
            }
            Self::Exit(None) => "terminated by signal".to_string(),
            Self::TimedOut => "time limit exceeded".to_string(),
            Self::SpawnFailed => "failed to start process".to_string(),
        }
    }
}

pub fn build_all(project: &Project, submit_mode: bool) -> Result<BuiltTargets> {
    fs::create_dir_all(project.build_dir())
        .with_context(|| format!("failed to create {}", project.build_dir().display()))?;

    let main = exe_path(&project.build_dir(), "main");
    let brute = exe_path(&project.build_dir(), "brute");
    let generator = exe_path(&project.build_dir(), "gen");

    compile_cpp(&project.resolve(&project.config.main), &main, submit_mode)
        .context("failed to compile main solution")?;
    compile_cpp(&project.resolve(&project.config.brute), &brute, submit_mode)
        .context("failed to compile brute solution")?;
    compile_cpp(
        &project.resolve(&project.config.generator),
        &generator,
        submit_mode,
    )
    .context("failed to compile generator")?;

    Ok(BuiltTargets {
        main,
        brute,
        generator,
    })
}

pub fn build_main(project: &Project, submit_mode: bool) -> Result<PathBuf> {
    fs::create_dir_all(project.build_dir())
        .with_context(|| format!("failed to create {}", project.build_dir().display()))?;
    let main = exe_path(&project.build_dir(), "main");
    compile_cpp(&project.resolve(&project.config.main), &main, submit_mode)
        .context("failed to compile main solution")?;
    Ok(main)
}

pub fn compile_cpp(source: &Path, output: &Path, submit_mode: bool) -> Result<()> {
    if !source.is_file() {
        anyhow::bail!("source file not found: {}", source.display());
    }

    let mut command = Command::new("g++");
    command
        .arg("-std=c++17")
        .arg("-O2")
        .arg("-pipe")
        .arg(source)
        .arg("-o")
        .arg(output);

    if !submit_mode {
        command.arg("-DLOCAL");
    }

    let output_result = command
        .output()
        .with_context(|| "failed to run g++; is it installed and on PATH?")?;

    if !output_result.status.success() {
        anyhow::bail!(
            "g++ failed for {}\n{}",
            source.display(),
            String::from_utf8_lossy(&output_result.stderr)
        );
    }

    Ok(())
}

pub fn run_executable(
    executable: &Path,
    input: &str,
    timeout_ms: u64,
    args: &[String],
) -> RunResult {
    let started = Instant::now();
    let mut child = match Command::new(executable)
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(child) => child,
        Err(err) => {
            return RunResult {
                stdout: String::new(),
                stderr: err.to_string(),
                duration_ms: started.elapsed().as_millis(),
                status: ProcessStatus::SpawnFailed,
            };
        }
    };

    if let Some(mut stdin) = child.stdin.take()
        && let Err(err) = stdin.write_all(input.as_bytes())
    {
        return RunResult {
            stdout: String::new(),
            stderr: err.to_string(),
            duration_ms: started.elapsed().as_millis(),
            status: ProcessStatus::Exit(Some(1)),
        };
    }

    let timeout = Duration::from_millis(timeout_ms);
    loop {
        match child.try_wait() {
            Ok(Some(_)) => {
                let output = child.wait_with_output();
                return finish_output(output, started, false);
            }
            Ok(None) if started.elapsed() >= timeout => {
                let _ = child.kill();
                let output = child.wait_with_output();
                return finish_output(output, started, true);
            }
            Ok(None) => thread::sleep(Duration::from_millis(2)),
            Err(err) => {
                let _ = child.kill();
                return RunResult {
                    stdout: String::new(),
                    stderr: err.to_string(),
                    duration_ms: started.elapsed().as_millis(),
                    status: ProcessStatus::Exit(Some(1)),
                };
            }
        }
    }
}

fn finish_output(
    output: std::io::Result<std::process::Output>,
    started: Instant,
    timed_out: bool,
) -> RunResult {
    match output {
        Ok(output) => {
            let status = if timed_out {
                ProcessStatus::TimedOut
            } else if output.status.success() {
                ProcessStatus::Success
            } else {
                ProcessStatus::Exit(output.status.code())
            };
            RunResult {
                stdout: String::from_utf8_lossy(&output.stdout).to_string(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                duration_ms: started.elapsed().as_millis(),
                status,
            }
        }
        Err(err) => RunResult {
            stdout: String::new(),
            stderr: err.to_string(),
            duration_ms: started.elapsed().as_millis(),
            status: ProcessStatus::Exit(Some(1)),
        },
    }
}

pub fn exe_path(dir: &Path, stem: &str) -> PathBuf {
    if cfg!(windows) {
        dir.join(format!("{stem}.exe"))
    } else {
        dir.join(stem)
    }
}

pub fn exit_hint(code: i32) -> &'static str {
    match code {
        134 => "abort/assertion failure",
        136 => "floating point exception, often division by zero",
        137 => "killed, often memory limit or external termination",
        139 => "segmentation fault / invalid memory access",
        _ => "",
    }
}
