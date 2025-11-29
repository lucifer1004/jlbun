/**
 * Benchmark: GC Mode Performance Comparison
 *
 * Compares two GC management modes:
 * 1. Default (fast) mode - Stack-based release at scope end
 * 2. Safe mode - FinalizationRegistry-based, closure-safe
 *
 * Key differences:
 * - Default: O(1) release at scope end, but closures need explicit escape()
 * - Safe: All objects managed by FinalizationRegistry, closure-safe but slower
 */

import { Julia, JuliaArray } from "../../jlbun/index.js";

Julia.init();

const ITERATIONS = 1000;
const OBJECTS_PER_SCOPE = [10, 50, 100, 500];

// Helper to format numbers with commas
const formatNum = (n: number) =>
  n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

console.log("=".repeat(70));
console.log("GC Mode Performance Benchmark");
console.log("=".repeat(70));
console.log(`Scope iterations: ${formatNum(ITERATIONS)}`);
console.log();

for (const objectCount of OBJECTS_PER_SCOPE) {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`Objects per scope: ${objectCount}`);
  console.log(`${"─".repeat(70)}\n`);

  // Warm up
  for (let i = 0; i < 10; i++) {
    Julia.scope((julia) => {
      for (let j = 0; j < objectCount; j++) {
        julia.Array.init(julia.Float64, 10);
      }
    });
    Julia.scope(
      (julia) => {
        for (let j = 0; j < objectCount; j++) {
          julia.Array.init(julia.Float64, 10);
        }
      },
      { safe: true },
    );
  }

  // 1. Default mode (fast, stack-based)
  console.log("1. Default Mode (stack-based release)");
  console.log("-".repeat(50));
  {
    const start_t = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      Julia.scope((julia) => {
        for (let j = 0; j < objectCount; j++) {
          julia.Array.init(julia.Float64, 10);
        }
      });
    }
    const elapsed = performance.now() - start_t;
    const totalOps = ITERATIONS * objectCount;
    console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
    console.log(`   Per scope: ${(elapsed / ITERATIONS).toFixed(3)} ms`);
    console.log(
      `   Per object: ${((elapsed * 1000) / totalOps).toFixed(3)} µs`,
    );
    console.log(`   Scopes/sec: ${formatNum(ITERATIONS / (elapsed / 1000))}`);
  }
  console.log();

  // 2. Safe mode (FinalizationRegistry-based)
  console.log("2. Safe Mode (FinalizationRegistry-based)");
  console.log("-".repeat(50));
  {
    const start_t = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      Julia.scope(
        (julia) => {
          for (let j = 0; j < objectCount; j++) {
            julia.Array.init(julia.Float64, 10);
          }
        },
        { safe: true },
      );
    }
    const elapsed = performance.now() - start_t;
    const totalOps = ITERATIONS * objectCount;
    console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
    console.log(`   Per scope: ${(elapsed / ITERATIONS).toFixed(3)} ms`);
    console.log(
      `   Per object: ${((elapsed * 1000) / totalOps).toFixed(3)} µs`,
    );
    console.log(`   Scopes/sec: ${formatNum(ITERATIONS / (elapsed / 1000))}`);
  }
  console.log();

  // 3. Default mode with escape (simulating closure capture)
  console.log("3. Default Mode with escape() (closure simulation)");
  console.log("-".repeat(50));
  {
    const escaped: JuliaArray[] = [];
    const start_t = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      Julia.scope((julia) => {
        for (let j = 0; j < objectCount; j++) {
          const arr = julia.Array.init(julia.Float64, 10);
          if (j === 0) {
            // Escape one object per scope
            escaped.push(julia.escape(arr));
          }
        }
      });
    }
    const elapsed = performance.now() - start_t;
    const totalOps = ITERATIONS * objectCount;
    console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
    console.log(`   Per scope: ${(elapsed / ITERATIONS).toFixed(3)} ms`);
    console.log(
      `   Per object: ${((elapsed * 1000) / totalOps).toFixed(3)} µs`,
    );
    console.log(`   Scopes/sec: ${formatNum(ITERATIONS / (elapsed / 1000))}`);
    console.log(`   (Escaped objects: ${escaped.length})`);
  }
  console.log();
}

console.log();
console.log("=".repeat(70));
console.log("Benchmark Summary");
console.log("=".repeat(70));
console.log(`
Key observations:

1. Default Mode (stack-based):
   - Fastest scope disposal (single release() call)
   - Objects released immediately at scope end
   - ⚠️ Closures capturing Julia objects need explicit escape()

2. Safe Mode (FinalizationRegistry):
   - Slower (registers each object individually)
   - Objects released when JS GC runs
   - ✅ Safe with closures - no explicit escape() needed

3. Default + escape():
   - Similar to default, but escaped objects registered with FinalizationRegistry
   - Best for: known closure patterns

Recommendations:
- Use default mode for simple computations (no closures)
- Use safe mode when passing Julia objects to callbacks/closures
`);

Julia.close();
