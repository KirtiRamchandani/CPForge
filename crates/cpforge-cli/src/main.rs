use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use cpforge_checker::{CheckerMode, compare};
use cpforge_core::{Project, init_project};
use cpforge_runner::{BuiltTargets, RunResult, build_all, build_main, run_executable};
use cpforge_shrink::{ShrinkOptions, shrink_text};
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Parser)]
#[command(name = "cpforge")]
#[command(version)]
#[command(about = "Offline competitive programming stress testing and counterexample shrinking")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    Init {
        name: Option<PathBuf>,
        #[arg(long)]
        force: bool,
    },
    Run {
        #[arg(long)]
        input: Option<PathBuf>,
        #[arg(long)]
        expected: Option<PathBuf>,
        #[arg(long)]
        sample: Option<usize>,
    },
    Stress {
        #[arg(long, default_value_t = 1000)]
        tests: usize,
        #[arg(long, default_value_t = 1)]
        seed: u64,
        #[arg(long, default_value_t = 1)]
        threads: usize,
        #[arg(long)]
        stop_on_fail: bool,
        #[arg(long)]
        keep_going: bool,
    },
    Replay {
        case: String,
    },
    Shrink {
        case: String,
        #[arg(long)]
        output: Option<PathBuf>,
        #[arg(long, default_value_t = 6)]
        max_passes: usize,
    },
    Check {
        expected: Option<PathBuf>,
        actual: Option<PathBuf>,
        #[arg(long)]
        mode: Option<CheckerMode>,
    },
    Stats,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Init { name, force } => cmd_init(name, force),
        Commands::Run {
            input,
            expected,
            sample,
        } => cmd_run(input, expected, sample),
        Commands::Stress {
            tests,
            seed,
            threads,
            stop_on_fail,
            keep_going,
        } => cmd_stress(tests, seed, threads, stop_on_fail, keep_going),
        Commands::Replay { case } => cmd_replay(&case),
        Commands::Shrink {
            case,
            output,
            max_passes,
        } => cmd_shrink(&case, output, max_passes),
        Commands::Check {
            expected,
            actual,
            mode,
        } => cmd_check(expected, actual, mode),
        Commands::Stats => cmd_stats(),
    }
}

fn cmd_init(name: Option<PathBuf>, force: bool) -> Result<()> {
    let target = name.unwrap_or_else(|| PathBuf::from("."));
    init_project(&target, force)?;
    println!("Initialized CPForge project at {}", target.display());
    Ok(())
}

fn cmd_run(input: Option<PathBuf>, expected: Option<PathBuf>, sample: Option<usize>) -> Result<()> {
    let project = Project::load_from(std::env::current_dir()?)?;
    let checker_mode = CheckerMode::from_config(&project.config.checker)?;
    let main = build_main(&project, false)?;

    if input.is_some() || expected.is_some() {
        return run_single_case(&project, &main, input, expected, checker_mode);
    }

    let samples = discover_samples(&project, sample)?;
    if samples.is_empty() {
        println!("No samples found; running input.txt against expected.txt.");
        return run_single_case(
            &project,
            &main,
            Some(PathBuf::from("input.txt")),
            Some(PathBuf::from("expected.txt")),
            checker_mode,
        );
    }

    let mut accepted = 0;
    for (idx, sample_case) in samples.iter().enumerate() {
        let input_text = fs::read_to_string(&sample_case.input)
            .with_context(|| format!("failed to read {}", sample_case.input.display()))?;
        let expected_text = fs::read_to_string(&sample_case.expected)
            .with_context(|| format!("failed to read {}", sample_case.expected.display()))?;
        let result = run_executable(&main, &input_text, project.config.time_limit_ms, &[]);

        if !result.ok() {
            println!(
                "Sample {}: {}, {} ms ({})",
                idx + 1,
                result.verdict(),
                result.duration_ms,
                result.status.describe()
            );
            print_stderr(&result);
            continue;
        }

        let check = compare(&expected_text, &result.stdout, checker_mode);
        if check.accepted {
            accepted += 1;
            println!("Sample {}: AC, {} ms", idx + 1, result.duration_ms);
        } else {
            println!("Sample {}: WA, {} ms", idx + 1, result.duration_ms);
            if let Some(diff) = check.diff {
                println!("{diff}");
            }
        }
    }

    println!("{accepted}/{} samples accepted", samples.len());
    Ok(())
}

fn run_single_case(
    project: &Project,
    main: &Path,
    input: Option<PathBuf>,
    expected: Option<PathBuf>,
    checker_mode: CheckerMode,
) -> Result<()> {
    let input_path = project.resolve(input.unwrap_or_else(|| PathBuf::from("input.txt")));
    let expected_path = project.resolve(expected.unwrap_or_else(|| PathBuf::from("expected.txt")));
    let output_path = project.root.join("output.txt");
    let input_text = fs::read_to_string(&input_path)
        .with_context(|| format!("failed to read {}", input_path.display()))?;
    let result = run_executable(main, &input_text, project.config.time_limit_ms, &[]);
    fs::write(&output_path, &result.stdout)
        .with_context(|| format!("failed to write {}", output_path.display()))?;

    if !result.ok() {
        println!(
            "Run: {}, {} ms ({})",
            result.verdict(),
            result.duration_ms,
            result.status.describe()
        );
        print_stderr(&result);
        return Ok(());
    }

    if expected_path.is_file() {
        let expected_text = fs::read_to_string(&expected_path)
            .with_context(|| format!("failed to read {}", expected_path.display()))?;
        let check = compare(&expected_text, &result.stdout, checker_mode);
        if check.accepted {
            println!("Run: AC, {} ms", result.duration_ms);
        } else {
            println!("Run: WA, {} ms", result.duration_ms);
            if let Some(diff) = check.diff {
                println!("{diff}");
            }
        }
    } else {
        println!("Run: OK, {} ms", result.duration_ms);
        print!("{}", result.stdout);
    }

    Ok(())
}

fn cmd_stress(
    tests: usize,
    seed: u64,
    threads: usize,
    stop_on_fail: bool,
    keep_going: bool,
) -> Result<()> {
    if threads > 1 {
        eprintln!(
            "cpforge v0.1 runs stress tests on one deterministic worker; --threads is accepted for CLI compatibility."
        );
    }

    let project = Project::load_from(std::env::current_dir()?)?;
    let checker_mode = CheckerMode::from_config(&project.config.checker)?;
    let built = build_all(&project, false)?;
    let should_stop = stop_on_fail || !keep_going;
    let mut failures = 0;

    for test_index in 1..=tests {
        let test_seed = seed.wrapping_add((test_index - 1) as u64);
        match run_stress_case(&project, &built, checker_mode, test_seed, test_index)? {
            StressOutcome::Accepted { main_ms, brute_ms } => {
                if test_index == 1 || test_index % 100 == 0 {
                    println!(
                        "Checked {test_index}/{tests} tests (last main {main_ms} ms, brute {brute_ms} ms)"
                    );
                }
            }
            StressOutcome::Failure(failure) => {
                failures += 1;
                let saved = save_failure(&project, &failure)?;
                print_failure(test_index, &failure, &saved);
                if should_stop {
                    return Ok(());
                }
            }
        }
    }

    if failures == 0 {
        println!("No failures found across {tests} tests from seed {seed}.");
    } else {
        println!("Found {failures} failing tests across {tests} generated cases.");
    }

    Ok(())
}

fn run_stress_case(
    project: &Project,
    built: &BuiltTargets,
    checker_mode: CheckerMode,
    seed: u64,
    test_index: usize,
) -> Result<StressOutcome> {
    let generator_args = vec![seed.to_string(), test_index.to_string()];
    let generated = run_executable(
        &built.generator,
        "",
        project.config.time_limit_ms,
        &generator_args,
    );

    if !generated.ok() {
        anyhow::bail!(
            "generator failed on seed {seed}: {}{}",
            generated.status.describe(),
            stderr_suffix(&generated)
        );
    }

    let input = generated.stdout;
    let main = run_executable(&built.main, &input, project.config.time_limit_ms, &[]);
    let brute = run_executable(&built.brute, &input, project.config.time_limit_ms, &[]);

    if !brute.ok() {
        anyhow::bail!(
            "brute failed on seed {seed}: {}{}",
            brute.status.describe(),
            stderr_suffix(&brute)
        );
    }

    if !main.ok() {
        return Ok(StressOutcome::Failure(Failure {
            verdict: main.verdict().to_string(),
            input,
            expected: brute.stdout,
            actual: main.stdout,
            seed,
            test_index,
            main_ms: main.duration_ms,
            brute_ms: brute.duration_ms,
            checker: checker_mode,
            diff: Some(main.status.describe()),
        }));
    }

    let check = compare(&brute.stdout, &main.stdout, checker_mode);
    if check.accepted {
        Ok(StressOutcome::Accepted {
            main_ms: main.duration_ms,
            brute_ms: brute.duration_ms,
        })
    } else {
        Ok(StressOutcome::Failure(Failure {
            verdict: "WA".to_string(),
            input,
            expected: brute.stdout,
            actual: main.stdout,
            seed,
            test_index,
            main_ms: main.duration_ms,
            brute_ms: brute.duration_ms,
            checker: checker_mode,
            diff: check.diff,
        }))
    }
}

fn cmd_replay(case: &str) -> Result<()> {
    let project = Project::load_from(std::env::current_dir()?)?;
    let checker_mode = CheckerMode::from_config(&project.config.checker)?;
    let built = build_all(&project, false)?;
    let input_path = resolve_case_path(&project, case)?;
    let input = fs::read_to_string(&input_path)
        .with_context(|| format!("failed to read {}", input_path.display()))?;
    let main = run_executable(&built.main, &input, project.config.time_limit_ms, &[]);
    let brute = run_executable(&built.brute, &input, project.config.time_limit_ms, &[]);

    println!("Replay: {}", input_path.display());
    print_meta_if_present(&input_path)?;

    if !brute.ok() {
        anyhow::bail!(
            "brute no longer runs on replay input: {}",
            brute.status.describe()
        );
    }

    if !main.ok() {
        println!(
            "Verdict: {} (main {}, brute {} ms)",
            main.verdict(),
            main.duration_ms,
            brute.duration_ms
        );
        println!("{}", main.status.describe());
        print_stderr(&main);
        return Ok(());
    }

    let check = compare(&brute.stdout, &main.stdout, checker_mode);
    if check.accepted {
        println!(
            "Verdict: AC (main {} ms, brute {} ms)",
            main.duration_ms, brute.duration_ms
        );
    } else {
        println!(
            "Verdict: WA (main {} ms, brute {} ms)",
            main.duration_ms, brute.duration_ms
        );
        if let Some(diff) = check.diff {
            println!("{diff}");
        }
    }

    Ok(())
}

fn cmd_shrink(case: &str, output: Option<PathBuf>, max_passes: usize) -> Result<()> {
    let project = Project::load_from(std::env::current_dir()?)?;
    let checker_mode = CheckerMode::from_config(&project.config.checker)?;
    let built = build_all(&project, false)?;
    let input_path = resolve_case_path(&project, case)?;
    let initial = fs::read_to_string(&input_path)
        .with_context(|| format!("failed to read {}", input_path.display()))?;
    let mut attempts = 0usize;

    let (shrunk, report) = shrink_text(&initial, ShrinkOptions { max_passes }, |candidate| {
        attempts += 1;
        preserves_failure(&project, &built, checker_mode, candidate)
    })?;

    let output_path = output.unwrap_or_else(|| shrunk_path_for(&input_path));
    fs::write(&output_path, &shrunk)
        .with_context(|| format!("failed to write {}", output_path.display()))?;
    save_outputs_for_input(&project, &built, checker_mode, &output_path, &shrunk)?;

    println!("Shrunk counterexample saved to {}", output_path.display());
    println!(
        "Bytes: {} -> {}, lines: {} -> {}, tokens: {} -> {}",
        report.original_bytes,
        report.final_bytes,
        report.original_lines,
        report.final_lines,
        report.original_tokens,
        report.final_tokens
    );
    println!(
        "Accepted reductions: {}, passes: {}, predicate checks: {}",
        report.accepted_reductions, report.passes, attempts
    );

    Ok(())
}

fn preserves_failure(
    project: &Project,
    built: &BuiltTargets,
    checker_mode: CheckerMode,
    input: &str,
) -> Result<bool> {
    let main = run_executable(&built.main, input, project.config.time_limit_ms, &[]);
    let brute = run_executable(&built.brute, input, project.config.time_limit_ms, &[]);

    if !brute.ok() {
        return Ok(false);
    }

    if !main.ok() {
        return Ok(true);
    }

    Ok(!compare(&brute.stdout, &main.stdout, checker_mode).accepted)
}

fn cmd_check(
    expected: Option<PathBuf>,
    actual: Option<PathBuf>,
    mode: Option<CheckerMode>,
) -> Result<()> {
    let project = Project::load_from(std::env::current_dir()?).ok();
    let checker_mode = match mode {
        Some(mode) => mode,
        None => project
            .as_ref()
            .map(|project| CheckerMode::from_config(&project.config.checker))
            .transpose()?
            .unwrap_or(CheckerMode::Exact),
    };

    let expected_path = project
        .as_ref()
        .map(|project| {
            project.resolve(
                expected
                    .clone()
                    .unwrap_or_else(|| PathBuf::from("expected.txt")),
            )
        })
        .unwrap_or_else(|| expected.unwrap_or_else(|| PathBuf::from("expected.txt")));
    let actual_path = project
        .as_ref()
        .map(|project| {
            project.resolve(
                actual
                    .clone()
                    .unwrap_or_else(|| PathBuf::from("output.txt")),
            )
        })
        .unwrap_or_else(|| actual.unwrap_or_else(|| PathBuf::from("output.txt")));

    let expected_text = fs::read_to_string(&expected_path)
        .with_context(|| format!("failed to read {}", expected_path.display()))?;
    let actual_text = fs::read_to_string(&actual_path)
        .with_context(|| format!("failed to read {}", actual_path.display()))?;
    let check = compare(&expected_text, &actual_text, checker_mode);

    if check.accepted {
        println!("AC ({checker_mode})");
    } else {
        println!("WA ({checker_mode})");
        if let Some(diff) = check.diff {
            println!("{diff}");
        }
    }

    Ok(())
}

fn cmd_stats() -> Result<()> {
    let project = Project::load_from(std::env::current_dir()?)?;
    let tests_dir = project.tests_dir();
    let mut failing_inputs = 0usize;
    let mut shrunk_inputs = 0usize;

    if tests_dir.is_dir() {
        for entry in fs::read_dir(&tests_dir)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with("fail_") && name.ends_with(".in") {
                if name.contains(".shrunk.") {
                    shrunk_inputs += 1;
                } else {
                    failing_inputs += 1;
                }
            }
        }
    }

    println!("Saved counterexamples: {failing_inputs}");
    println!("Shrunk counterexamples: {shrunk_inputs}");
    println!("Tests directory: {}", tests_dir.display());
    Ok(())
}

#[derive(Debug)]
struct SampleCase {
    input: PathBuf,
    expected: PathBuf,
}

fn discover_samples(project: &Project, sample: Option<usize>) -> Result<Vec<SampleCase>> {
    let samples_dir = project.samples_dir();
    if !samples_dir.is_dir() {
        return Ok(Vec::new());
    }

    let mut inputs: Vec<PathBuf> = fs::read_dir(samples_dir)?
        .filter_map(|entry| entry.ok().map(|entry| entry.path()))
        .filter(|path| path.extension().is_some_and(|ext| ext == "in"))
        .collect();
    inputs.sort();

    let mut cases = Vec::new();
    for input in inputs {
        let expected = input.with_extension("expected");
        if !expected.is_file() {
            continue;
        }
        cases.push(SampleCase { input, expected });
    }

    if let Some(sample_number) = sample {
        if sample_number == 0 || sample_number > cases.len() {
            anyhow::bail!("sample {sample_number} not found");
        }
        Ok(vec![cases.remove(sample_number - 1)])
    } else {
        Ok(cases)
    }
}

#[derive(Debug)]
enum StressOutcome {
    Accepted { main_ms: u128, brute_ms: u128 },
    Failure(Failure),
}

#[derive(Debug)]
struct Failure {
    verdict: String,
    input: String,
    expected: String,
    actual: String,
    seed: u64,
    test_index: usize,
    main_ms: u128,
    brute_ms: u128,
    checker: CheckerMode,
    diff: Option<String>,
}

#[derive(Debug)]
struct SavedFailure {
    input: PathBuf,
    expected: PathBuf,
    actual: PathBuf,
    meta: PathBuf,
}

#[derive(Debug, Serialize)]
struct FailureMeta {
    seed: u64,
    test_index: usize,
    verdict: String,
    checker: String,
    main_ms: u64,
    brute_ms: u64,
}

fn save_failure(project: &Project, failure: &Failure) -> Result<SavedFailure> {
    fs::create_dir_all(project.tests_dir())
        .with_context(|| format!("failed to create {}", project.tests_dir().display()))?;
    let id = next_failure_id(project)?;
    let stem = format!("fail_{id:03}");
    let input = project.tests_dir().join(format!("{stem}.in"));
    let expected = project.tests_dir().join(format!("{stem}.expected"));
    let actual = project.tests_dir().join(format!("{stem}.actual"));
    let meta = project.tests_dir().join(format!("{stem}.meta.toml"));

    fs::write(&input, &failure.input)?;
    fs::write(&expected, &failure.expected)?;
    fs::write(&actual, &failure.actual)?;
    fs::write(
        &meta,
        toml::to_string_pretty(&FailureMeta {
            seed: failure.seed,
            test_index: failure.test_index,
            verdict: failure.verdict.clone(),
            checker: failure.checker.to_string(),
            main_ms: millis_for_meta(failure.main_ms),
            brute_ms: millis_for_meta(failure.brute_ms),
        })?,
    )?;

    Ok(SavedFailure {
        input,
        expected,
        actual,
        meta,
    })
}

fn next_failure_id(project: &Project) -> Result<usize> {
    let mut max_id = 0usize;
    if project.tests_dir().is_dir() {
        for entry in fs::read_dir(project.tests_dir())? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().to_string();
            let Some(rest) = name.strip_prefix("fail_") else {
                continue;
            };
            let Some(id_text) = rest.strip_suffix(".in") else {
                continue;
            };
            if let Ok(id) = id_text.parse::<usize>() {
                max_id = max_id.max(id);
            }
        }
    }
    Ok(max_id + 1)
}

fn print_failure(test_index: usize, failure: &Failure, saved: &SavedFailure) {
    let label = match failure.verdict.as_str() {
        "WA" => "Wrong Answer",
        "TLE" => "Time Limit Exceeded",
        "RE" => "Runtime Error",
        other => other,
    };

    println!("{label} found after {test_index} tests.");
    println!("Seed: {}", failure.seed);
    println!(
        "Runtime main: {} ms, brute: {} ms, checker: {}",
        failure.main_ms, failure.brute_ms, failure.checker
    );
    if let Some(diff) = &failure.diff {
        println!("{diff}");
    }
    println!();
    println!("Input:");
    print_limited(&failure.input, 4000);
    println!();
    println!("Expected:");
    print_limited(&failure.expected, 2000);
    println!();
    println!("Found:");
    print_limited(&failure.actual, 2000);
    println!();
    println!("Saved:");
    println!("{}", saved.input.display());
    println!("{}", saved.expected.display());
    println!("{}", saved.actual.display());
    println!("{}", saved.meta.display());
}

fn resolve_case_path(project: &Project, case: &str) -> Result<PathBuf> {
    let raw = PathBuf::from(case);
    let direct = project.resolve(&raw);
    if direct.is_file() {
        return Ok(direct);
    }

    let tests_dir = project.tests_dir();
    let candidates = [
        tests_dir.join(case),
        tests_dir.join(format!("{case}.in")),
        tests_dir.join(format!("fail_{case}.in")),
    ];

    for candidate in candidates {
        if candidate.is_file() {
            return Ok(candidate);
        }
    }

    anyhow::bail!("could not find counterexample `{case}`")
}

fn print_meta_if_present(input_path: &Path) -> Result<()> {
    let meta_path = input_path.with_extension("meta.toml");
    if meta_path.is_file() {
        let meta = fs::read_to_string(&meta_path)
            .with_context(|| format!("failed to read {}", meta_path.display()))?;
        print!("{meta}");
    }
    Ok(())
}

fn shrunk_path_for(input_path: &Path) -> PathBuf {
    let stem = input_path
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or("case");
    input_path.with_file_name(format!("{stem}.shrunk.in"))
}

fn save_outputs_for_input(
    project: &Project,
    built: &BuiltTargets,
    checker_mode: CheckerMode,
    input_path: &Path,
    input: &str,
) -> Result<()> {
    let main = run_executable(&built.main, input, project.config.time_limit_ms, &[]);
    let brute = run_executable(&built.brute, input, project.config.time_limit_ms, &[]);

    if brute.ok() {
        fs::write(input_path.with_extension("expected"), &brute.stdout)?;
    }

    fs::write(input_path.with_extension("actual"), &main.stdout)?;

    if main.ok() && brute.ok() {
        let check = compare(&brute.stdout, &main.stdout, checker_mode);
        if check.accepted {
            anyhow::bail!("shrunk input no longer fails");
        }
    }

    Ok(())
}

fn print_limited(text: &str, limit: usize) {
    if text.len() <= limit {
        print!("{text}");
        if !text.ends_with('\n') {
            println!();
        }
    } else {
        println!("{}", &text[..limit]);
        println!("... truncated, see saved file for full text ...");
    }
}

fn print_stderr(result: &RunResult) {
    if !result.stderr.trim().is_empty() {
        eprintln!("{}", result.stderr.trim_end());
    }
}

fn stderr_suffix(result: &RunResult) -> String {
    if result.stderr.trim().is_empty() {
        String::new()
    } else {
        format!("\n{}", result.stderr.trim_end())
    }
}

fn millis_for_meta(value: u128) -> u64 {
    value.min(u64::MAX as u128) as u64
}
