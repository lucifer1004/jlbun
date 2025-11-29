# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-11-29

### Added

- **Scope-Based GC Root Management**: New C-layer implementation using `Vector{Any}` with scope isolation for concurrent async operations
- **Concurrent Async Scope Support**: Scopes can now be released in any order, enabling safe use of `Promise.all()` with multiple `Julia.scopeAsync()` calls
- **Safe Mode for Scopes**: `Julia.scope(fn, { safe: true })` manages Julia object lifetimes with `FinalizationRegistry`, making it safe to capture objects in closures
- **New GCManager APIs**: 
  - `scopeBegin()` - Create a new scope, returns unique scope_id
  - `pushScoped(value, scopeId)` - Push value to specific scope
  - `scopeEnd(scopeId)` - Release all values in scope
  - `transfer(idx, newScopeId)` - Move value to another scope (for escape)
  - `getScope(idx)` - Get scope_id of value at index
- **Escape Registry**: Escaped objects are registered with `FinalizationRegistry` for automatic cleanup when JavaScript GC runs
- **Thread Safety**: All C-layer GC operations are protected by `pthread_mutex_t`
- **Benchmark Suite**: Added `benchmarks/scope/gc-modes.ts` for comparing GC mode performance

### Changed

- **GCManager Architecture**: Complete redesign from stack-based LIFO to scope-based isolation
- **Scope Disposal**: Uses `scopeEnd(scopeId)` for targeted release instead of stack-based `release(mark)`
- **Escaped Objects**: Use `transfer(idx, 0n)` to move to global scope, then registered with `FinalizationRegistry`
- **Julia 1.12 Compatibility**: Added explicit global variable declaration for `__jlbun_gc_stack__`
- **Scope Tracking**: Same value tracked multiple times is now deduplicated (Map-based tracking)

### Removed

- **Legacy Stack-Based APIs**: Removed `GCManager.mark()`, `GCManager.push()`, `GCManager.release()`, `GCManager.swap()`
- **Deprecated APIs**: Removed `GCManager.protect()`, `GCManager.unprotect()`, `GCManager.protectedCount`
- **IdDict-based GC**: Removed Julia-side `IdDict` for GC root management

### Fixed

- **Concurrent Async Scope Bug**: Fixed race condition where parallel async scopes could release each other's values
- **Segmentation Fault on Close**: Fixed segfault when `Julia.close()` was called while `FinalizationRegistry` callbacks were pending
- **Julia 1.12 Global Binding**: Fixed `"Global Main.__jlbun_gc_stack__ does not exist"` error

## [0.1.1] - 2025-11-29

### Added

- **JuliaSubArray**: Zero-copy array views with `view()` and `slice()` methods
- **JuliaRange**: Native support for `UnitRange`, `StepRange`, `StepRangeLen`, `LinRange`
- **JuliaComplex**: Support for `ComplexF64`, `ComplexF32`, `ComplexF16`
- **JuliaPtr**: Low-level pointer operations with `load()`, `store()`, `offset()`
- **Multi-dimensional Arrays**: `JuliaArray.init()` now supports arbitrary dimensions
- **Array Indexing**: `getAt()` and `setAt()` for multi-dimensional access

### Changed

- **Type Detection**: Optimized with pointer comparison for primitive types
- **Type String Cache**: Added caching to avoid repeated FFI calls to `jl_typeof_str`

## [0.1.0] - 2025-11-29

### Added

- **Julia.scope()**: Automatic tracking and cleanup of Julia objects within scoped contexts
- **Julia.scopeAsync()**: Async version for `JuliaTask` operations
- **julia.untracked()**: Opt-out mechanism for performance-critical loops
- **ScopedJulia Proxy**: Convenient proxy object with auto-tracking for all Julia operations
- **Collection Constructors**: `julia.Array`, `julia.Dict`, `julia.Set`, `julia.Tuple`, `julia.NamedTuple`
- **Error Classes**: Mapped Julia exceptions to TypeScript error classes (`MethodError`, `BoundsError`, `DomainError`, etc.)

### Changed

- **Memory Management**: Shifted from manual `protect`/`unprotect` to scope-based automatic management

## [0.0.x] - Prior Releases

### Added

- Initial FFI bindings for Julia C API
- Core wrapper classes: `JuliaValue`, `JuliaArray`, `JuliaFunction`, `JuliaModule`
- Zero-copy array sharing with JavaScript `TypedArray`
- Support for calling Julia functions from TypeScript
- Support for calling JavaScript functions from Julia (`JuliaFunction.from()`)
- Multi-threading support with `JuliaTask`
- Primitive type wrappers: `JuliaInt*`, `JuliaUInt*`, `JuliaFloat*`, `JuliaBool`, `JuliaString`, `JuliaChar`, `JuliaSymbol`
- Tuple and dictionary support: `JuliaTuple`, `JuliaNamedTuple`, `JuliaPair`, `JuliaDict`, `JuliaIdDict`, `JuliaSet`

[Unreleased]: https://github.com/lucifer1004/jlbun/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/lucifer1004/jlbun/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/lucifer1004/jlbun/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/lucifer1004/jlbun/releases/tag/v0.1.0

