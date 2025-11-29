# jlbun Examples

Lightweight scientific computing examples using **only Julia stdlib**.

## Running Examples

```bash
bun examples/01_linear_algebra.ts
bun examples/02_monte_carlo.ts
bun examples/03_zero_copy.ts
bun examples/04_complex_numbers.ts
```

## Overview

| Example | Topics | Key Features |
|---------|--------|--------------|
| **01_linear_algebra** | Matrix ops, eigenvalues, solve | `LinearAlgebra` stdlib |
| **02_monte_carlo** | π estimation, random walks | Random, Statistics |
| **03_zero_copy** | Memory sharing, views | `JuliaArray`, `JuliaSubArray` |
| **04_complex_numbers** | Complex arithmetic, Mandelbrot | `JuliaComplex` |

## Key Concepts

### Memory Management

All examples use `Julia.scope()` for automatic GC:

```typescript
Julia.scope((julia) => {
  const arr = julia.Array.from(new Float64Array([1, 2, 3]));
  // arr is automatically freed when scope exits
});
```

### Zero-Copy Arrays

TypedArrays share memory directly with Julia:

```typescript
const bunArray = new Float64Array([1, 2, 3]);
const juliaArray = JuliaArray.from(bunArray);
// Modifications in one are visible in the other!
```

### Calling Julia

```typescript
// Direct calls
julia.Base.sum(arr);

// Operators
julia.Base["*"](A, B);

// Custom code
julia.eval(`function foo(x) ... end`);
julia.Main.foo(x);
```
