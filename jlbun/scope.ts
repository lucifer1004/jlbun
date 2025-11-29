import { Pointer } from "bun:ffi";
import {
  GCManager,
  Julia,
  JuliaArray,
  JuliaDataType,
  JuliaDict,
  JuliaFunction,
  JuliaIdDict,
  JuliaModule,
  JuliaNamedTuple,
  JuliaPair,
  JuliaSet,
  JuliaTuple,
  JuliaValue,
} from "./index.js";

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
 * Objects created through the scoped `julia` proxy are automatically tracked
 * and released when the scope ends.
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
export class JuliaScope {
  private tracked: Map<JuliaValue, string> = new Map();
  private disposed = false;

  /**
   * Track a Julia value in this scope.
   * When the scope is disposed, all tracked values will be released.
   *
   * @param value The Julia value to track
   * @returns The same value (for chaining)
   */
  track<T extends JuliaValue>(value: T): T {
    if (this.disposed) {
      throw new Error("Cannot track values in a disposed scope");
    }

    // Don't track if already tracked
    if (this.tracked.has(value)) {
      return value;
    }

    // Protect from Julia GC and track
    const id = GCManager.protect(value);
    this.tracked.set(value, id);
    return value;
  }

  /**
   * Remove a value from tracking (escape from scope).
   * The value will be transferred to the global GCManager.
   *
   * @param value The Julia value to escape
   * @returns The same value
   */
  escape<T extends JuliaValue>(value: T): T {
    const id = this.tracked.get(value);
    if (id) {
      this.tracked.delete(value);
      // Value remains protected by GCManager, but scope won't release it
    }
    return value;
  }

  /**
   * Get the number of tracked objects.
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

    for (const [value, id] of this.tracked) {
      GCManager.unprotect(id, value);
    }
    this.tracked.clear();
  }

  /**
   * Get a proxy wrapper for a JuliaFunction that auto-tracks results.
   */
  private wrapFunction(fn: JuliaFunction): JuliaFunction {
    const trackIfNeeded = (result: JuliaValue | undefined) => {
      if (result && this.shouldTrack(result)) {
        this.track(result);
      }
      return result;
    };

    return new Proxy(fn, {
      apply: (_target, _thisArg, args) => {
        return trackIfNeeded(Julia.call(fn, ...args));
      },
      get: (target, prop) => {
        if (prop === "callWithKwargs") {
          return (kwargs: Record<string, unknown>, ...args: unknown[]) => {
            return trackIfNeeded(Julia.callWithKwargs(fn, kwargs, ...args));
          };
        }
        return Reflect.get(target, prop);
      },
    }) as JuliaFunction;
  }

  /**
   * Get a proxy wrapper for a JuliaModule that auto-tracks results.
   */
  private wrapModule(module: JuliaModule): JuliaModule {
    return new Proxy(module, {
      get: (target, prop) => {
        const value = Reflect.get(target, prop);

        // Don't wrap special properties
        if (
          prop === "ptr" ||
          prop === "name" ||
          prop === "value" ||
          prop === "toString" ||
          prop === "cache"
        ) {
          return value;
        }

        // Wrap functions to auto-track their results
        if (value instanceof JuliaFunction) {
          return this.wrapFunction(value);
        }

        // Wrap nested modules
        if (value instanceof JuliaModule) {
          return this.wrapModule(value);
        }

        return value;
      },
    }) as JuliaModule;
  }

  /**
   * Check if a value should be tracked (non-primitive types).
   */
  private shouldTrack(value: JuliaValue): boolean {
    return (
      value instanceof JuliaArray ||
      value instanceof JuliaDict ||
      value instanceof JuliaIdDict ||
      value instanceof JuliaSet ||
      value instanceof JuliaTuple ||
      value instanceof JuliaNamedTuple ||
      value instanceof JuliaPair ||
      value instanceof JuliaFunction ||
      value instanceof JuliaModule
    );
  }

  /**
   * Helper to track a value if needed and return it.
   */
  private trackIfNeeded<T extends JuliaValue>(result: T): T;
  private trackIfNeeded(result: JuliaValue | undefined): JuliaValue | undefined;
  private trackIfNeeded(
    result: JuliaValue | undefined,
  ): JuliaValue | undefined {
    if (result && this.shouldTrack(result)) {
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
        const arr = JuliaArray.init(elType, ...dims);
        trackValue(arr);
        return arr;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (arr: any, options?: { juliaGC?: boolean }): JuliaArray => {
        const result = JuliaArray.from(arr, options);
        trackValue(result);
        return result;
      },
    };

    const scopedDict: ScopedJuliaDict = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (map: IterableIterator<[any, any]> | [any, any][]): JuliaDict => {
        const dict = JuliaDict.from(map);
        trackValue(dict);
        return dict;
      },
    };

    const scopedSet: ScopedJuliaSet = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (set: IterableIterator<any> | any[]): JuliaSet => {
        const result = JuliaSet.from(set);
        trackValue(result);
        return result;
      },
    };

    const scopedTuple: ScopedJuliaTuple = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (arr: any[]): JuliaTuple => {
        const tuple = JuliaTuple.from(...arr);
        trackValue(tuple);
        return tuple;
      },
    };

    const scopedNamedTuple: ScopedJuliaNamedTuple = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      from: (obj: Record<string, any>): JuliaNamedTuple => {
        const tuple = JuliaNamedTuple.from(obj);
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
        return trackIfNeeded(Julia.eval(code));
      },

      tagEval: (
        strings: TemplateStringsArray,
        ...values: unknown[]
      ): JuliaValue => {
        return trackIfNeeded(Julia.tagEval(strings, ...values));
      },

      import: (name: string): JuliaModule => {
        const module = Julia.import(name);
        trackValue(module);
        return wrapModule(module);
      },

      call: (fn: JuliaFunction, ...args: unknown[]): JuliaValue | undefined => {
        return trackIfNeeded(Julia.call(fn, ...args));
      },

      callWithKwargs: (
        fn: JuliaFunction,
        kwargs: JuliaNamedTuple | Record<string, unknown>,
        ...args: unknown[]
      ): JuliaValue => {
        return trackIfNeeded(Julia.callWithKwargs(fn, kwargs, ...args));
      },

      // Expose scope methods
      track: trackValue,
      escape: escapeValue,

      // Expose type utilities
      typeof: Julia.typeof.bind(Julia),
      getTypeStr: Julia.getTypeStr.bind(Julia),
      autoWrap: Julia.autoWrap.bind(Julia),
      wrapPtr: (ptr: Pointer): JuliaValue => {
        return trackIfNeeded(Julia.wrapPtr(ptr));
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
