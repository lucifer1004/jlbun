/**
 * Benchmark: GC Mode Performance Comparison
 *
 * Compares three GC management modes:
 * 1. Default mode - Scope-based with concurrent async support (thread-safe)
 * 2. Safe mode - FinalizationRegistry-based, closure-safe
 * 3. Perf mode - Lock-free stack-based, fastest (single-threaded LIFO only)
 *
 * Key differences:
 * - Default: Thread-safe mutex, scope isolation, O(n) release
 * - Safe: All objects use FinalizationRegistry, closure-safe but non-deterministic
 * - Perf: No mutex, pure LIFO stack, O(1) release (single-threaded only!)
 */

import { Julia, JuliaArray, ScopeMode } from "../../jlbun/index.js";

Julia.init();

const ITERATIONS = 1000;
const OBJECTS_PER_SCOPE = [10, 50, 100, 500];

// Helper to format numbers with commas
const formatNum = (n: number) =>
  n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Store results for summary table
interface BenchResult {
  mode: string;
  objectCount: number;
  totalTime: number;
  perScope: number;
  perObject: number;
  scopesPerSec: number;
}

const results: BenchResult[] = [];

function runBenchmark(
  name: string,
  mode: ScopeMode,
  objectCount: number,
  withEscape = false,
): BenchResult {
  const escaped: JuliaArray[] = [];

  // Set default mode for cleaner code
  Julia.defaultScopeMode = mode;

  const start_t = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    Julia.scope((julia) => {
      for (let j = 0; j < objectCount; j++) {
        const arr = julia.Array.init(julia.Float64, 10);
        if (withEscape && j === 0) {
          escaped.push(julia.escape(arr));
        }
      }
    });
  }
  const elapsed = performance.now() - start_t;
  const totalOps = ITERATIONS * objectCount;

  const result: BenchResult = {
    mode: name,
    objectCount,
    totalTime: elapsed,
    perScope: elapsed / ITERATIONS,
    perObject: (elapsed * 1000) / totalOps,
    scopesPerSec: ITERATIONS / (elapsed / 1000),
  };

  console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
  console.log(`   Per scope: ${result.perScope.toFixed(3)} ms`);
  console.log(`   Per object: ${result.perObject.toFixed(3)} µs`);
  console.log(`   Scopes/sec: ${formatNum(result.scopesPerSec)}`);
  if (withEscape) {
    console.log(`   (Escaped objects: ${escaped.length})`);
  }

  // Reset to default
  Julia.defaultScopeMode = "default";

  return result;
}

console.log("=".repeat(70));
console.log("GC Mode Performance Benchmark");
console.log("=".repeat(70));
console.log(`Scope iterations: ${formatNum(ITERATIONS)}`);
console.log();

for (const objectCount of OBJECTS_PER_SCOPE) {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`Objects per scope: ${objectCount}`);
  console.log(`${"─".repeat(70)}\n`);

  // Warm up all modes
  for (const mode of ["default", "safe", "perf"] as ScopeMode[]) {
    Julia.defaultScopeMode = mode;
    for (let i = 0; i < 10; i++) {
      Julia.scope((julia) => {
        for (let j = 0; j < objectCount; j++) {
          julia.Array.init(julia.Float64, 10);
        }
      });
    }
  }
  Julia.defaultScopeMode = "default";

  // 1. Perf mode (lock-free, fastest)
  console.log("1. Perf Mode (lock-free stack, single-threaded LIFO only)");
  console.log("-".repeat(50));
  results.push(runBenchmark("perf", "perf", objectCount));
  console.log();

  // 2. Default mode (thread-safe, scope-based)
  console.log("2. Default Mode (thread-safe, concurrent async support)");
  console.log("-".repeat(50));
  results.push(runBenchmark("default", "default", objectCount));
  console.log();

  // 3. Safe mode (FinalizationRegistry-based)
  console.log("3. Safe Mode (FinalizationRegistry-based, closure-safe)");
  console.log("-".repeat(50));
  results.push(runBenchmark("safe", "safe", objectCount));
  console.log();

  // 4. Default mode with escape (simulating closure capture)
  console.log("4. Default Mode with escape() (closure simulation)");
  console.log("-".repeat(50));
  results.push(runBenchmark("default+escape", "default", objectCount, true));
  console.log();
}

// Summary table
console.log();
console.log("=".repeat(70));
console.log("Performance Summary Table");
console.log("=".repeat(70));
console.log();

// Group by object count
for (const objectCount of OBJECTS_PER_SCOPE) {
  const filtered = results.filter((r) => r.objectCount === objectCount);
  const perf = filtered.find((r) => r.mode === "perf")!;

  console.log(`Objects per scope: ${objectCount}`);
  console.log("-".repeat(60));
  console.log(
    `${"Mode".padEnd(20)} ${"Per Scope".padStart(12)} ${"vs Perf".padStart(10)} ${"Scopes/s".padStart(12)}`,
  );
  console.log("-".repeat(60));

  for (const r of filtered) {
    const speedup = r.perScope / perf.perScope;
    const speedupStr =
      r.mode === "perf" ? "(baseline)" : `${speedup.toFixed(2)}x`;
    console.log(
      `${r.mode.padEnd(20)} ${(r.perScope.toFixed(3) + " ms").padStart(12)} ${speedupStr.padStart(10)} ${formatNum(r.scopesPerSec).padStart(12)}`,
    );
  }
  console.log();
}

console.log("=".repeat(70));
console.log("Mode Recommendations");
console.log("=".repeat(70));
console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│ Mode     │ Use When                                                │
├─────────────────────────────────────────────────────────────────────┤
│ perf     │ • Single-threaded, synchronous code                     │
│          │ • Strict LIFO scope disposal order                      │
│          │ • Maximum performance critical                          │
│          │ • NO concurrent scopeAsync() or JuliaTask               │
├─────────────────────────────────────────────────────────────────────┤
│ default  │ • General purpose (recommended default)                 │
│          │ • Concurrent Julia.scopeAsync() calls                   │
│          │ • JuliaTask parallelism                                 │
│          │ • Thread-safe operations                                │
├─────────────────────────────────────────────────────────────────────┤
│ safe     │ • Passing Julia objects to callbacks/closures           │
│          │ • Objects captured in setTimeout/setInterval            │
│          │ • When you can't guarantee scope lifetime               │
│          │ • Always used by Julia.scopeAsync() internally          │
└─────────────────────────────────────────────────────────────────────┘

Note: Julia.scopeAsync() always uses "safe" mode internally regardless of 
Julia.defaultScopeMode setting, to prevent race conditions.
`);

Julia.close();
