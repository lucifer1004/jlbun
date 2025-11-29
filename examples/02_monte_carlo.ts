/**
 * Monte Carlo Simulations with jlbun
 *
 * Demonstrates random number generation and statistical calculations.
 * No external packages required - uses only Julia stdlib.
 *
 * Run: bun examples/02_monte_carlo.ts
 */

import { Julia, JuliaArray, JuliaFunction } from "../jlbun/index.js";

Julia.init();

console.log("=== Monte Carlo Simulations ===\n");

// 1. Estimate π
console.log("1. Estimating π (Circle Method)");
console.log("-".repeat(40));

Julia.scope((julia) => {
  julia.eval(`
    function estimate_pi(n::Int)
      inside = 0
      for _ in 1:n
        x, y = rand(), rand()
        if x^2 + y^2 <= 1
          inside += 1
        end
      end
      return 4 * inside / n
    end
  `);

  const N = 1_000_000;
  const start = performance.now();
  const piEst = (julia.Main.estimate_pi as JuliaFunction)(N);
  const elapsed = performance.now() - start;

  console.log(`Samples: ${N.toLocaleString()}`);
  console.log(`Estimated π: ${piEst.value}`);
  console.log(`Actual π:    ${Math.PI}`);
  console.log(
    `Error:       ${Math.abs(Number(piEst.value) - Math.PI).toExponential(2)}`,
  );
  console.log(`Time:        ${elapsed.toFixed(1)} ms`);
});

// 2. Random Walk
console.log("\n2. Random Walk Statistics");
console.log("-".repeat(40));

Julia.scope((julia) => {
  julia.eval("using Statistics");

  julia.eval(`
    function random_walk(n_steps)
      steps = 2 * (rand(n_steps) .> 0.5) .- 1
      return cumsum(steps)
    end
  `);

  const nWalks = 1000;
  const nSteps = 1000;

  // Run multiple walks and collect final positions
  const finalPositions: number[] = [];
  for (let i = 0; i < nWalks; i++) {
    const walk = (julia.Main.random_walk as JuliaFunction)(
      nSteps,
    ) as JuliaArray;
    const vals = walk.value as BigInt64Array;
    finalPositions.push(Number(vals[vals.length - 1]));
  }

  const mean = finalPositions.reduce((a, b) => a + b, 0) / nWalks;
  const variance =
    finalPositions.reduce((a, b) => a + (b - mean) ** 2, 0) / (nWalks - 1);
  const std = Math.sqrt(variance);

  console.log(`Walks: ${nWalks}, Steps: ${nSteps}`);
  console.log(`Mean final position: ${mean.toFixed(2)} (expected: 0)`);
  console.log(
    `Std deviation: ${std.toFixed(2)} (expected: √${nSteps} ≈ ${Math.sqrt(nSteps).toFixed(2)})`,
  );
});

// 3. Monte Carlo Integration
console.log("\n3. Monte Carlo Integration");
console.log("-".repeat(40));

Julia.scope((julia) => {
  // Integrate sin(x) from 0 to π using Monte Carlo
  julia.eval(`
    function mc_integrate_sin(n)
      x = π * rand(n)
      return π * sum(sin.(x)) / n
    end
  `);

  const N = 100_000;
  const result = (julia.Main.mc_integrate_sin as JuliaFunction)(N);

  console.log(`∫ sin(x) dx from 0 to π`);
  console.log(
    `Monte Carlo (${N.toLocaleString()} samples): ${Number(result.value).toFixed(6)}`,
  );
  console.log(`Exact value: 2.000000`);
});

// 4. Buffon's Needle
console.log("\n4. Buffon's Needle (Another π Estimator)");
console.log("-".repeat(40));

Julia.scope((julia) => {
  // Needle length = line spacing = 1
  julia.eval(`
    function buffon_needle(n)
      crossings = 0
      for _ in 1:n
        θ = π * rand()           # Angle [0, π]
        d = 0.5 * rand()         # Distance to nearest line [0, 0.5]
        if d <= 0.5 * sin(θ)
          crossings += 1
        end
      end
      return crossings > 0 ? 2n / crossings : 0.0
    end
  `);

  const N = 100_000;
  const piEst = (julia.Main.buffon_needle as JuliaFunction)(N);

  console.log(`Needle drops: ${N.toLocaleString()}`);
  console.log(`Estimated π: ${Number(piEst.value).toFixed(6)}`);
  console.log(`Actual π:    ${Math.PI.toFixed(6)}`);
});

Julia.close();
console.log("\n✅ Done!");
