/**
 * Benchmark: SubArray creation performance
 *
 * Compares different methods for creating SubArrays:
 * 1. JuliaArray.view() - instance method wrapper
 * 2. JuliaArray.slice() - instance method wrapper (convenience)
 * 3. JuliaSubArray.view() - static method
 * 4. Julia.Base.view() - direct Julia call
 */

import { Julia, JuliaSubArray } from "../../jlbun/index.js";

Julia.init();

const ITERATIONS = 5000;
const ARRAY_SIZES = [100, 1000, 10000];

// Helper to format numbers with commas
const formatNum = (n: number) =>
  n.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

console.log("=".repeat(70));
console.log("SubArray Creation Benchmark");
console.log("=".repeat(70));
console.log(`Iterations per test: ${formatNum(ITERATIONS)}`);
console.log();

Julia.scope((julia) => {
  for (const size of ARRAY_SIZES) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`Array Size: ${formatNum(size)}`);
    console.log(`${"─".repeat(70)}`);

    // Create test array
    const testData = new Float64Array(size);
    for (let i = 0; i < size; i++) {
      testData[i] = i * 1.5;
    }
    const arr = julia.Array.from(testData);

    // Determine view range (middle 50%)
    const start = Math.floor(size * 0.25);
    const stop = Math.floor(size * 0.75) - 1;
    const viewLength = stop - start + 1;

    console.log(`View range: [${start}, ${stop}] (${viewLength} elements)`);
    console.log();

    // Warm up
    for (let i = 0; i < 100; i++) {
      arr.view([start, stop]);
      arr.slice(start, stop);
      JuliaSubArray.view(arr, [start, stop]);
      Julia.Base.view(arr, Julia.Base.UnitRange(start + 1, stop + 1));
    }

    // 1. JuliaArray.view() instance method
    console.log("1. arr.view([start, stop]) - Instance method");
    console.log("-".repeat(50));
    {
      const start_t = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        arr.view([start, stop]);
      }
      const elapsed = performance.now() - start_t;
      console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
      console.log(
        `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
      );
      console.log(`   Ops/sec: ${formatNum(ITERATIONS / (elapsed / 1000))}`);
    }
    console.log();

    // 2. JuliaArray.slice() instance method
    console.log("2. arr.slice(start, stop) - Instance method (convenience)");
    console.log("-".repeat(50));
    {
      const start_t = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        arr.slice(start, stop);
      }
      const elapsed = performance.now() - start_t;
      console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
      console.log(
        `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
      );
      console.log(`   Ops/sec: ${formatNum(ITERATIONS / (elapsed / 1000))}`);
    }
    console.log();

    // 3. JuliaSubArray.view() static method
    console.log("3. JuliaSubArray.view(arr, ...) - Static method");
    console.log("-".repeat(50));
    {
      const start_t = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        JuliaSubArray.view(arr, [start, stop]);
      }
      const elapsed = performance.now() - start_t;
      console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
      console.log(
        `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
      );
      console.log(`   Ops/sec: ${formatNum(ITERATIONS / (elapsed / 1000))}`);
    }
    console.log();

    // 4. julia.Base.view() with auto-tracking (scope overhead)
    console.log("4. julia.Base.view(arr, range) - With auto-tracking");
    console.log("-".repeat(50));
    {
      // Pre-create and track range
      const range = julia.track(Julia.Base.UnitRange(start + 1, stop + 1));

      const start_t = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        julia.Base.view(arr, range);
      }
      const elapsed = performance.now() - start_t;
      console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
      console.log(
        `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
      );
      console.log(`   Ops/sec: ${formatNum(ITERATIONS / (elapsed / 1000))}`);
    }
    console.log();

    // 5. julia.Base.view() with untracked() (no tracking overhead)
    console.log("5. julia.untracked() + julia.Base.view() - No auto-tracking");
    console.log("-".repeat(50));
    {
      // Pre-create and track range
      const range = julia.track(Julia.Base.UnitRange(start + 1, stop + 1));

      const start_t = performance.now();
      julia.untracked(() => {
        for (let i = 0; i < ITERATIONS; i++) {
          julia.Base.view(arr, range);
        }
      });
      const elapsed = performance.now() - start_t;
      console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
      console.log(
        `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
      );
      console.log(`   Ops/sec: ${formatNum(ITERATIONS / (elapsed / 1000))}`);
    }
    console.log();

    // 6. Julia.Base.view() direct (not through scope proxy)
    console.log("6. Julia.Base.view() - Direct call (no scope proxy)");
    console.log("-".repeat(50));
    {
      const start_t = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        Julia.Base.view(arr, Julia.Base.UnitRange(start + 1, stop + 1));
      }
      const elapsed = performance.now() - start_t;
      console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
      console.log(
        `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
      );
      console.log(`   Ops/sec: ${formatNum(ITERATIONS / (elapsed / 1000))}`);
    }
    console.log();

    // 7. Baseline: Just array length access (minimal overhead)
    console.log("7. Baseline: arr.length (minimal overhead)");
    console.log("-".repeat(50));
    {
      const start_t = performance.now();
      let sum = 0;
      for (let i = 0; i < ITERATIONS; i++) {
        sum += arr.length;
      }
      const elapsed = performance.now() - start_t;
      console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
      console.log(
        `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
      );
      console.log(`   Ops/sec: ${formatNum(ITERATIONS / (elapsed / 1000))}`);
      console.log(`   (checksum: ${sum})`);
    }
  }
});

console.log();
console.log("=".repeat(70));
console.log("Benchmark Summary");
console.log("=".repeat(70));
console.log(`
Key observations:
- arr.view() and arr.slice() are thin wrappers (no scope tracking)
- julia.Base.view() auto-tracks returned objects (memory safe but slower)
- julia.untracked() disables auto-tracking for performance-critical code
- Compare test 4 vs 5 to see tracking overhead
- Julia.Base.view() bypasses scope entirely (fastest but no memory safety)
`);

Julia.close();
