import { Pointer } from "bun:ffi";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  GCManager,
  Julia,
  JuliaArray,
  JuliaDataType,
  JuliaDict,
  JuliaFunction,
  JuliaModule,
  JuliaNamedTuple,
  JuliaSet,
  JuliaTuple,
  JuliaValue,
  ScopeOwnershipError,
} from "./index.js";
import {
  getJuliaOwnership,
  isJuliaValue,
  isPersistentJuliaValue,
  setJuliaOwnership,
} from "./ownership.js";

const scopeStorage = new AsyncLocalStorage<JuliaScope>();

export function getActiveJuliaScope(): JuliaScope | undefined {
  return scopeStorage.getStore();
}

export function runWithJuliaScope<T>(scope: JuliaScope, fn: () => T): T {
  return scopeStorage.run(scope, fn);
}

export function enterJuliaScope(scope: JuliaScope): void {
  scopeStorage.enterWith(scope);
}

/**
 * Proxy for JuliaArray that auto-tracks created arrays.
 */
export interface ScopedJuliaArray {
  /**
   * Create a JuliaArray with given element type and dimensions.
   * The array is automatically tracked in the scope.
   *
   * @example
   * ```typescript
   * Julia.scope((julia) => {
   *   // 1D array
   *   const arr1d = julia.Array.init(julia.Float64, 100);
   *   // 2D matrix
   *   const matrix = julia.Array.init(julia.Float64, 10, 20);
   *   // 3D tensor
   *   const tensor = julia.Array.init(julia.Float64, 10, 20, 30);
   * });
   * ```
   */
  init(elType: JuliaDataType, ...dims: number[]): JuliaArray;

  /**
   * Create a JuliaArray from a TypedArray.
   * The array is automatically tracked in the scope.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(arr: any, options?: { juliaGC?: boolean }): JuliaArray;
}

/**
 * Proxy for JuliaDict that auto-tracks created dicts.
 */
export interface ScopedJuliaDict {
  /**
   * Create a JuliaDict from key-value pairs.
   * The dict is automatically tracked in the scope.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(map: IterableIterator<[any, any]> | [any, any][]): JuliaDict;
}

/**
 * Proxy for JuliaSet that auto-tracks created sets.
 */
export interface ScopedJuliaSet {
  /**
   * Create a JuliaSet from values.
   * The set is automatically tracked in the scope.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(set: IterableIterator<any> | any[]): JuliaSet;
}

/**
 * Proxy for JuliaTuple that auto-tracks created tuples.
 */
export interface ScopedJuliaTuple {
  /**
   * Create a JuliaTuple from values.
   * The elements of the array are spread as tuple elements.
   * The tuple is automatically tracked in the scope.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(elements: any[]): JuliaTuple;
}

/**
 * Proxy for JuliaNamedTuple that auto-tracks created named tuples.
 */
export interface ScopedJuliaNamedTuple {
  /**
   * Create a JuliaNamedTuple from an object.
   * The named tuple is automatically tracked in the scope.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(obj: Record<string, any>): JuliaNamedTuple;
}

/**
 * Type for the scoped Julia proxy object.
 */
export interface ScopedJulia {
  readonly Base: JuliaModule;
  readonly Core: JuliaModule;
  readonly Main: JuliaModule;
  readonly Pkg: JuliaModule;

  /** Proxy for creating auto-tracked JuliaArrays */
  readonly Array: ScopedJuliaArray;
  /** Proxy for creating auto-tracked JuliaDicts */
  readonly Dict: ScopedJuliaDict;
  /** Proxy for creating auto-tracked JuliaSets */
  readonly Set: ScopedJuliaSet;
  /** Proxy for creating auto-tracked JuliaTuples */
  readonly Tuple: ScopedJuliaTuple;
  /** Proxy for creating auto-tracked JuliaNamedTuples */
  readonly NamedTuple: ScopedJuliaNamedTuple;

  eval(code: string): JuliaValue;
  tagEval(strings: TemplateStringsArray, ...values: unknown[]): JuliaValue;
  import(name: string): JuliaModule;
  call(fn: JuliaFunction, ...args: unknown[]): JuliaValue | undefined;
  callWithKwargs(
    fn: JuliaFunction,
    kwargs: JuliaNamedTuple | Record<string, unknown>,
    ...args: unknown[]
  ): JuliaValue;

  track<T extends JuliaValue>(value: T): T;
  escape<T extends JuliaValue>(value: T): T;

  /**
   * Execute a function without auto-tracking returned values.
   *
   * Use this when creating many temporary objects that don't need to survive
   * beyond their immediate use. This improves performance by skipping the
   * tracking overhead.
   *
   * **Warning**: Objects created inside `untracked()` may be garbage collected
   * by Julia if no JS reference exists. Only use for temporary operations.
   *
   * @example
   * ```typescript
   * Julia.scope((julia) => {
   *   const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));
   *   const range = julia.track(Julia.Base.UnitRange(2, 4));
   *
   *   // Create many temporary SubArrays without tracking overhead
   *   let sum = 0;
   *   julia.untracked(() => {
   *     for (let i = 0; i < 10000; i++) {
   *       const sub = julia.Base.view(arr, range);
   *       sum += Julia.Base.sum(sub).value as number;
   *     }
   *   });
   *   return sum;
   * });
   * ```
   */
  untracked<T>(fn: () => T): T;

  typeof(value: JuliaValue): JuliaDataType;
  getTypeStr(ptr: Pointer | JuliaValue): string;
  autoWrap(value: unknown): JuliaValue;
  wrapPtr(ptr: Pointer): JuliaValue;

  readonly nthreads: number;
  readonly version: string;

  readonly Any: JuliaDataType;
  readonly Nothing: JuliaDataType;
  readonly Symbol: JuliaDataType;
  readonly Function: JuliaDataType;
  readonly String: JuliaDataType;
  readonly Bool: JuliaDataType;
  readonly Char: JuliaDataType;
  readonly Int8: JuliaDataType;
  readonly UInt8: JuliaDataType;
  readonly Int16: JuliaDataType;
  readonly UInt16: JuliaDataType;
  readonly Int32: JuliaDataType;
  readonly UInt32: JuliaDataType;
  readonly Int64: JuliaDataType;
  readonly UInt64: JuliaDataType;
  readonly Float16: JuliaDataType;
  readonly Float32: JuliaDataType;
  readonly Float64: JuliaDataType;
}

/**
 * A scoped Julia context that automatically tracks and releases Julia objects.
 *
 * Uses a stack-based GC root management system:
 *   - On construction: records the current stack position (mark)
 *   - During scope: all tracked values are pushed to the stack
 *   - On dispose: releases all values from mark to current top in one operation
 *
 * This is much more efficient than the previous per-object protect/unprotect
 * approach because:
 *   - Push is O(1) - just array append
 *   - Release is O(1) FFI call + O(n) memset (no Julia function calls)
 *   - No string allocations for IDs
 *
 * @example
 * ```typescript
 * const result = Julia.scope((julia) => {
 *   const a = julia.Base.rand(1000, 1000);
 *   const b = julia.Base.rand(1000, 1000);
 *   return julia.Base["*"](a, b).value; // Return JS value
 * });
 * // a and b are automatically released
 * ```
 */
/**
 * Scope mode determines how Julia objects are tracked and released.
 *
 * - `'default'`: Scope-based with concurrent async support. Safe for parallel `scopeAsync()`.
 * - `'safe'`: All objects use FinalizationRegistry. Safe for closures but non-deterministic.
 * - `'perf'`: Lock-free stack-based. Fastest but ONLY for single-threaded, LIFO scope order.
 */
export type ScopeMode = "default" | "safe" | "perf";

export interface JuliaScopeOptions {
  /**
   * Scope mode determines how Julia objects are tracked and released.
   *
   * - `'default'`: Scope-based with concurrent async support. Thread-safe, handles parallel `scopeAsync()`.
   * - `'safe'`: All objects use FinalizationRegistry. Safe for closures but non-deterministic release.
   * - `'perf'`: Lock-free stack-based. Fastest but ONLY for single-threaded, strict LIFO scope order.
   *
   * **WARNING**: `'perf'` mode is NOT safe for:
   *   - Concurrent `Julia.scopeAsync()` calls
   *   - `JuliaTask` parallelism
   *   - Non-LIFO scope disposal order
   *
   * @default 'default'
   */
  mode?: ScopeMode;
}

export class JuliaScope {
  private scopeId: bigint = 0n;
  private perfMark: number = 0;
  private tracked: Map<JuliaValue, number> = new Map(); // value -> stack idx
  private functionProxies = new WeakMap<JuliaFunction, JuliaFunction>();
  private dataTypeProxies = new WeakMap<JuliaDataType, JuliaDataType>();
  private moduleProxies = new WeakMap<JuliaModule, JuliaModule>();
  private disposed = false;
  private trackingEnabled = true;
  private mode: ScopeMode;

  constructor(options: JuliaScopeOptions = {}) {
    this.mode = options.mode ?? "default";

    if (this.mode === "perf") {
      // Perf mode: ensure perf GC is initialized, then mark current position
      if (!GCManager.isPerfInitialized) {
        GCManager.perfInit();
      }
      this.perfMark = GCManager.perfMark();
    } else {
      // Default/safe mode: use scope-based GC with scope_id
      this.scopeId = GCManager.scopeBegin();
    }
  }

  /**
   * Track a Julia value in this scope.
   * When the scope is disposed, all tracked values will be released.
   *
   * Note: Calling track() multiple times on the same value in the same scope is
   * idempotent. Values owned by another active scope are rejected.
   *
   * @param value The Julia value to track
   * @returns The same value (for chaining)
   */
  track<T extends JuliaValue>(value: T): T {
    if (this.disposed) {
      throw new Error("Cannot track values in a disposed scope");
    }

    const ownership = getJuliaOwnership(value);
    if (
      ownership?.kind === "scoped" &&
      ownership.scope === this &&
      ownership.idx !== undefined
    ) {
      this.tracked.set(value, ownership.idx);
      return value;
    }
    if (
      (ownership?.kind === "scoped" || ownership?.kind === "untracked") &&
      ownership.scope !== this
    ) {
      throw new ScopeOwnershipError(
        "ScopeOwnershipError: JuliaValue is owned by a different JuliaScope",
      );
    }
    if (isPersistentJuliaValue(value)) {
      return value;
    }

    if (this.mode === "perf") {
      // Perf mode: simple stack push, no Map tracking (for maximum speed)
      const idx = GCManager.perfPush(value);
      setJuliaOwnership(value, { kind: "scoped", scope: this, idx });
    } else {
      // Default/safe mode: push with scope ownership
      const idx = GCManager.pushScoped(value, this.scopeId);
      if (idx < 0) {
        throw new Error("Failed to track Julia value in scope");
      }
      // Remember index for escape transfer and safe mode
      this.tracked.set(value, idx);
      setJuliaOwnership(value, { kind: "scoped", scope: this, idx });
    }

    return value;
  }

  /**
   * Root a raw Julia pointer in this scope before wrapping/type inspection.
   *
   * @internal
   */
  protectPointer(ptr: Pointer): number {
    if (this.disposed) {
      throw new Error("Cannot protect values in a disposed scope");
    }
    if (this.mode === "perf") {
      return GCManager.perfPush({ ptr } as JuliaValue);
    }
    const idx = GCManager.pushScopedPtr(ptr, this.scopeId);
    if (idx < 0) {
      throw new Error("Failed to protect Julia pointer in scope");
    }
    return idx;
  }

  /**
   * Attach an already-created root slot to a wrapper.
   *
   * @internal
   */
  adopt<T extends JuliaValue>(value: T, idx: number): T {
    if (this.disposed) {
      throw new Error("Cannot adopt values in a disposed scope");
    }
    if (isPersistentJuliaValue(value)) {
      this.releaseProtectedPointer(idx);
      return value;
    }
    this.tracked.set(value, idx);
    setJuliaOwnership(value, { kind: "scoped", scope: this, idx });
    return value;
  }

  /**
   * Whether auto-tracking is currently enabled.
   *
   * @internal
   */
  get isTrackingEnabled(): boolean {
    return this.trackingEnabled;
  }

  /**
   * Whether this scope uses the lock-free perf root stack.
   *
   * @internal
   */
  get isPerfMode(): boolean {
    return this.mode === "perf";
  }

  /**
   * Release a raw pointer root created by protectPointer().
   *
   * @internal
   */
  releaseProtectedPointer(idx: number): void {
    if (this.mode === "perf") {
      GCManager.perfRelease(idx);
    } else {
      GCManager.release(idx);
    }
  }

  /**
   * Run a callback with this scope as the active async context.
   *
   * @internal
   */
  run<T>(fn: () => T): T {
    return runWithJuliaScope(this, fn);
  }

  /**
   * Execute a function without auto-tracking returned values.
   *
   * @param fn The function to execute
   * @returns The return value of the function
   */
  untracked<T>(fn: () => T): T {
    const wasEnabled = this.trackingEnabled;
    this.trackingEnabled = false;
    try {
      const result = this.run(fn);
      if (
        result !== null &&
        (typeof result === "object" || typeof result === "function") &&
        "then" in result &&
        typeof result.then === "function"
      ) {
        throw new ScopeOwnershipError(
          "ScopeOwnershipError: untracked() callbacks may not return Promise-like objects",
        );
      }
      if (isJuliaValue(result)) {
        throw new ScopeOwnershipError(
          "ScopeOwnershipError: untracked() callbacks may not return JuliaValue objects",
        );
      }
      return result;
    } finally {
      this.trackingEnabled = wasEnabled;
    }
  }

  /**
   * Remove a value from tracking (escape from scope).
   * The value will survive scope disposal.
   *
   * Implementation: Transfer the value to global scope (id=0) which is never auto-released.
   *
   * **Note**: In perf mode, escape() re-pushes the value to the default GC stack
   * with FinalizationRegistry cleanup. The original perf stack slot is still released.
   *
   * @param value The Julia value to escape
   * @returns The same value
   */
  escape<T extends JuliaValue>(value: T): T {
    const ownership = getJuliaOwnership(value);
    if (ownership?.kind === "escaped" || ownership?.kind === "runtime") {
      return value;
    }
    if (
      ownership?.kind !== "scoped" ||
      ownership.scope !== this ||
      ownership.idx === undefined
    ) {
      throw new ScopeOwnershipError(
        "ScopeOwnershipError: value is not owned by this JuliaScope",
      );
    }

    if (this.mode === "perf") {
      // Perf mode: push to default GC with global scope for persistence
      const idx = GCManager.pushScoped(value, 0n);
      if (idx < 0) {
        throw new Error("Failed to escape Julia value from perf scope");
      }
      GCManager.registerEscape(value, idx);
      setJuliaOwnership(value, { kind: "escaped", idx });
    } else {
      const transferred = GCManager.transfer(ownership.idx, 0n);
      if (transferred < 0) {
        throw new ScopeOwnershipError(
          "ScopeOwnershipError: value is not owned by an active root slot",
        );
      }
      GCManager.registerEscape(value, ownership.idx);
      setJuliaOwnership(value, { kind: "escaped", idx: ownership.idx });
    }
    return value;
  }

  /**
   * Get the number of tracked objects in this scope.
   * Note: With scope-based tracking, this returns the number explicitly tracked.
   */
  get size(): number {
    return this.tracked.size;
  }

  /**
   * Check if the scope has been disposed.
   */
  get isDisposed(): boolean {
    return this.disposed;
  }

  /**
   * Dispose the scope and release all tracked Julia objects.
   */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.mode === "perf") {
      // Perf mode: simple stack release to mark position (O(1))
      // Escaped values are already in default GC stack
      GCManager.perfRelease(this.perfMark);
    } else if (this.mode === "safe") {
      // Safe mode: ALL objects are managed by FinalizationRegistry
      // No scope release - prevents closure capture issues
      for (const [value, idx] of this.tracked) {
        const ownership = getJuliaOwnership(value);
        if (ownership?.kind === "scoped" && ownership.scope === this) {
          // Transfer to global scope (id=0) so it won't be released
          GCManager.transfer(idx, 0n);
          GCManager.registerEscape(value, idx);
          setJuliaOwnership(value, { kind: "escaped", idx });
        }
      }
    } else {
      // Default mode: release values still belonging to this scope.
      // Escaped values have already been transferred to global scope.
      GCManager.scopeEnd(this.scopeId);
    }

    this.tracked.clear();
  }

  /**
   * Get a proxy wrapper for a JuliaFunction that auto-tracks results.
   */
  private wrapFunction(fn: JuliaFunction): JuliaFunction {
    const cached = this.functionProxies.get(fn);
    if (cached !== undefined) {
      return cached;
    }

    // Use arrow function to capture 'this' and check trackingEnabled at call time
    const maybeTrack = (result: JuliaValue | undefined) => {
      if (this.trackingEnabled && result) {
        this.track(result);
      }
      return result;
    };

    const proxy = new Proxy(fn, {
      apply: (_target, _thisArg, args) => {
        return this.run(() => maybeTrack(Julia.call(fn, ...args)));
      },
      get: (target, prop) => {
        if (prop === "callWithKwargs") {
          return (kwargs: Record<string, unknown>, ...args: unknown[]) => {
            return this.run(() =>
              maybeTrack(Julia.callWithKwargs(fn, kwargs, ...args)),
            );
          };
        }
        return Reflect.get(target, prop);
      },
    }) as JuliaFunction;

    this.functionProxies.set(fn, proxy);
    return proxy;
  }

  /**
   * Get a proxy wrapper for callable Julia type constructors.
   */
  private wrapDataType(dataType: JuliaDataType): JuliaDataType {
    const cached = this.dataTypeProxies.get(dataType);
    if (cached !== undefined) {
      return cached;
    }

    const maybeTrack = (result: JuliaValue | undefined) => {
      if (this.trackingEnabled && result) {
        this.track(result);
      }
      return result;
    };

    const proxy = new Proxy(dataType, {
      apply: (_target, _thisArg, args) => {
        return this.run(() => maybeTrack(Julia.call(dataType, ...args)));
      },
      get: (target, prop) => Reflect.get(target, prop),
    }) as JuliaDataType;

    this.dataTypeProxies.set(dataType, proxy);
    return proxy;
  }

  /**
   * Get a proxy wrapper for a JuliaModule that auto-tracks results.
   */
  private wrapModule(module: JuliaModule): JuliaModule {
    const cached = this.moduleProxies.get(module);
    if (cached !== undefined) {
      return cached;
    }

    const proxy = new Proxy(module, {
      get: (target, prop) => {
        const value = this.run(() => Reflect.get(target, prop));

        // Don't wrap special properties
        if (
          prop === "ptr" ||
          prop === "name" ||
          prop === "value" ||
          prop === "toString"
        ) {
          return value;
        }

        // Wrap functions to auto-track their results
        if (value instanceof JuliaFunction) {
          return this.wrapFunction(value);
        }

        if (value instanceof JuliaDataType) {
          return this.wrapDataType(value);
        }

        // Wrap nested modules
        if (value instanceof JuliaModule) {
          return this.wrapModule(value);
        }

        return value;
      },
    }) as JuliaModule;

    this.moduleProxies.set(module, proxy);
    return proxy;
  }

  /**
   * Helper to track a value if needed and return it.
   * Respects the trackingEnabled flag.
   */
  private trackIfNeeded<T extends JuliaValue>(result: T): T;
  private trackIfNeeded(result: JuliaValue | undefined): JuliaValue | undefined;
  private trackIfNeeded(
    result: JuliaValue | undefined,
  ): JuliaValue | undefined {
    if (this.trackingEnabled && result) {
      this.track(result);
    }
    return result;
  }

  /**
   * Get a scoped proxy for the Julia static class.
   * All Julia objects created through this proxy are automatically tracked.
   */
  get julia(): ScopedJulia {
    if (!Julia) {
      throw new Error("Julia not initialized. Call Julia.init() first.");
    }

    // Use arrow functions to preserve 'this' context
    const wrapModule = this.wrapModule.bind(this);
    const trackIfNeeded = this.trackIfNeeded.bind(this);
    const trackValue = this.track.bind(this);
    const escapeValue = this.escape.bind(this);

    // Create proxies for collection types that auto-track
    const scopedArray: ScopedJuliaArray = {
      init: (elType: JuliaDataType, ...dims: number[]): JuliaArray => {
        const arr = this.run(() => JuliaArray.init(elType, ...dims));
        trackValue(arr);
        return arr;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (arr: any, options?: { juliaGC?: boolean }): JuliaArray => {
        const result = this.run(() => JuliaArray.from(arr, options));
        trackValue(result);
        return result;
      },
    };

    const scopedDict: ScopedJuliaDict = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (map: IterableIterator<[any, any]> | [any, any][]): JuliaDict => {
        const dict = this.run(() => JuliaDict.from(map));
        trackValue(dict);
        return dict;
      },
    };

    const scopedSet: ScopedJuliaSet = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (set: IterableIterator<any> | any[]): JuliaSet => {
        const result = this.run(() => JuliaSet.from(set));
        trackValue(result);
        return result;
      },
    };

    const scopedTuple: ScopedJuliaTuple = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (arr: any[]): JuliaTuple => {
        const tuple = this.run(() => JuliaTuple.from(...arr));
        trackValue(tuple);
        return tuple;
      },
    };

    const scopedNamedTuple: ScopedJuliaNamedTuple = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (obj: Record<string, any>): JuliaNamedTuple => {
        const tuple = this.run(() => JuliaNamedTuple.from(obj));
        trackValue(tuple);
        return tuple;
      },
    };

    const scopedJulia: ScopedJulia = {
      get Base() {
        return wrapModule(Julia.Base);
      },
      get Core() {
        return wrapModule(Julia.Core);
      },
      get Main() {
        return wrapModule(Julia.Main);
      },
      get Pkg() {
        return wrapModule(Julia.Pkg);
      },

      // Collection type proxies
      Array: scopedArray,
      Dict: scopedDict,
      Set: scopedSet,
      Tuple: scopedTuple,
      NamedTuple: scopedNamedTuple,

      eval: (code: string): JuliaValue => {
        return this.run(() => trackIfNeeded(Julia.eval(code)));
      },

      tagEval: (
        strings: TemplateStringsArray,
        ...values: unknown[]
      ): JuliaValue => {
        return this.run(() => trackIfNeeded(Julia.tagEval(strings, ...values)));
      },

      import: (name: string): JuliaModule => {
        const module = this.run(() => Julia.import(name));
        trackValue(module);
        return wrapModule(module);
      },

      call: (fn: JuliaFunction, ...args: unknown[]): JuliaValue | undefined => {
        return this.run(() => trackIfNeeded(Julia.call(fn, ...args)));
      },

      callWithKwargs: (
        fn: JuliaFunction,
        kwargs: JuliaNamedTuple | Record<string, unknown>,
        ...args: unknown[]
      ): JuliaValue => {
        return this.run(() =>
          trackIfNeeded(Julia.callWithKwargs(fn, kwargs, ...args)),
        );
      },

      // Expose scope methods
      track: trackValue,
      escape: escapeValue,
      untracked: this.untracked.bind(this),

      // Expose type utilities
      typeof: Julia.typeof.bind(Julia),
      getTypeStr: Julia.getTypeStr.bind(Julia),
      autoWrap: (value: unknown): JuliaValue => {
        return this.run(() => Julia.autoWrap(value));
      },
      wrapPtr: (ptr: Pointer): JuliaValue => {
        return this.run(() => trackIfNeeded(Julia.wrapPtr(ptr)));
      },

      // Expose static properties
      get nthreads() {
        return Julia.nthreads;
      },
      get version() {
        return Julia.version;
      },

      // Expose data types
      get Any() {
        return Julia.Any;
      },
      get Nothing() {
        return Julia.Nothing;
      },
      get Symbol() {
        return Julia.Symbol;
      },
      get Function() {
        return Julia.Function;
      },
      get String() {
        return Julia.String;
      },
      get Bool() {
        return Julia.Bool;
      },
      get Char() {
        return Julia.Char;
      },
      get Int8() {
        return Julia.Int8;
      },
      get UInt8() {
        return Julia.UInt8;
      },
      get Int16() {
        return Julia.Int16;
      },
      get UInt16() {
        return Julia.UInt16;
      },
      get Int32() {
        return Julia.Int32;
      },
      get UInt32() {
        return Julia.UInt32;
      },
      get Int64() {
        return Julia.Int64;
      },
      get UInt64() {
        return Julia.UInt64;
      },
      get Float16() {
        return Julia.Float16;
      },
      get Float32() {
        return Julia.Float32;
      },
      get Float64() {
        return Julia.Float64;
      },
    };

    return scopedJulia;
  }
}
