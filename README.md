# jlbun - Using Julia in Bun

[![Version](https://img.shields.io/badge/docs-latest-blue.svg)](https://lucifer1004.github.io/jlbun/)
[![NPM](https://img.shields.io/npm/v/jlbun)](https://www.npmjs.com/package/jlbun)
[![Build Status](https://github.com/lucifer1004/jlbun/actions/workflows/CI.yml/badge.svg?branch=main)](https://github.com/lucifer1004/jlbun/actions/workflows/CI.yml?query=branch%3Amain)
[![Coverage](https://codecov.io/gh/lucifer1004/jlbun/branch/main/graph/badge.svg)](https://codecov.io/gh/lucifer1004/jlbun)

![Logo of jlbun](https://user-images.githubusercontent.com/13583761/210193825-4b898ddf-b4b2-4e21-a691-c05240bb81e3.png)

**jlbun** is a high-performance FFI library that brings Julia's computational power to the Bun JavaScript runtime. Call Julia functions directly from TypeScript with zero-copy array sharing and automatic memory management.

## What's New in v0.3 (Unreleased)

> **Scope-First Julia Object Lifetimes** - v0.3 makes scope ownership the public lifecycle boundary. Any Julia object pointer exposed to JavaScript must be owned by an active `Julia.scope()` / `Julia.scopeAsync()` or explicitly escaped by returning it from the scope or calling `julia.escape()`.

| Feature                   | Description                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scope-required APIs**   | `Julia.eval()`, `Julia.call()`, `Julia.import()`, `Julia.wrapPtr()`, `Julia.Base.*`, and wrapper constructors now throw `ScopeRequiredError` without an active scope |
| **Explicit escape model** | Return a `JuliaValue` from `Julia.scope()` or call `julia.escape(value)` to keep it alive after scope exit                                                           |
| **Unsafe namespace**      | `Julia.unsafe.*` remains available for bootstrap, debugging, and low-level code that accepts no lifecycle guarantees                                                 |
| **Ownership checks**      | Returning a `JuliaValue` from `julia.untracked()` throws `ScopeOwnershipError`                                                                                       |
| **Safer FFI rooting**     | Raw return pointers, exceptions, call arguments, C helper temporaries, and zero-copy array owners are rooted before they can be collected                            |

### Breaking Changes from v0.2

- Object-producing static APIs are no longer ordinary user entry points outside an active scope.
- Static module access such as `Julia.Base.sum([1, 2, 3])` must run inside `Julia.scope()` or `Julia.scopeAsync()`.
- `julia.untracked()` is for temporary work only; returning or escaping untracked `JuliaValue` objects now throws `ScopeOwnershipError`.
- `Julia.setGlobal()` and `Julia.deleteGlobal()` are legacy/unsafe lifecycle tools. Prefer scope return values or `julia.escape()`.
- Module property access wraps values by their actual Julia type; only actual Julia functions are returned as `JuliaFunction`.
- Module globals accessed with `Julia.Base.foo` / `module.foo` are object-producing lookups and require an active scope unless they are already runtime-cached functions, types, or modules.

### v0.2/v0.1 Features (Still Available)

| Feature                         | Description                                                            |
| ------------------------------- | ---------------------------------------------------------------------- |
| 🛡️ **`Julia.scope()`**          | Automatic tracking and cleanup of Julia objects                        |
| 🚀 **`julia.untracked()`**      | Opt-out for performance-critical loops                                 |
| 📊 **`JuliaRange`**             | Native support for `UnitRange`, `StepRange`, `LinRange`                |
| 🔍 **`JuliaSubArray`**          | Zero-copy array views with `view()` and `slice()`                      |
| ⚡ **Multi-dimensional Arrays** | Direct N-D array creation with `getAt()`/`setAt()`                     |
| 🔀 **Concurrent Async Scopes**  | Multiple `Julia.scopeAsync()` calls can run in parallel safely         |
| 🛡️ **Safe Mode**                | `Julia.scope(fn, { mode: "safe" })` for closure safety                 |
| ⚡ **Perf Mode**                | `Julia.scope(fn, { mode: "perf" })` for single-threaded LIFO hot paths |

---

## Table of Contents

- [jlbun - Using Julia in Bun](#jlbun---using-julia-in-bun)
  - [What's New in v0.3 (Unreleased)](#whats-new-in-v03-unreleased)
    - [Breaking Changes from v0.2](#breaking-changes-from-v02)
    - [v0.2/v0.1 Features (Still Available)](#v02v01-features-still-available)
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

const result = Julia.scope((julia) => {
  // Evaluate Julia code
  julia.eval('println("Hello from Julia!")');

  // Call Julia functions directly
  return julia.Base.sum([1, 2, 3, 4, 5]).value;
});

console.log(result); // 15n

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
In v0.3, object-producing APIs such as `Julia.eval()`, `Julia.call()`, `Julia.import()`,
`Julia.wrapPtr()`, `Julia.Base.*`, and direct constructors like `JuliaArray.from()` require an
active `Julia.scope()` or `Julia.scopeAsync()` context. Calling them without a scope throws
`ScopeRequiredError`.

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
import { Julia, JuliaTask } from "jlbun";

const result = await Julia.scopeAsync(async (julia) => {
  const func = julia.eval("() -> sum(1:1000000)");
  const task = JuliaTask.from(func);
  return (await task.value).value;
});
```

### Safe Mode for Closures

Use safe mode for code that captures Julia objects in closures or callbacks:

```typescript
// Default mode: objects released at scope end (fast, but closures need escape())
Julia.scope((julia) => {
  const arr = julia.Array.init(julia.Float64, 100);
  // arr is valid here
}); // arr released here

// Safe mode: objects released when JS GC runs (closure-safe)
Julia.scope(
  (julia) => {
    const arr = julia.Array.init(julia.Float64, 100);

    // Safe to capture in closures - no explicit escape() needed!
    setTimeout(() => {
      console.log(arr.length); // arr is still valid
    }, 1000);
  },
  { mode: "safe" },
); // arr stays alive until JS GC
```

### Choosing the Right Mode

| Scenario                                | Recommended Mode        |
| --------------------------------------- | ----------------------- |
| General purpose / unsure                | `default`               |
| High-performance batch processing       | `perf`                  |
| Closures / callbacks (setTimeout, etc.) | `safe`                  |
| `JuliaTask` parallelism / async work    | `scopeAsync()` (`safe`) |
| Simple synchronous loops                | `perf`                  |

```typescript
// Set default mode globally
Julia.defaultScopeMode = "perf";

// All subsequent scopes use perf mode
Julia.scope((julia) => { ... });

// Override for specific scope
Julia.scope((julia) => { ... }, { mode: "safe" });
```

**Mode characteristics:**

| Mode      | Thread-Safe | Closure-Safe | Release Timing                           | Performance |
| --------- | ----------- | ------------ | ---------------------------------------- | ----------- |
| `perf`    | No          | No           | Scope exit, LIFO stack release           | Fastest     |
| `default` | Yes         | No           | Scope exit by `scope_id`                 | Good        |
| `safe`    | Yes         | Yes          | JavaScript GC via `FinalizationRegistry` | Slower      |

> **Note**: `Julia.scopeAsync()` always uses `safe` mode internally.

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
- Returning a `JuliaValue` from `untracked()` throws `ScopeOwnershipError`
- Tracking resumes after the block, even if an exception is thrown

### Unsafe / Legacy APIs

`Julia.unsafe.eval()`, `Julia.unsafe.call()`, `Julia.unsafe.import()`, and
`Julia.unsafe.wrapPtr()` are reserved for bootstrap, debugging, and low-level code. They do not
establish scope ownership and do not make values safe across Julia GC.

`Julia.setGlobal()` and `Julia.deleteGlobal()` remain available for legacy code, but scoped
return values and `julia.escape()` are the supported way to keep Julia objects alive.

---

## Arrays

### Zero-Copy Array Sharing

JavaScript `TypedArray` and Julia `Array` share the same memory:

```typescript
import { Julia } from "jlbun";

Julia.init();

Julia.scope((julia) => {
  const bunArray = new Float64Array([1, 2, 3, 4, 5]);
  const juliaArray = julia.Array.from(bunArray);

  // Modify from JS side
  bunArray[0] = 100;
  julia.Base.println(juliaArray); // [100.0, 2.0, 3.0, 4.0, 5.0]

  // Modify from Julia side (0-indexed API)
  juliaArray.set(1, -1);
  console.log(bunArray[1]); // -1
});

Julia.close();
```

### Multi-Dimensional Arrays

Create N-dimensional arrays directly:

```typescript
Julia.scope((julia) => {
  const matrix = julia.Array.init(julia.Float64, 10, 20); // 2D: 10x20
  const tensor = julia.Array.init(julia.Float64, 3, 4, 5); // 3D: 3x4x5

  console.log(matrix.ndims); // 2
  console.log(matrix.size); // [10, 20]

  // Multi-dimensional indexing (0-based)
  matrix.setAt(2, 3, 42.0);
  console.log(matrix.getAt(2, 3).value); // 42.0
});
```

> Julia uses **column-major order**. Use `getAt()`/`setAt()` for intuitive multi-dimensional access.

### Array Views (SubArray)

Create zero-copy views with `view()` and `slice()`:

```typescript
Julia.scope((julia) => {
  const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]));

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
  const matrix = julia.Array.init(julia.Float64, 4, 4);
  const row = matrix.view(0, ":"); // Row 0, all columns
  const block = matrix.view([1, 2], [0, 2]); // Rows 1-2, cols 0-2

  // Create independent copy when needed
  const copy = sub.copy();
});
```

---

## Ranges

Work with Julia ranges directly:

```typescript
import { Julia, JuliaRange } from "jlbun";

Julia.init();

Julia.scope((julia) => {
  // Create ranges
  const unit = JuliaRange.from(1, 10); // 1:10
  const step = JuliaRange.from(1, 10, 2); // 1:2:10 -> [1, 3, 5, 7, 9]
  const lin = JuliaRange.linspace(0, 1, 5); // LinRange(0.0, 1.0, 5)

  // Properties
  console.log(unit.length); // 10
  console.log(unit.first.value); // 1n
  console.log(step.step.value); // 2n

  // Iteration
  for (const val of unit) {
    console.log(val.value);
  }

  // Use with Julia functions
  console.log(julia.Base.sum(unit).value); // 55n
});

Julia.close();
```

---

## Functions

### Calling Julia Functions

```typescript
Julia.scope((julia) => {
  // Direct function calls
  const result = julia.Base.sqrt(2);
  console.log(result.value); // 1.4142135623730951

  // Operators as functions
  const product = julia.Base["*"](matrix1, matrix2);

  // Import modules
  const LA = julia.import("LinearAlgebra");
  console.log(LA.norm(vector).value);
});
```

### Keyword Arguments

```typescript
Julia.scope((julia) => {
  const arr = julia.Array.from(new Int32Array([1, 10, 20, 30, 100]));
  julia.Base["sort!"].callWithKwargs({ by: julia.Base.string, rev: true }, arr);
  // Result: [30, 20, 100, 10, 1]
});
```

### Calling JS Functions from Julia

```typescript
import { Julia, JuliaFunction } from "jlbun";

Julia.init();

Julia.scope((julia) => {
  const negate = JuliaFunction.from((x: number) => -x, {
    returns: "i32",
    args: ["i32"],
  });

  const arr = julia.Array.from(new Int32Array([1, 2, 3]));
  const neg = arr.map(negate);
  julia.Base.println(neg); // Int32[-1, -2, -3]

  negate.close(); // Optional: auto-cleaned when GC'd
});

Julia.close();
```

---

## Modules & Packages

```typescript
Julia.scope((julia) => {
  // Install packages
  julia.Pkg.add("CairoMakie");

  // Import modules
  const Cairo = julia.import("CairoMakie");

  // Use
  const plt = Cairo.plot(julia.Base.rand(10), julia.Base.rand(10));
  Cairo.save("plot.png", plt);
});
```

Module property access follows the same scope-first lifecycle as other object-producing APIs.
Functions, data types, and modules may be cached as runtime-stable wrappers, but ordinary globals
are returned as scope-owned values so Julia rebinding remains observable. Access ordinary globals
inside `Julia.scope()` / `Julia.scopeAsync()`, or explicitly return/escape the value if it must
outlive the scope.

---

## Multi-Threading

Set `JULIA_NUM_THREADS` before running:

```bash
export JULIA_NUM_THREADS=8
```

```typescript
import { Julia, JuliaFunction, JuliaTask, JuliaValue } from "jlbun";

Julia.init();

const results = await Julia.scopeAsync(async (julia) => {
  const func = julia.eval(`() -> sum(1:1000)`);
  const promises: Promise<JuliaValue>[] = [];

  for (let i = 0; i < julia.nthreads; i++) {
    promises.push(JuliaTask.from(func).schedule(i).value);
  }

  return Promise.all(promises);
});
console.log(results.map((r) => r.value)); // [500500n, 500500n, ...]

Julia.close();
```

---

## Low-Level Operations

`JuliaPtr` provides access to Julia's `Ptr{T}` type:

```typescript
import { Julia, JuliaPtr } from "jlbun";

Julia.init();

Julia.scope((julia) => {
  const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));
  const ptr = JuliaPtr.fromArray(arr);

  // Read/write (0-based)
  console.log(ptr.load(0).value); // 1.0
  ptr.store(99.0, 1);

  // Pointer arithmetic
  const ptr2 = ptr.offset(2);
  console.log(ptr2.load(0).value); // 3.0
});

Julia.close();
```

> ⚠️ **Warning**: `load()` and `store()` are unsafe operations.

---

## Data Types

jlbun provides TypeScript wrappers for Julia's primitive types:

| TypeScript         | Julia                | JS Value   |
| ------------------ | -------------------- | ---------- |
| `JuliaInt8/16/32`  | `Int8/16/32`         | `number`   |
| `JuliaInt64`       | `Int64`              | `bigint`   |
| `JuliaUInt8/16/32` | `UInt8/16/32`        | `number`   |
| `JuliaUInt64`      | `UInt64`             | `bigint`   |
| `JuliaFloat16`     | `Float16`            | `number`   |
| `JuliaFloat32`     | `Float32`            | `number`   |
| `JuliaFloat64`     | `Float64`            | `number`   |
| `JuliaComplex`     | `ComplexF64/F32/F16` | `{re, im}` |
| `JuliaString`      | `String`             | `string`   |
| `JuliaBool`        | `Bool`               | `boolean`  |
| `JuliaChar`        | `Char`               | `string`   |
| `JuliaSymbol`      | `Symbol`             | `Symbol`   |

```typescript
import { Julia, JuliaFloat16, JuliaInt64, JuliaComplex } from "jlbun";

Julia.init();

Julia.scope(() => {
  // Create from JavaScript
  const f16 = JuliaFloat16.from(3.14); // Float16 with ~3 decimal precision
  const i64 = JuliaInt64.from(9007199254740993n); // BigInt for large integers

  // Access value
  console.log(f16.value); // 3.140625 (Float16 precision)
  console.log(i64.value); // 9007199254740993n

  // Complex numbers
  const c = JuliaComplex.from(3, 4); // 3 + 4im (ComplexF64)
  console.log(c.re, c.im); // 3, 4
  console.log(c.abs); // 5 (magnitude)
  console.log(c.arg); // 0.927... (phase in radians)
  console.log(c.value); // { re: 3, im: 4 }

  // Different precisions
  const c32 = JuliaComplex.fromF32(1, 2); // ComplexF32
  const c16 = JuliaComplex.fromF16(1, 2); // ComplexF16

  // From polar form
  const polar = JuliaComplex.fromPolar(5, Math.PI / 4); // r=5, theta=45 degrees
});

Julia.close();
```

---

## Error Handling

Julia exceptions are automatically mapped to TypeScript error classes:

```typescript
import { BoundsError, DomainError, Julia, JuliaError } from "jlbun";

try {
  Julia.scope((julia) => {
    julia.Base.sqrt(-1);
  });
} catch (e) {
  if (e instanceof DomainError) {
    console.log("Domain error:", e.message);
  } else if (e instanceof JuliaError) {
    console.log("Julia error type:", e.juliaType);
  }
}
```

| Error Class           | Julia Type            | Trigger                                                     |
| --------------------- | --------------------- | ----------------------------------------------------------- |
| `MethodError`         | `MethodError`         | No method matches arguments                                 |
| `BoundsError`         | `BoundsError`         | Array index out of bounds                                   |
| `DomainError`         | `DomainError`         | Invalid domain (e.g., `sqrt(-1)`)                           |
| `DivideError`         | `DivideError`         | Integer division by zero                                    |
| `KeyError`            | `KeyError`            | Missing dictionary key                                      |
| `ArgumentError`       | `ArgumentError`       | Invalid function argument                                   |
| `TypeError`           | `TypeError`           | Wrong argument type                                         |
| `UndefVarError`       | `UndefVarError`       | Undefined variable                                          |
| `DimensionMismatch`   | `DimensionMismatch`   | Array dimension mismatch                                    |
| `InexactError`        | `InexactError`        | Cannot convert exactly                                      |
| `ScopeRequiredError`  | `ScopeRequiredError`  | Object-producing API called without an active scope         |
| `ScopeOwnershipError` | `ScopeOwnershipError` | Escaping or returning a value not owned by the active scope |
| `UnknownJuliaError`   | _(other)_             | Check `e.juliaType`                                         |

All error classes inherit from `JuliaError`, which provides a `juliaType` property containing the original Julia exception type name.

---

## Performance

jlbun is optimized for minimal FFI overhead:

| Optimization                | Description                       |
| --------------------------- | --------------------------------- |
| **Type Pointer Comparison** | O(1) type checking for primitives |
| **Type String Cache**       | Avoids repeated FFI calls         |
| **Zero-Copy Arrays**        | Memory sharing with TypedArray    |
| **Direct FFI Calls**        | 8-260x faster than `Julia.eval()` |

### Best Practices

```typescript
Julia.scope((julia) => {
  // Slow: string parsing
  const arr1 = julia.eval("zeros(1000, 1000)");

  // Fast: direct FFI
  const arr2 = julia.Base.zeros(julia.Float64, 1000, 1000);

  // Fastest: uninitialized
  const arr3 = julia.Array.init(julia.Float64, 1000, 1000);
});
```

| Use Case           | Recommended                       |
| ------------------ | --------------------------------- |
| Zero-initialized   | `julia.Base.zeros(type, dims...)` |
| Fill with value    | `julia.Base.fill(value, dims...)` |
| Will overwrite all | `julia.Array.init(type, dims...)` |
| From TypedArray    | `julia.Array.from(typedArray)`    |

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=lucifer1004/jlbun&type=Date)](https://star-history.com/#lucifer1004/jlbun&Date)
