/**
 * Complex Numbers with jlbun
 *
 * Demonstrates JuliaComplex for scientific computing.
 * No external packages required.
 *
 * Run: bun examples/04_complex_numbers.ts
 */

import {
  Julia,
  JuliaArray,
  JuliaComplex,
  JuliaFloat64,
} from "../jlbun/index.js";

Julia.init();

console.log("=== Complex Numbers ===\n");

Julia.scope((julia) => {
  // 1. Creating Complex Numbers
  console.log("1. Creating Complex Numbers");
  console.log("-".repeat(40));

  const c1 = JuliaComplex.from(3, 4);
  const c2 = JuliaComplex.fromF32(1, 2);
  const c3 = JuliaComplex.fromPolar(5, Math.PI / 4);

  console.log(`ComplexF64: ${c1} (re=${c1.re}, im=${c1.im})`);
  console.log(`ComplexF32: ${c2}`);
  console.log(
    `From polar (r=5, θ=45°): ${c3.re.toFixed(4)} + ${c3.im.toFixed(4)}im`,
  );

  // 2. Properties
  console.log("\n2. Properties");
  console.log("-".repeat(40));

  console.log(`c1 = ${c1}`);
  console.log(`|c1| = ${c1.abs}`);
  console.log(
    `arg(c1) = ${c1.arg.toFixed(4)} rad = ${((c1.arg * 180) / Math.PI).toFixed(1)}°`,
  );
  console.log(`value = ${JSON.stringify(c1.value)}`);

  // 3. Arithmetic
  console.log("\n3. Arithmetic (via Julia)");
  console.log("-".repeat(40));

  const a = JuliaComplex.from(1, 2);
  const b = JuliaComplex.from(3, 4);

  const sum = julia.Base["+"](a, b) as JuliaComplex;
  const prod = julia.Base["*"](a, b) as JuliaComplex;
  const conj = julia.Base.conj(a) as JuliaComplex;

  console.log(`a = ${a}`);
  console.log(`b = ${b}`);
  console.log(`a + b = ${sum}`);
  console.log(`a * b = ${prod}`);
  console.log(`conj(a) = ${conj}`);

  // 4. Complex Arrays
  console.log("\n4. Complex Arrays");
  console.log("-".repeat(40));

  const complexArray = julia.eval(`[1+2im, 3+4im, 5+6im]`) as JuliaArray;
  console.log("Complex array:");
  julia.Base.display(complexArray);

  const realPart = julia.Base.real(complexArray) as JuliaArray;
  const imagPart = julia.Base.imag(complexArray) as JuliaArray;
  console.log(`Real parts: ${realPart.value}`);
  console.log(`Imag parts: ${imagPart.value}`);

  // 5. Roots of Unity
  console.log("\n5. Roots of Unity (e^(2πik/n))");
  console.log("-".repeat(40));

  const n = 6;
  console.log(`${n}th roots of unity:`);
  for (let k = 0; k < n; k++) {
    const theta = (2 * Math.PI * k) / n;
    const root = JuliaComplex.fromPolar(1, theta);
    console.log(`  k=${k}: ${root.re.toFixed(4)} + ${root.im.toFixed(4)}im`);
  }

  // 6. Mandelbrot Set Check
  console.log("\n6. Mandelbrot Set (Point Check)");
  console.log("-".repeat(40));

  julia.eval(`
    function in_mandelbrot(c, max_iter=100)
      z = complex(0.0, 0.0)
      for i in 1:max_iter
        z = z^2 + c
        abs(z) > 2 && return false
      end
      return true
    end
  `);

  const points = [
    [0, 0],
    [-1, 0],
    [0.25, 0],
    [1, 1],
    [-0.5, 0.5],
  ];

  for (const [re, im] of points) {
    const c = julia.Base.complex(JuliaFloat64.from(re), JuliaFloat64.from(im));
    const inSet = julia.Main.in_mandelbrot(c).value;
    console.log(`(${re}, ${im}): ${inSet ? "✓ in set" : "✗ escapes"}`);
  }
});

Julia.close();
console.log("\n✅ Done!");
