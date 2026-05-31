# CPForge

The fastest way to find why your competitive programming solution is wrong.

CPForge is a zero-AI, deterministic, offline-first competitive programming workbench. The v0.1 focus is deliberately narrow: compile your C++ solution, brute force solution, and generator; stress them against each other; save counterexamples; replay them; and shrink failing inputs into something you can actually debug.

## Status

This repository currently contains the CLI MVP engine:

- `cpforge init [NAME]`
- `cpforge run`
- `cpforge stress`
- `cpforge replay fail_001`
- `cpforge shrink fail_001.in`
- `cpforge check`
- `cpforge stats`

The VS Code extension, Competitive Companion import, custom checkers, and smart graph/tree/grid shrinkers are the next layers. The CLI is the engine those surfaces should call.

## Build

```powershell
cargo build
```

Run from the repo:

```powershell
cargo run -p cpforge-cli -- init A
cd A
cargo run -p cpforge-cli --manifest-path ..\Cargo.toml -- stress --tests 100
```

After installing the binary, the intended workflow is:

```powershell
cpforge init A
cd A
cpforge run
cpforge stress --tests 10000 --seed 42
cpforge replay fail_001
cpforge shrink fail_001.in
```

## Project Layout

`cpforge init A` creates:

```text
A/
  main.cpp
  brute.cpp
  gen.cpp
  checker.cpp
  input.txt
  expected.txt
  output.txt
  notes.md
  cpforge.toml
  samples/
    sample_1.in
    sample_1.expected
```

The default `gen.cpp` accepts the seed as `argv[1]`, which makes stress runs reproducible.

## Counterexample Workflow

Write:

- `main.cpp`: optimized solution
- `brute.cpp`: slow trusted solution
- `gen.cpp`: random test generator

Then run:

```powershell
cpforge stress --tests 10000 --seed 42
```

On failure, CPForge saves:

```text
.tests/fail_001.in
.tests/fail_001.expected
.tests/fail_001.actual
.tests/fail_001.meta.toml
```

Replay the exact case:

```powershell
cpforge replay fail_001
```

Shrink it:

```powershell
cpforge shrink fail_001.in
```

The v0.1 shrinker is generic and heuristic-based. It tries line deletion, token deletion, and integer simplification while preserving the failure. Smart shrinkers for arrays, trees, graphs, grids, queries, strings, and permutations belong in later releases.

