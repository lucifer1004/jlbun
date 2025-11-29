# jlbun - Using Julia in Bun

[![Version](https://img.shields.io/badge/docs-latest-blue.svg)](https://lucifer1004.github.io/jlbun/)
[![NPM](https://img.shields.io/npm/v/jlbun)](https://www.npmjs.com/package/jlbun)
[![Build Status](https://github.com/lucifer1004/jlbun/actions/workflows/CI.yml/badge.svg?branch=main)](https://github.com/lucifer1004/jlbun/actions/workflows/CI.yml?query=branch%3Amain)
[![Coverage](https://codecov.io/gh/lucifer1004/jlbun/branch/main/graph/badge.svg)](https://codecov.io/gh/lucifer1004/jlbun)

![Logo of jlbun](https://user-images.githubusercontent.com/13583761/210193825-4b898ddf-b4b2-4e21-a691-c05240bb81e3.png)

**jlbun** is a high-performance FFI library that brings Julia's computational power to the Bun JavaScript runtime. Call Julia functions directly from TypeScript with zero-copy array sharing and automatic memory management.

## ✨ What's New in v0.2

> **Scope-Based GC & Concurrent Async Support** - The v0.2 release brings a complete GC redesign with scope isolation for safe concurrent async operations.

| Feature | Description |
|---------|-------------|
| 🔀 **Concurrent Async Scopes** | Multiple `Julia.scopeAsync()` can run in parallel safely |
| 🛡️ **Safe Mode** | `Julia.scope(fn, { safe: true })` for automatic closure safety |
| 🔒 **Thread-Safe GC** | All C-layer operations protected by `pthread_mutex_t` |
| 📦 **Scope Isolation** | Each scope has unique ID; release order doesn't matter |

### Breaking Changes from v0.1

- Removed deprecated `GCManager.protect()` / `GCManager.unprotect()` APIs
- Removed legacy `GCManager.mark()` / `GCManager.push()` / `GCManager.release()` APIs
- Escaped objects now use FinalizationRegistry for automatic cleanup

### v0.1 Features (Still Available)

| Feature | Description |
|---------|-------------|
| 🛡️ **`Julia.scope()`** | Automatic tracking and cleanup of Julia objects |
| 🚀 **`julia.untracked()`** | Opt-out for performance-critical loops |
| 📊 **`JuliaRange`** | Native support for `UnitRange`, `StepRange`, `LinRange` |
| 🔍 **`JuliaSubArray`** | Zero-copy array views with `view()` and `slice()` |
| ⚡ **Multi-dimensional Arrays** | Direct N-D array creation with `getAt()`/`setAt()` |

---

## Table of Contents

- [jlbun - Using Julia in Bun](#jlbun---using-julia-in-bun)
  - [✨ What's New in v0.2](#-whats-new-in-v02)
    - [Breaking Changes from v0.1](#breaking-changes-from-v01)
    - [v0.1 Features (Still Available)](#v01-features-still-available)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [Examples](#examples)
  - [Memory Management](#memory-management)
    - [`Julia.scope()` - The Recommended Way](#juliascope---the-recommended-way)
    - [Safe Mode for Closures](#safe-mode-for-closures)
    - [Escaping Values from Scope](#escaping-values-from-scope)
    - [Performance Optimization with `untracked()`](#performance-optimization-with-untracked)
  - [Arrays](#arrays)
    - [Zero-Copy Array Sharing](#zero-copy-array-sharing)
    - [Multi-Dimensional Arrays](#multi-dimensional-arrays)
    - [Array Views (SubArray)](#array-views-subarray)
  - [Ranges](#ranges)
  - [Functions](#functions)
    - [Calling Julia Functions](#calling-julia-functions)
    - [Keyword Arguments](#keyword-arguments)
    - [Calling JS Functions from Julia](#calling-js-functions-from-julia)
  - [Modules \& Packages](#modules--packages)
  - [Multi-Threading](#multi-threading)
  - [Low-Level Operations](#low-level-operations)
  - [Data Types](#data-types)
  - [Error Handling](#error-handling)
  - [Performance](#performance)
    - [Best Practices](#best-practices)
  - [Star History](#star-history)

---

## Installation

> **Requirements**: `Bun`, `CMake`, and `Julia >=1.10`

```bash
npm install jlbun
```

> Note: Use `npm install` instead of `bun install` as the latter doesn't run install scripts.

---

## Quick Start

```typescript
import { Julia } from "jlbun";

Julia.init();

// Evaluate Julia code
Julia.eval('println("Hello from Julia!")');

// Call Julia functions directly
const result = Julia.Base.sum([1, 2, 3, 4, 5]);
console.log(result.value); // 15

Julia.close();
```

---

## Examples

See the `examples/` directory for complete working examples:

```bash
bun examples/01_linear_algebra.ts   # Matrix ops, eigenvalues
bun examples/02_monte_carlo.ts      # π estimation, random walks
bun examples/03_zero_copy.ts        # Memory sharing (core feature)
bun examples/04_complex_numbers.ts  # Complex arithmetic
```

All examples use only Julia stdlib - no package installation required.

---

## Memory Management

### `Julia.scope()` - The Recommended Way

All Julia objects created within a scope are automatically tracked and freed when the scope exits.

```typescript
import { Julia } from "jlbun";

Julia.init();

const result = Julia.scope((julia) => {
  // Create matrices - automatically tracked
  const a = julia.Base.rand(1000, 1000);
  const b = julia.Base.rand(1000, 1000);
  const c = julia.Base["*"](a, b);
  
  // Return a JS value - Julia objects auto-released
  return julia.Base.sum(c).value;
});

console.log(result); // A number; matrices a, b, c are freed

Julia.close();
```

For async operations:

```typescript
const result = await Julia.scopeAsync(async (julia) => {
  const func = julia.eval("() -> sum(1:1000000)");
  const task = JuliaTask.from(func);
  return (await task.value).value;
});
```

### Safe Mode for Closures

**v0.2 introduces safe mode** for code that captures Julia objects in closures or callbacks:

```typescript
// Default mode: objects released at scope end (fast, but closures need escape())
Julia.scope((julia) => {
  const arr = julia.Array.init(julia.Float64, 100);
  // arr is valid here
}); // arr released here

// Safe mode: objects released when JS GC runs (closure-safe)
Julia.scope((julia) => {
  const arr = julia.Array.init(julia.Float64, 100);
  
  // Safe to capture in closures - no explicit escape() needed!
  setTimeout(() => {
    console.log(arr.length); // arr is still valid
  }, 1000);
}, { safe: true }); // arr stays alive until JS GC
```

**When to use safe mode:**
- Passing Julia objects to `setTimeout`, `setInterval`, or event handlers
- Storing Julia objects in arrays/maps that outlive the scope
- Callbacks that may execute after scope ends

**Performance comparison** (1000 iterations, 100 objects/scope):
| Mode | Time/scope | Objects/sec |
|------|------------|-------------|
| Default | 0.027 ms | ~3.7M |
| Safe | 0.063 ms | ~1.5M |

### Escaping Values from Scope

To keep a Julia object alive beyond the scope:

```typescript
// Method 1: Return the JuliaValue directly (auto-escaped)
const arr = Julia.scope((julia) => {
  return julia.Base.rand(100); // Survives scope exit
});
console.log(arr.length); // 100

// Method 2: Explicit escape
const sorted = Julia.scope((julia) => {
  const temp = julia.Base.rand(100);
  const result = julia.Base.sort(temp);
  return julia.escape(result); // Only `result` survives
});
```

### Performance Optimization with `untracked()`

For high-iteration loops, auto-tracking adds overhead. Use `untracked()` to temporarily disable it:

```typescript
Julia.scope((julia) => {
  const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]));
  
  // ~300x faster than tracked calls
  julia.untracked(() => {
    for (let i = 0; i < 10000; i++) {
      const range = julia.Base.UnitRange(1, 5);
      julia.Base.view(arr, range); // Temporary, not tracked
    }
  });
  
  return julia.Base.sum(arr).value;
});
```

**Key behaviors**:
- Only affects current scope (nested `Julia.scope()` calls have independent tracking)
- Tracking resumes after the block, even if an exception is thrown

---

## Arrays

### Zero-Copy Array Sharing

JavaScript `TypedArray` and Julia `Array` share the same memory:

```typescript
import { Julia, JuliaArray } from "jlbun";

Julia.init();

const bunArray = new Float64Array([1, 2, 3, 4, 5]);
const juliaArray = JuliaArray.from(bunArray);

// Modify from JS side
bunArray[0] = 100;
Julia.Base.println(juliaArray); // [100.0, 2.0, 3.0, 4.0, 5.0]

// Modify from Julia side (0-indexed API)
juliaArray.set(1, -1);
console.log(bunArray[1]); // -1

Julia.close();
```

### Multi-Dimensional Arrays

Create N-dimensional arrays directly:

```typescript
const matrix = JuliaArray.init(Julia.Float64, 10, 20);    // 2D: 10x20
const tensor = JuliaArray.init(Julia.Float64, 3, 4, 5);   // 3D: 3x4x5

console.log(matrix.ndims);  // 2
console.log(matrix.size);   // [10, 20]

// Multi-dimensional indexing (0-based)
matrix.setAt(2, 3, 42.0);
console.log(matrix.getAt(2, 3).value); // 42.0
```

> Julia uses **column-major order**. Use `getAt()`/`setAt()` for intuitive multi-dimensional access.

### Array Views (SubArray)

Create zero-copy views with `view()` and `slice()`:

```typescript
const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]));

// Range view (0-based, inclusive)
const sub = arr.view([1, 4]);
console.log(sub.value); // Float64Array [2, 3, 4, 5]

// 1D slice (convenience method)
const slice = arr.slice(2, 5);
console.log(slice.value); // Float64Array [3, 4, 5, 6]

// Views share memory - modifications propagate!
sub.set(0, 100);
console.log(arr.get(1).value); // 100

// Multi-dimensional views
const matrix = JuliaArray.init(Julia.Float64, 4, 4);
const row = matrix.view(0, ":");        // Row 0, all columns
const block = matrix.view([1, 2], [0, 2]); // Rows 1-2, cols 0-2

// Create independent copy when needed
const copy = sub.copy();
```

---

## Ranges

Work with Julia ranges directly:

```typescript
import { Julia, JuliaRange } from "jlbun";

Julia.init();

// Create ranges
const unit = JuliaRange.from(1, 10);       // 1:10
const step = JuliaRange.from(1, 10, 2);    // 1:2:10 → [1, 3, 5, 7, 9]
const lin = JuliaRange.linspace(0, 1, 5);  // LinRange(0.0, 1.0, 5)

// Properties
console.log(unit.length);      // 10
console.log(unit.first.value); // 1n
console.log(step.step.value);  // 2n

// Iteration
for (const val of unit) {
  console.log(val.value);
}

// Use with Julia functions
console.log(Julia.Base.sum(unit).value); // 55n

Julia.close();
```

---

## Functions

### Calling Julia Functions

```typescript
// Direct function calls
const result = Julia.Base.sqrt(2);
console.log(result.value); // 1.4142135623730951

// Operators as functions
const product = Julia.Base["*"](matrix1, matrix2);

// Import modules
const LA = Julia.import("LinearAlgebra");
console.log(LA.norm(vector).value);
```

### Keyword Arguments

```typescript
const arr = JuliaArray.from(new Int32Array([1, 10, 20, 30, 100]));
Julia.Base["sort!"].callWithKwargs({ by: Julia.Base.string, rev: true }, arr);
// Result: [30, 20, 100, 10, 1]
```

### Calling JS Functions from Julia

```typescript
import { Julia, JuliaArray, JuliaFunction } from "jlbun";

Julia.init();

const negate = JuliaFunction.from((x: number) => -x, {
  returns: "i32",
  args: ["i32"],
});

const arr = JuliaArray.from(new Int32Array([1, 2, 3]));
const neg = arr.map(negate);
Julia.println(neg); // Int32[-1, -2, -3]

negate.close(); // Optional: auto-cleaned when GC'd

Julia.close();
```

---

## Modules & Packages

```typescript
// Install packages
Julia.Pkg.add("CairoMakie");

// Import modules
const Cairo = Julia.import("CairoMakie");

// Use
const plt = Cairo.plot(Julia.Base.rand(10), Julia.Base.rand(10));
Cairo.save("plot.png", plt);
```

---

## Multi-Threading

Set `JULIA_NUM_THREADS` before running:

```bash
export JULIA_NUM_THREADS=8
```

```typescript
import { Julia, JuliaFunction, JuliaTask, JuliaValue } from "jlbun";

Julia.init();

const func = Julia.eval(`() -> sum(1:1000)`);
const promises: Promise<JuliaValue>[] = [];

for (let i = 0; i < Julia.nthreads; i++) {
  promises.push(JuliaTask.from(func).schedule(i).value);
}

const results = await Promise.all(promises);
console.log(results.map(r => r.value)); // [500500n, 500500n, ...]

Julia.close();
```

---

## Low-Level Operations

`JuliaPtr` provides access to Julia's `Ptr{T}` type:

```typescript
import { Julia, JuliaArray, JuliaPtr } from "jlbun";

Julia.init();

const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
const ptr = JuliaPtr.fromArray(arr);

// Read/write (0-based)
console.log(ptr.load(0).value); // 1.0
ptr.store(99.0, 1);

// Pointer arithmetic
const ptr2 = ptr.offset(2);
console.log(ptr2.load(0).value); // 3.0

Julia.close();
```

> ⚠️ **Warning**: `load()` and `store()` are unsafe operations.

---

## Data Types

jlbun provides TypeScript wrappers for Julia's primitive types:

| TypeScript | Julia | JS Value |
|------------|-------|----------|
| `JuliaInt8/16/32` | `Int8/16/32` | `number` |
| `JuliaInt64` | `Int64` | `bigint` |
| `JuliaUInt8/16/32` | `UInt8/16/32` | `number` |
| `JuliaUInt64` | `UInt64` | `bigint` |
| `JuliaFloat16` | `Float16` | `number` |
| `JuliaFloat32` | `Float32` | `number` |
| `JuliaFloat64` | `Float64` | `number` |
| `JuliaComplex` | `ComplexF64/F32/F16` | `{re, im}` |
| `JuliaString` | `String` | `string` |
| `JuliaBool` | `Bool` | `boolean` |
| `JuliaChar` | `Char` | `string` |
| `JuliaSymbol` | `Symbol` | `Symbol` |

```typescript
import { JuliaFloat16, JuliaInt64, JuliaComplex } from "jlbun";

// Create from JavaScript
const f16 = JuliaFloat16.from(3.14);  // Float16 with ~3 decimal precision
const i64 = JuliaInt64.from(9007199254740993n);  // BigInt for large integers

// Access value
console.log(f16.value);  // 3.140625 (Float16 precision)
console.log(i64.value);  // 9007199254740993n

// Complex numbers
const c = JuliaComplex.from(3, 4);     // 3 + 4im (ComplexF64)
console.log(c.re, c.im);               // 3, 4
console.log(c.abs);                    // 5 (magnitude)
console.log(c.arg);                    // 0.927... (phase in radians)
console.log(c.value);                  // { re: 3, im: 4 }

// Different precisions
const c32 = JuliaComplex.fromF32(1, 2);  // ComplexF32
const c16 = JuliaComplex.fromF16(1, 2);  // ComplexF16

// From polar form
const polar = JuliaComplex.fromPolar(5, Math.PI / 4);  // r=5, θ=45°
```

---

## Error Handling

Julia exceptions are automatically mapped to TypeScript error classes:

```typescript
import { BoundsError, DomainError, JuliaError } from "jlbun";

try {
  Julia.Base.sqrt(-1);
} catch (e) {
  if (e instanceof DomainError) {
    console.log("Domain error:", e.message);
  } else if (e instanceof JuliaError) {
    console.log("Julia error type:", e.juliaType);
  }
}
```

| Error Class | Julia Type | Trigger |
|-------------|------------|---------|
| `MethodError` | `MethodError` | No method matches arguments |
| `BoundsError` | `BoundsError` | Array index out of bounds |
| `DomainError` | `DomainError` | Invalid domain (e.g., `sqrt(-1)`) |
| `DivideError` | `DivideError` | Integer division by zero |
| `KeyError` | `KeyError` | Missing dictionary key |
| `ArgumentError` | `ArgumentError` | Invalid function argument |
| `TypeError` | `TypeError` | Wrong argument type |
| `UndefVarError` | `UndefVarError` | Undefined variable |
| `DimensionMismatch` | `DimensionMismatch` | Array dimension mismatch |
| `InexactError` | `InexactError` | Cannot convert exactly |
| `UnknownJuliaError` | *(other)* | Check `e.juliaType` |

All error classes inherit from `JuliaError`, which provides a `juliaType` property containing the original Julia exception type name.

---

## Performance

jlbun is optimized for minimal FFI overhead:

| Optimization | Description |
|--------------|-------------|
| **Type Pointer Comparison** | O(1) type checking for primitives |
| **Type String Cache** | Avoids repeated FFI calls |
| **Zero-Copy Arrays** | Memory sharing with TypedArray |
| **Direct FFI Calls** | 8-260x faster than `Julia.eval()` |

### Best Practices

```typescript
// ❌ Slow: string parsing
const arr = Julia.eval("zeros(1000, 1000)");

// ✅ Fast: direct FFI
const arr = Julia.Base.zeros(Julia.Float64, 1000, 1000);

// ✅ Fastest: uninitialized
const arr = JuliaArray.init(Julia.Float64, 1000, 1000);
```

| Use Case | Recommended |
|----------|-------------|
| Zero-initialized | `Julia.Base.zeros(type, dims...)` |
| Fill with value | `Julia.Base.fill(value, dims...)` |
| Will overwrite all | `JuliaArray.init(type, dims...)` |
| From TypedArray | `JuliaArray.from(typedArray)` |

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=lucifer1004/jlbun&type=Date)](https://star-history.com/#lucifer1004/jlbun&Date)
