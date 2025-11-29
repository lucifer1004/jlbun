import { FORMAT_MD, suite } from "@thi.ng/bench";
import { Julia, JuliaArray, JuliaFunction } from "../../jlbun/index.js";

Julia.init({ project: null });

// Pre-create matrices of various sizes and protect from GC
const sizes = [32, 64, 128, 256, 512];

// Create Julia matrices and store in globals to prevent GC
// Also cache JS references to avoid eval in the hot path
const matrices: Record<number, { a: JuliaArray; b: JuliaArray }> = {};

for (const n of sizes) {
  Julia.eval(`
    global matA_${n} = rand(${n}, ${n})
    global matB_${n} = rand(${n}, ${n})
  `);
  // Cache JS references ONCE (not in the benchmark loop!)
  matrices[n] = {
    a: Julia.eval(`matA_${n}`) as JuliaArray,
    b: Julia.eval(`matB_${n}`) as JuliaArray,
  };
  // Also protect from GC by storing in jlbun globals
  Julia.setGlobal(`__bench_a_${n}`, matrices[n].a);
  Julia.setGlobal(`__bench_b_${n}`, matrices[n].b);
}

// Pre-fetch the multiply function to avoid lookup overhead
const mulFn = Julia.Base["*"] as JuliaFunction;
const sumFn = Julia.Base.sum as JuliaFunction;

// Method 1: Pure Julia eval - everything in one string
// Overhead: string parsing + compilation
const pureJuliaEval = (n: number) => {
  return Julia.eval(`sum(matA_${n} * matB_${n})`).value;
};

// Method 2: jlbun FFI with cached references - TRUE FFI overhead test
// No eval in the hot path!
const jlbunFFI = (n: number) => {
  const { a, b } = matrices[n];
  const result = Julia.call(mulFn, a, b) as JuliaArray;
  return Julia.call(sumFn, result)!.value;
};

console.log("\n========================================");
console.log("Matrix Multiplication Performance Test");
console.log("========================================\n");
console.log("Comparing:");
console.log("  1. Pure Julia eval - parse & execute string");
console.log("  2. jlbun FFI - direct function calls (cached matrix refs)\n");

// Run benchmarks for each size
for (const n of sizes) {
  console.log(`\n--- Matrix size: ${n}x${n} ---\n`);

  suite(
    [
      {
        title: `Julia eval (${n}x${n})`,
        fn: () => pureJuliaEval(n),
      },
      {
        title: `jlbun FFI (${n}x${n})`,
        fn: () => jlbunFFI(n),
      },
    ],
    {
      iter: 10,
      size: n <= 128 ? 100 : n <= 256 ? 50 : 20,
      warmup: 10,
      format: FORMAT_MD,
    },
  );
}

// Additional test: measure pure FFI overhead with minimal computation
console.log("\n========================================");
console.log("FFI Overhead Test (minimal computation)");
console.log("========================================\n");

Julia.eval("global tiny = [1.0 1.0; 1.0 1.0]");
const tinyArr = Julia.eval("tiny") as JuliaArray;

suite(
  [
    {
      title: "Pure Julia: sum eval",
      fn: () => Julia.eval("sum(tiny)").value,
    },
    {
      title: "jlbun: sum call",
      fn: () => Julia.call(sumFn, tinyArr)!.value,
    },
  ],
  {
    iter: 50,
    size: 500,
    warmup: 20,
    format: FORMAT_MD,
  },
);

// Test: Array creation overhead
console.log("\n========================================");
console.log("Array Creation Overhead Test");
console.log("========================================\n");

suite(
  [
    {
      title: "Julia eval: create 100x100",
      fn: () => Julia.eval("zeros(100, 100)"),
    },
    {
      title: "jlbun: JuliaArray.init 100x100",
      fn: () => JuliaArray.init(Julia.Float64, 100, 100),
    },
  ],
  {
    iter: 20,
    size: 200,
    warmup: 10,
    format: FORMAT_MD,
  },
);

Julia.close();
