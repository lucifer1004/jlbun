/**
 * Zero-Copy Array Operations with jlbun
 *
 * Demonstrates memory sharing between Bun and Julia.
 * This is a core feature enabling efficient data exchange.
 *
 * Run: bun examples/03_zero_copy.ts
 */

import { Julia, JuliaArray } from "../jlbun/index.js";

Julia.init();

console.log("=== Zero-Copy Array Operations ===\n");

// 1. Memory Sharing
console.log("1. Memory Sharing");
console.log("-".repeat(40));

Julia.scope((julia) => {
  const bunArray = new Float64Array([1, 2, 3, 4, 5]);
  const juliaArray = julia.Array.from(bunArray);

  console.log("Original:", bunArray);

  // Modify from Bun
  bunArray[0] = 100;
  console.log("After bunArray[0] = 100:");
  console.log("  Bun:", bunArray);
  console.log("  Julia:", juliaArray.value);

  // Modify from Julia
  julia.Base["setindex!"](juliaArray, 999, 3);
  console.log("After Julia setindex!(arr, 999, 3):");
  console.log("  Bun:", bunArray);
  console.log("  Julia:", juliaArray.value);

  console.log("\n→ Same memory, zero copying!");
});

// 2. Multi-dimensional Arrays
console.log("\n2. Multi-dimensional Arrays");
console.log("-".repeat(40));

Julia.scope((julia) => {
  const matrix = julia.Array.init(julia.Float64, 3, 4);

  // Fill (Julia is column-major)
  let val = 1;
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 3; row++) {
      matrix.setAt(row, col, val++);
    }
  }

  console.log("3×4 Matrix:");
  julia.Base.display(matrix);

  console.log(`\nDimensions: ${matrix.ndims}D`);
  console.log(`Size: (${matrix.size.join(", ")})`);
  console.log(`matrix[1,2] = ${matrix.getAt(1, 2).value}`);
});

// 3. SubArray Views
console.log("\n3. SubArray Views (Zero-Copy Slicing)");
console.log("-".repeat(40));

Julia.scope((julia) => {
  const arr = julia.Array.from(
    new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
  );
  console.log("Original:", arr.value);

  // Create view
  const view = arr.slice(2, 6);
  console.log(`slice(2, 6): ${view.value}`);

  // Modify through view
  view.fill(0);
  console.log(`After view.fill(0):`);
  console.log(`  Original: ${arr.value}`);
  console.log("\n→ Views share memory with parent!");
});

// 4. Performance Comparison
console.log("\n4. Performance: Zero-Copy vs Copy");
console.log("-".repeat(40));

Julia.scope((julia) => {
  const size = 1_000_000;
  const data = new Float64Array(size);
  for (let i = 0; i < size; i++) data[i] = i;

  // Zero-copy
  const t1 = performance.now();
  for (let i = 0; i < 100; i++) {
    JuliaArray.from(data);
  }
  const zeroCopy = (performance.now() - t1) / 100;

  // With copy
  const t2 = performance.now();
  for (let i = 0; i < 100; i++) {
    julia.Base.copy(JuliaArray.from(data));
  }
  const withCopy = (performance.now() - t2) / 100;

  console.log(`Array size: ${size.toLocaleString()} Float64`);
  console.log(`Zero-copy: ${zeroCopy.toFixed(3)} ms`);
  console.log(`With copy: ${withCopy.toFixed(3)} ms`);
  console.log(`Speedup:   ${(withCopy / zeroCopy).toFixed(1)}x`);
});

// 5. TypedArray Types
console.log("\n5. Supported TypedArray Types");
console.log("-".repeat(40));

Julia.scope((julia) => {
  const types = [
    ["Int32Array", new Int32Array([1, 2, 3])],
    ["BigInt64Array", new BigInt64Array([1n, 2n, 3n])],
    ["Float32Array", new Float32Array([1.1, 2.2, 3.3])],
    ["Float64Array", new Float64Array([1.1, 2.2, 3.3])],
  ] as const;

  for (const [name, arr] of types) {
    const jArr = JuliaArray.from(arr);
    const eltype = julia.Base.eltype(jArr).toString();
    console.log(`${name.padEnd(14)} → ${eltype}`);
  }
});

Julia.close();
console.log("\n✅ Done!");
