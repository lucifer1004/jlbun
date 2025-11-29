/**
 * Benchmark: JuliaPtr operations performance
 *
 * Measures the overhead of ptr.load(), ptr.store(), and ptr.offset()
 * Uses Julia.scope() for proper memory management.
 */

import { Julia, JuliaPtr } from "../../jlbun/index.js";

Julia.init();

const ITERATIONS = 10000;
const ARRAY_SIZE = 1000;

// Create test data (JS side - no GC needed)
const testData = new Float64Array(ARRAY_SIZE);
for (let i = 0; i < ARRAY_SIZE; i++) {
  testData[i] = i * 1.5;
}

console.log("=".repeat(60));
console.log("JuliaPtr Operations Benchmark");
console.log("=".repeat(60));
console.log(`Iterations: ${ITERATIONS.toLocaleString()}`);
console.log(`Array size: ${ARRAY_SIZE.toLocaleString()}`);
console.log();

// Run all benchmarks inside scope for memory safety
Julia.scope((julia) => {
  const arr = julia.Array.from(testData);
  const ptr = JuliaPtr.fromArray(arr);

  // Warm up
  for (let i = 0; i < 1000; i++) {
    ptr.load(i % ARRAY_SIZE);
  }

  // Benchmark: ptr.load()
  console.log("1. ptr.load() - Read value at offset");
  console.log("-".repeat(40));
  {
    const start = performance.now();
    let sum = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const val = ptr.load(i % ARRAY_SIZE);
      sum += val.value as number;
    }
    const elapsed = performance.now() - start;
    console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
    console.log(
      `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
    );
    console.log(
      `   Ops/sec: ${(ITERATIONS / (elapsed / 1000)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
    );
    console.log(`   (checksum: ${sum.toFixed(2)})`);
  }
  console.log();

  // Benchmark: ptr.store()
  console.log("2. ptr.store() - Write value at offset");
  console.log("-".repeat(40));
  {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      ptr.store(i * 0.5, i % ARRAY_SIZE);
    }
    const elapsed = performance.now() - start;
    console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
    console.log(
      `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
    );
    console.log(
      `   Ops/sec: ${(ITERATIONS / (elapsed / 1000)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
    );
  }
  console.log();

  // Benchmark: ptr.offset()
  console.log("3. ptr.offset() - Create offset pointer");
  console.log("-".repeat(40));
  {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      ptr.offset(i % ARRAY_SIZE);
    }
    const elapsed = performance.now() - start;
    console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
    console.log(
      `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
    );
    console.log(
      `   Ops/sec: ${(ITERATIONS / (elapsed / 1000)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
    );
  }
  console.log();

  // Benchmark: ptr.address (getter)
  console.log("4. ptr.address - Get pointer address");
  console.log("-".repeat(40));
  {
    const start = performance.now();
    let _sum = 0n;
    for (let i = 0; i < ITERATIONS; i++) {
      _sum += ptr.address;
    }
    const elapsed = performance.now() - start;
    console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
    console.log(
      `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
    );
    console.log(
      `   Ops/sec: ${(ITERATIONS / (elapsed / 1000)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
    );
  }
  console.log();

  // Benchmark: Combined operation (typical use case)
  console.log("5. Combined: offset + load (typical pattern)");
  console.log("-".repeat(40));
  {
    const start = performance.now();
    let sum = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const offsetPtr = ptr.offset(i % ARRAY_SIZE);
      const val = offsetPtr.load(0);
      sum += val.value as number;
    }
    const elapsed = performance.now() - start;
    console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
    console.log(
      `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
    );
    console.log(
      `   Ops/sec: ${(ITERATIONS / (elapsed / 1000)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
    );
    console.log(`   (checksum: ${sum.toFixed(2)})`);
  }
  console.log();

  // Comparison: Direct array access via JuliaArray.get()
  console.log("6. Comparison: JuliaArray.get() (baseline)");
  console.log("-".repeat(40));
  {
    const start = performance.now();
    let sum = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      const val = arr.get(i % ARRAY_SIZE);
      sum += val.value as number;
    }
    const elapsed = performance.now() - start;
    console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
    console.log(
      `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
    );
    console.log(
      `   Ops/sec: ${(ITERATIONS / (elapsed / 1000)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
    );
    console.log(`   (checksum: ${sum.toFixed(2)})`);
  }
  console.log();

  // Comparison: Native TypedArray access (theoretical best)
  console.log("7. Comparison: Native TypedArray access (theoretical best)");
  console.log("-".repeat(40));
  {
    const start = performance.now();
    let sum = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      sum += testData[i % ARRAY_SIZE];
    }
    const elapsed = performance.now() - start;
    console.log(`   Total time: ${elapsed.toFixed(2)} ms`);
    console.log(
      `   Per operation: ${((elapsed * 1000) / ITERATIONS).toFixed(3)} µs`,
    );
    console.log(
      `   Ops/sec: ${(ITERATIONS / (elapsed / 1000)).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
    );
    console.log(`   (checksum: ${sum.toFixed(2)})`);
  }
});

console.log();
console.log("=".repeat(60));
console.log("Benchmark complete");
console.log("=".repeat(60));

Julia.close();
