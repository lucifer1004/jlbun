# AGENTS.md - AI Coding Assistant Guide

## Project Overview

**jlbun** is a Foreign Function Interface (FFI) library that enables using the Julia programming language within the Bun JavaScript runtime. It allows developers to call Julia functions directly from TypeScript/JavaScript code, enabling seamless data exchange and function calls between the two languages.

## Technical Architecture

### Core Components

```text
jlbun/
├── c/wrapper.c          # C wrapper layer: wraps Julia C API
├── jlbun/               # TypeScript source code
│   ├── index.ts         # Entry point and type exports
│   ├── julia.ts         # Julia runtime main class
│   ├── wrapper.ts       # Bun FFI binding definitions
│   ├── gc.ts            # GCManager for automatic lifecycle management
│   ├── scope.ts         # JuliaScope for proxy-based auto-tracking
│   ├── arrays.ts        # JuliaArray wrapper class
│   ├── functions.ts     # JuliaFunction wrapper class
│   ├── values.ts        # Primitive type wrappers (Int, Float, String, etc.)
│   ├── tuples.ts        # Tuple/NamedTuple/Pair wrapper classes
│   ├── sets.ts          # JuliaSet wrapper class
│   ├── dicts.ts         # JuliaDict/JuliaIdDict wrapper classes
│   ├── modules.ts       # JuliaModule wrapper class
│   ├── tasks.ts         # JuliaTask multi-threading support
│   ├── types.ts         # JuliaDataType type system
│   ├── errors.ts        # Error type definitions
│   ├── utils.ts         # Utility functions
│   └── tests/           # Test files (organized by module)
│       ├── setup.ts     # Shared test initialization
│       ├── julia.test.ts
│       ├── values.test.ts
│       ├── functions.test.ts
│       ├── arrays.test.ts
│       ├── ptr.test.ts
│       ├── collections.test.ts
│       ├── tasks.test.ts
│       ├── scope.test.ts
│       └── utils.test.ts
├── cmake/               # CMake modules
│   └── FindJulia.cmake  # Julia finder script
├── CMakeLists.txt       # CMake build configuration
├── bunfig.toml          # Bun configuration (test coverage settings)
└── build/               # Build output directory
    └── libjlbun.dylib   # Compiled dynamic library
```

### Technology Stack

- **Runtime**: Bun (>=1.0)
- **Language**: TypeScript (ES2022+)
- **FFI**: `bun:ffi` module
- **Build System**: CMake (>=3.15)
- **Dependency**: Julia (>=1.10)

## Core Classes and APIs

### `Julia` Class (Static Class)

Main entry point, providing the following functionality:

```typescript
Julia.init(options?)           // Initialize Julia runtime
Julia.close()                  // Close Julia runtime
Julia.eval(code: string)       // Execute Julia code
Julia.tagEval`...`             // Template string execution (supports value interpolation)
Julia.import(moduleName)       // Import Julia module
Julia.call(func, ...args)      // Call Julia function
Julia.callWithKwargs(func, kwargs, ...args)  // Call with keyword arguments
Julia.autoWrap(value)          // Auto-wrap JS value as JuliaValue
Julia.wrapPtr(ptr)             // Wrap pointer as JuliaValue
Julia.scope(fn)                // Execute code with automatic GC management
Julia.scopeAsync(fn)           // Async version of scope()
```

**Built-in Module Access**:
- `Julia.Core` - Julia Core module
- `Julia.Base` - Julia Base module  
- `Julia.Main` - Julia Main module
- `Julia.Pkg` - Julia package manager

### Data Type Wrapper Classes

| TypeScript Class | Julia Type | JS Value Type |
|------------------|------------|---------------|
| `JuliaInt8/16/32` | `Int8/16/32` | `number` |
| `JuliaInt64` | `Int64` | `bigint` |
| `JuliaUInt8/16/32` | `UInt8/16/32` | `number` |
| `JuliaUInt64` | `UInt64` | `bigint` |
| `JuliaFloat32/64` | `Float32/64` | `number` |
| `JuliaString` | `String` | `string` |
| `JuliaBool` | `Bool` | `boolean` |
| `JuliaChar` | `Char` | `string` |
| `JuliaSymbol` | `Symbol` | `Symbol` |
| `JuliaArray` | `Array` | `TypedArray` / `any[]` |
| `JuliaPtr` | `Ptr{T}` | `Pointer` (raw address) |
| `JuliaTuple` | `Tuple` | `any[]` |
| `JuliaNamedTuple` | `NamedTuple` | `Record<string, any>` |
| `JuliaPair` | `Pair` | access via `.first` / `.second` |
| `JuliaSet` | `Set` | `Set<any>` |
| `JuliaDict` | `Dict` | `Map<any, any>` |
| `JuliaFunction` | `Function` | callable |
| `JuliaModule` | `Module` | property accessible |
| `JuliaTask` | `Task` | `Promise<JuliaValue>` |

### `JuliaValue` Interface

All Julia value wrapper classes implement this interface:

```typescript
interface JuliaValue {
  ptr: Pointer;           // Raw pointer to Julia object
  get value(): any;       // Get native JS value
  toString(): string;     // String representation
}
```

## Memory Model

### Zero-Copy Array Sharing

`JuliaArray` supports memory sharing with JavaScript `TypedArray`:

```typescript
const bunArray = new Float64Array([1, 2, 3]);
const juliaArray = JuliaArray.from(bunArray);
// bunArray and juliaArray share the same memory
bunArray[0] = 100;  // Julia array will also see this change
```

### Multi-Dimensional Arrays

`JuliaArray.init()` supports creating arrays with arbitrary dimensions:

```typescript
// Create arrays with different dimensions
const arr1d = JuliaArray.init(Julia.Float64, 100);        // 1D
const matrix = JuliaArray.init(Julia.Float64, 10, 20);    // 2D (10 rows, 20 cols)
const tensor = JuliaArray.init(Julia.Float64, 3, 4, 5);   // 3D
const arr4d = JuliaArray.init(Julia.Float64, 2, 3, 4, 5); // 4D+
```

**Column-Major Order**: Julia uses column-major order (like Fortran). Elements are stored column-by-column:

```
Julia 2x3 matrix:     Memory layout: [a00, a10, a01, a11, a02, a12]
[ a00  a01  a02 ]
[ a10  a11  a12 ]
```

For multi-dimensional indexing, use `getAt()` and `setAt()`:

```typescript
const matrix = JuliaArray.init(Julia.Float64, 3, 4); // 3 rows, 4 cols

// Multi-dimensional access (0-based indices)
matrix.setAt(row, col, value);
const val = matrix.getAt(row, col);

// For 3D arrays
tensor.setAt(i, j, k, value);
const val3d = tensor.getAt(i, j, k);
```

Linear indexing with `get(index)` and `set(index, value)` follows column-major order.

### Automatic Lifecycle Management

jlbun provides automatic garbage collection integration between JavaScript and Julia runtimes. The recommended approach is to use **scoped contexts** for automatic memory management.

---

## Scope API (Recommended)

### `Julia.scope()` - Synchronous Scope

The `Julia.scope()` method creates a managed context where all Julia objects are automatically tracked and released when the scope exits. This is the **recommended way** to work with Julia objects.

```typescript
import { Julia } from "jlbun";

Julia.init();

// Basic usage: return JS value, Julia objects auto-released
const result = Julia.scope((julia) => {
  const a = julia.Base.rand(1000, 1000);
  const b = julia.Base.rand(1000, 1000);
  const c = julia.Base["*"](a, b);
  return julia.Base.sum(c).value; // Return JS number
});

console.log(result); // A number, all Julia matrices freed
```

### `Julia.scopeAsync()` - Asynchronous Scope

For async operations (e.g., `JuliaTask`), use `Julia.scopeAsync()`:

```typescript
const result = await Julia.scopeAsync(async (julia) => {
  const func = julia.eval("() -> sum(1:1000000)") as JuliaFunction;
  const task = JuliaTask.from(func);
  const value = await task.value;
  return value.value;
});

console.log(result); // 500000500000n
```

### ScopedJulia Proxy API

The callback receives a `ScopedJulia` proxy object that mirrors the `Julia` static class but automatically tracks all created objects.

#### Available Properties and Methods

| Property/Method | Description |
|-----------------|-------------|
| `julia.eval(code)` | Execute Julia code, track result |
| `julia.tagEval\`...\`` | Template string evaluation |
| `julia.import(name)` | Import Julia module |
| `julia.call(func, ...args)` | Call function with tracking |
| `julia.callWithKwargs(func, kwargs, ...args)` | Call with keyword args |
| `julia.escape(value)` | Remove from tracking, return value |
| `julia.Base` / `julia.Core` / `julia.Main` / `julia.Pkg` | Module access |
| `julia.version` | Julia version string |
| `julia.nthreads` | Number of Julia threads |
| `julia.Int64` / `julia.Float64` / ... | Data type accessors |
| `julia.typeof(value)` | Get Julia type |
| `julia.getTypeStr(value)` | Get type as string |
| `julia.autoWrap(jsValue)` | Auto-wrap JS value |
| `julia.wrapPtr(ptr)` | Wrap raw pointer |

#### Scoped Collection Constructors

The scoped proxy also provides convenient constructors for collection types:

```typescript
Julia.scope((julia) => {
  // Create arrays (auto-tracked) - supports multi-dimensional
  const arr1d = julia.Array.init(julia.Float64, 1000);
  const matrix = julia.Array.init(julia.Float64, 100, 100);  // 2D matrix
  const tensor = julia.Array.init(julia.Float64, 10, 10, 10); // 3D tensor
  const arr2 = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));

  // Create dictionaries
  const dict = julia.Dict.from([
    ["a", 1],
    ["b", 2],
  ]);

  // Create sets
  const set = julia.Set.from([1, 2, 3, 4, 5]);

  // Create tuples
  const tuple = julia.Tuple.from([1, "hello", 3.14]);
  const namedTuple = julia.NamedTuple.from({ x: 10, y: 20 });

  // All objects are automatically released when scope ends
  return julia.Base.sum(arr2).value;
});
```

### Escaping Values from Scope

By default, all Julia objects are released when the scope ends. To keep a Julia object alive:

#### Method 1: Return the JuliaValue directly

```typescript
// Returned JuliaValue is auto-escaped
const arr = Julia.scope((julia) => {
  return julia.Base.rand(100); // Auto-escaped
});
// arr is still valid here
console.log(arr.length); // 100
```

#### Method 2: Explicit escape

```typescript
const arr = Julia.scope((julia) => {
  const temp = julia.Base.rand(100);
  const sorted = julia.Base.sort(temp);
  // Explicitly escape - removes from tracking
  return julia.escape(sorted);
});
// sorted array survives, temp is freed
```

### Real-World Example: Matrix Operations

```typescript
function matrixMultiply(size: number): number {
  return Julia.scope((julia) => {
    // Create two random matrices
    const A = julia.Base.rand(size, size);
    const B = julia.Base.rand(size, size);

    // Matrix multiplication
    const C = julia.Base["*"](A, B);

    // Compute sum of result
    return julia.Base.sum(C).value;
  });
  // A, B, C are all automatically freed here
}

const result = matrixMultiply(1000);
console.log(`Sum: ${result}`);
```

### Thread Safety

The scope implementation uses Julia's `ReentrantLock` to protect the internal GC root dictionary, making it safe to use with multi-threaded Julia operations (`JuliaTask`).

---

### JSCallback Auto-Cleanup

Callbacks created with `JuliaFunction.from()` are automatically cleaned up when garbage collected. Manual `.close()` is still available for early cleanup:

```typescript
const jlFunc = JuliaFunction.from(
  (x: number) => x * 2,
  { args: [FFIType.f64], returns: FFIType.f64 }
);
// Optional: call jlFunc.close() for early cleanup
// Otherwise, cleaned up automatically when GC'd
```

### Manual Management (Legacy)

For manual control without scopes, you can still use:
- `Julia.setGlobal(name, obj)` - Keep Julia objects alive
- `Julia.deleteGlobal(name)` - Allow Julia objects to be GC'd

**Note**: Manual management is discouraged. Prefer `Julia.scope()` for cleaner code and automatic cleanup.

## Performance Optimizations

### Type Pointer Comparison

The `wrapPtr()` function uses pointer comparison for primitive types instead of string comparison:

```typescript
// Fast path: O(1) pointer comparison
if (typePtr === Julia.Int64.ptr) {
  return new JuliaInt64(ptr);
} else if (typePtr === Julia.Float64.ptr) {
  return new JuliaFloat64(ptr);
}
// ... etc
```

Supported fast-path types:
- Primitives: String, Bool, Char, Int8/16/32/64, UInt8/16/32/64, Float16/32/64
- Special: Nothing, Symbol, Module, Task, DataType

### Type String Cache

A `Map<Pointer, string>` cache avoids repeated FFI calls to `jl_typeof_str`:

```typescript
// Cache lookup before FFI call
const cached = Julia.typeStrCache.get(typePtr);
if (cached !== undefined) return cached;

// Cache miss - get string and cache it
const typeStr = jlbun.symbols.jl_typeof_str(ptr).toString();
Julia.typeStrCache.set(typePtr, typeStr);
```

Pre-populated with 20 common types at initialization.

### Zero-Copy Array Sharing

`JuliaArray.from()` wraps TypedArray memory directly without copying:

```typescript
const bunArray = new Float64Array([1, 2, 3]);
const juliaArray = JuliaArray.from(bunArray);
// Both arrays share the same memory buffer
```

### Array Creation Best Practices

Based on benchmarks, here are the recommended approaches for array creation:

| Use Case | Recommended Method | Performance |
|----------|-------------------|-------------|
| Zero-initialized | `Julia.Base.zeros(Julia.Float64, m, n)` | Fastest (uses `calloc`) |
| Filled with value | `Julia.Base.fill(value, m, n)` | Clean API, good performance |
| Will overwrite all | `JuliaArray.init(Julia.Float64, m, n)` | Fastest (no init) |
| From JS TypedArray | `JuliaArray.from(typedArray)` | Zero-copy |

**Performance comparison** (1000x1000 Float64 matrix):
- `JuliaArray.init()` FFI: ~0.6 µs
- `Julia.eval("Array{...}(undef,...)")`: ~5 µs (**~8x slower**)

```typescript
// ❌ Slow: avoid eval() in hot paths
const arr = Julia.eval("zeros(1000, 1000)");

// ✅ Fast: direct FFI calls
const arr = Julia.Base.zeros(Julia.Float64, 1000, 1000);

// ✅ Fastest: uninitialized allocation
const arr = JuliaArray.init(Julia.Float64, 1000, 1000);
arr.fill(42.0);  // Then fill as needed
```

**Key insight**: `Julia.eval()` has string parsing overhead. Cache function references and use direct FFI calls for performance-critical code.

## JuliaArray API Reference

| Method | Description |
|--------|-------------|
| `JuliaArray.init(elType, ...dims)` | Create array with element type and dimensions |
| `JuliaArray.from(typedArray)` | Create from TypedArray (zero-copy) |
| `JuliaArray.fromAny(values)` | Create from arbitrary JS array |
| `arr.get(linearIndex)` | Get element at linear index (column-major) |
| `arr.set(linearIndex, value)` | Set element at linear index |
| `arr.getAt(...indices)` | Get element at multi-dimensional indices |
| `arr.setAt(...indices, value)` | Set element at multi-dimensional indices |
| `arr.length` | Total number of elements |
| `arr.ndims` | Number of dimensions |
| `arr.size` | Array of dimension sizes |
| `arr.value` | Get as TypedArray or JS array |
| `arr.reshape(...shape)` | Reshape array (shares memory) |
| `arr.fill(value)` | Fill array with value |
| `arr.map(fn)` | Map function over array |
| `arr.push(...values)` | Append elements (1D only) |
| `arr.pop()` | Remove and return last element (1D only) |
| `arr.reverse()` | Reverse array in place |

## JuliaPtr API Reference

`JuliaPtr` wraps Julia's `Ptr{T}` type for low-level memory operations and FFI scenarios.

| Method/Property | Description |
|-----------------|-------------|
| `JuliaPtr.fromAddress(addr)` | Create `Ptr{Cvoid}` from raw address (number or bigint) |
| `JuliaPtr.fromArray(arr)` | Get data pointer from a JuliaArray |
| `JuliaPtr.fromObject(obj)` | Get memory address of any Julia object (unsafe!) |
| `ptr.address` | Get raw address as bigint |
| `ptr.value` | Get as Bun's Pointer type |
| `ptr.elType` | Get element type `T` from `Ptr{T}` |
| `ptr.isNull` | Check if null pointer (address === 0) |
| `ptr.load(offset?)` | Read value at offset (0-based, element units) |
| `ptr.store(value, offset?)` | Write value at offset (0-based, element units) |
| `ptr.offset(n)` | Create new pointer offset by n elements |
| `ptr.reinterpret(newType)` | Reinterpret as `Ptr{newType}` |

**Safety Warning**: `load()` and `store()` are **unsafe** operations that can cause segfaults or memory corruption. Ensure:
- The pointer is valid and properly aligned
- The memory has not been freed
- The type matches the actual data in memory

```typescript
// Example: Direct memory manipulation
const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
const ptr = JuliaPtr.fromArray(arr);

// Read (0-based indexing)
ptr.load(0).value;  // 1.0
ptr.load(2).value;  // 3.0

// Write
ptr.store(99.0, 1);  // arr[1] = 99.0

// Pointer arithmetic (element-based, not byte-based)
const ptr2 = ptr.offset(2);  // Points to arr[2]
ptr2.load(0).value;  // 3.0
```

## C Wrapper Layer (`c/wrapper.c`)

The C layer wraps Julia C API with the following main functions:

1. **Version Compatibility**: `JL_VERSION_AT_LEAST(major, minor)` macro for clean version checks
2. **Initialization**: `jl_init0`, `jl_init_with_image0`
3. **Type Getters**: `jl_*_type_getter()` function series (including `datatype`, `module`, `task`, `array`)
4. **Module Access**: `jl_*_module_getter()` function series
5. **Array Operations**: `jl_array_*_getter()`, `jl_array_ptr_ref_wrapper`, `jl_array_ptr_set_wrapper`, `jl_alloc_array_2d`, `jl_alloc_array_3d`, `jl_alloc_array_nd_wrapper`
6. **Pointer Operations**: `jl_ptr_eltype` (get element type from `Ptr{T}`), `jl_is_ptr_type` (type check helper)
7. **Property Queries**: `jl_hasproperty`, `jl_propertynames`, `jl_propertycount`

## Build System

### Build Commands

```bash
# Install dependencies (automatically builds C library)
npm install

# Manually build C library
bun run build-lib

# Run tests
bun test

# Generate type declarations
bun run rollup -c rollup.config.js
```

### CMake Configuration

- Uses `cmake/FindJulia.cmake` to locate Julia installation
- Outputs shared library `libjlbun.dylib` (macOS) / `libjlbun.so` (Linux)
- Compiles `c/wrapper.c` and links Julia library

## Code Standards

### TypeScript Standards

- Uses ESLint + Prettier for formatting
- `strict` mode enabled
- Module system: ES Modules (`"type": "module"`)
- Target: ES2022+ (supports `BigInt64Array`, etc.)

### Naming Conventions

- Julia wrapper classes: `Julia*` (e.g., `JuliaArray`, `JuliaFunction`)
- Static methods: camelCase
- Interfaces/Types: PascalCase
- Private methods: use `private` keyword

### Error Handling

```typescript
// Custom error types
MethodError        // Julia method call error
InexactError       // Type conversion precision loss error
UnknownJuliaError  // Other Julia exceptions
```

## Testing

Tests are organized by module in `jlbun/tests/`:

```text
jlbun/tests/
├── setup.ts          # Shared test initialization
├── julia.test.ts     # Julia static class tests
├── values.test.ts    # Primitive type tests (Int, Float, String, etc.)
├── functions.test.ts # JuliaFunction and callback tests
├── arrays.test.ts    # JuliaArray operations
├── collections.test.ts # Tuple, Dict, Set tests
├── tasks.test.ts     # JuliaTask async tests
├── scope.test.ts     # Scope and GCManager tests
└── utils.test.ts     # Utility functions and error classes
```

### Running Tests

```bash
bun test              # Run all tests
bun test --coverage   # Run with coverage report
```

### Test Coverage

Current coverage: **~98%** (excluding cleanup code)

Coverage includes:
- All data type creation and conversion
- Function calls (regular/keyword arguments)
- Array operations (shared memory/reshape/map)
- **Multi-dimensional arrays** (creation, getAt/setAt, column-major indexing)
- Collection operations (Set/Dict/Tuple)
- Async tasks (JuliaTask)
- Module imports
- **Scoped lifecycle management** (Julia.scope/Julia.scopeAsync)
- GCManager protection/unprotection
- JSCallback auto-cleanup via FinalizationRegistry

### Coverage Configuration

Configure coverage exclusions in `bunfig.toml`:

```toml
[test]
coveragePathIgnorePatterns = ["**/tests/**"]
```

## Common Development Tasks

### Adding New Julia Type Support

1. Add type getter function in `c/wrapper.c` (if needed)
2. Declare FFI binding in `jlbun/wrapper.ts`
3. Create new wrapper class file or extend `values.ts`
4. Add type recognition logic in `wrapPtr()` in `jlbun/julia.ts`:
   - For primitive types: add pointer comparison in fast path
   - For parametric types: add string comparison in slow path
5. If adding a primitive type, also add it to `typeStrCache` initialization
6. Export in `jlbun/index.ts`
7. Add test cases

### Modifying FFI Bindings

1. Modify C function in `c/wrapper.c`
2. Update FFI declaration in `jlbun/wrapper.ts`
3. Rebuild: `bun run build-lib`

### Debugging Tips

- Use `Julia.init({ verbosity: "verbose" })` for detailed output
- Check `Julia.getTypeStr(ptr)` to get Julia type string
- Use `Julia.repr(value)` to view Julia representation

## Version Compatibility

- **Julia**: >=1.10 (1.11+ supports shared buffer resizing)
- **Bun**: >=1.0
- **Node.js**: Not supported (depends on `bun:ffi`)

## Release Process

1. Update version number in `package.json`
2. Run `bun run prepublishOnly` to build release package
3. Publish to npm: `npm publish`

Release package contents (see `files` field):
- `dist/**/*.js` - Compiled JS
- `dist/**/*.d.ts` - Type declarations
- `c/wrapper.c` - C source code
- `cmake/FindJulia.cmake` - CMake module
- `CMakeLists.txt` - Build configuration

## Reference Resources

- [Julia C API Documentation](https://docs.julialang.org/en/v1/manual/embedding/)
- [Bun FFI Documentation](https://bun.sh/docs/api/ffi)
- [Project Documentation](https://lucifer1004.github.io/jlbun/)
