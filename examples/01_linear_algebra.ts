/**
 * Linear Algebra with jlbun
 *
 * Demonstrates matrix operations using Julia's built-in LinearAlgebra.
 * No external packages required - uses only Julia stdlib.
 *
 * Run: bun examples/01_linear_algebra.ts
 */

import { Julia, JuliaArray } from "../jlbun/index.js";

Julia.init();

console.log("=== Linear Algebra Examples ===\n");

Julia.scope((julia) => {
  julia.eval("using LinearAlgebra");

  // 1. Matrix Creation
  console.log("1. Matrix Creation (Column-Major Order)");
  console.log("-".repeat(40));

  // Julia uses column-major order
  const data = new Float64Array([
    1,
    4,
    7, // Column 1
    2,
    5,
    8, // Column 2
    3,
    6,
    9, // Column 3
  ]);
  const A = julia.Array.from(data).reshape(3, 3);

  console.log("Matrix A (3×3):");
  julia.Base.display(A);

  // 2. Basic Operations
  console.log("\n2. Basic Operations");
  console.log("-".repeat(40));

  const At = julia.Base.transpose(A);
  console.log("A':");
  julia.Base.display(At);

  const AtA = julia.Base["*"](At, A);
  console.log("A' * A:");
  julia.Base.display(AtA);

  // 3. Solving Linear Systems
  console.log("\n3. Solving Ax = b");
  console.log("-".repeat(40));

  const B = julia.eval(`[4.0 1.0; 1.0 3.0]`) as JuliaArray;
  const b = julia.Array.from(new Float64Array([1, 2]));

  console.log("B:");
  julia.Base.display(B);
  console.log("b:", b.value);

  const x = julia.Base["\\"](B, b);
  console.log("x = B \\ b:", (x as JuliaArray).value);

  // 4. Eigenvalues
  console.log("\n4. Eigenvalues");
  console.log("-".repeat(40));

  const C = julia.eval(`[2.0 1.0; 1.0 2.0]`); // Symmetric matrix
  console.log("C (symmetric):");
  julia.Base.display(C);

  const eigvals = julia.Main.eigvals(C);
  console.log("Eigenvalues:", (eigvals as JuliaArray).value);

  // 5. Determinant & Norm
  console.log("\n5. Determinant & Norm");
  console.log("-".repeat(40));

  const det = julia.Main.det(B).value;
  const normB = julia.Main.norm(B).value;
  console.log(`det(B) = ${det}`);
  console.log(`norm(B) = ${normB}`);

  // 6. Performance: Large Matrix
  console.log("\n6. Performance: 1000×1000 Matrix Multiply");
  console.log("-".repeat(40));

  const start = performance.now();
  const M1 = julia.Base.rand(1000, 1000);
  const M2 = julia.Base.rand(1000, 1000);
  const M3 = julia.Base["*"](M1, M2);
  const sum = julia.Base.sum(M3).value;
  const elapsed = performance.now() - start;

  console.log(`Time: ${elapsed.toFixed(1)} ms`);
  console.log(`Sum: ${sum}`);
});

Julia.close();
console.log("\n✅ Done!");
