import { Pointer } from "bun:ffi";
import { randomUUID } from "crypto";
import {
  createJuliaError,
  GCManager,
  jlbun,
  JuliaAny,
  JuliaArray,
  JuliaBool,
  JuliaChar,
  JuliaDataType,
  JuliaDict,
  JuliaFloat16,
  JuliaFloat32,
  JuliaFloat64,
  JuliaFunction,
  JuliaIdDict,
  JuliaInt8,
  JuliaInt16,
  JuliaInt32,
  JuliaInt64,
  JuliaModule,
  JuliaNamedTuple,
  JuliaNothing,
  JuliaOptions,
  JuliaPair,
  JuliaPtr,
  JuliaRange,
  JuliaScope,
  JuliaSet,
  JuliaString,
  JuliaSubArray,
  JuliaSymbol,
  JuliaTask,
  JuliaTuple,
  JuliaUInt8,
  JuliaUInt16,
  JuliaUInt32,
  JuliaUInt64,
  JuliaValue,
  MethodError,
  safeCString,
  ScopedJulia,
} from "./index.js";

export enum MIME {
  Default = "",
  TextPlain = "text/plain",
  TextHTML = "text/html",
  TextLaTeX = "text/latex",
  TextMarkdown = "text/markdown",
}

const DEFAULT_JULIA_OPTIONS = {
  bindir: "",
  sysimage: "",
  project: "",
  verbosity: "normal" as const,
};

export class Julia {
  private static options: JuliaOptions = DEFAULT_JULIA_OPTIONS;
  private static globals: JuliaIdDict;
  public static nthreads: number;
  public static version: string;

  public static Core: JuliaModule;
  public static Base: JuliaModule;
  public static Main: JuliaModule;
  public static Pkg: JuliaModule;

  public static Any: JuliaDataType;
  public static Nothing: JuliaDataType;
  public static Symbol: JuliaDataType;
  public static Function: JuliaDataType;
  public static String: JuliaDataType;
  public static Bool: JuliaDataType;
  public static Char: JuliaDataType;
  public static Int8: JuliaDataType;
  public static UInt8: JuliaDataType;
  public static Int16: JuliaDataType;
  public static UInt16: JuliaDataType;
  public static Int32: JuliaDataType;
  public static UInt32: JuliaDataType;
  public static Int64: JuliaDataType;
  public static UInt64: JuliaDataType;
  public static Float16: JuliaDataType;
  public static Float32: JuliaDataType;
  public static Float64: JuliaDataType;

  // Additional types for wrapPtr optimization
  public static DataType: JuliaDataType;
  public static Module: JuliaDataType;
  public static Task: JuliaDataType;

  // Type string cache: type pointer -> type string
  private static typeStrCache: Map<Pointer, string> = new Map();

  // Type constructors map: type pointer -> constructor function
  // Initialized in init() after all types are available
  private static simpleTypeConstructors: Map<
    Pointer,
    (ptr: Pointer) => JuliaValue
  > = new Map();

  private static prefetch(module: JuliaModule): void {
    const props = Julia.getModuleExports(module);
    const failures: string[] = [];

    for (const prop of props) {
      try {
        module.get(prop);
      } catch (_) {
        failures.push(prop);
      }
    }

    // Only show prefetch warnings in verbose mode.
    // Many "failures" are normal (operators, internal symbols, etc.)
    if (failures.length > 0 && Julia.options.verbosity === "verbose") {
      const examples = failures.slice(0, 5);
      console.warn(
        `Failed to prefetch ${failures.length} properties from ${module.name}: ${examples.join(", ")}${failures.length > 5 ? ` (+${failures.length - 5} more)` : ""}`,
      );
    }
  }

  /**
   * Initialize the Julia runtime. All other methods need to be called after this.
   *
   * @param extraOptions Extra options for initialization.
   */
  public static init(extraOptions: Partial<JuliaOptions> = {}): void {
    Julia.options = { ...Julia.options, ...extraOptions };

    if (!Julia.Base) {
      if (Julia.options.sysimage === "" || Julia.options.bindir === "") {
        jlbun.symbols.jl_init0();
      } else {
        jlbun.symbols.jl_init_with_image0(
          safeCString(Julia.options.bindir),
          safeCString(Julia.options.sysimage),
        );
      }

      Julia.Any = new JuliaDataType(jlbun.symbols.jl_any_type_getter()!, "Any");
      Julia.Nothing = new JuliaDataType(
        jlbun.symbols.jl_nothing_type_getter()!,
        "Nothing",
      );
      Julia.Symbol = new JuliaDataType(
        jlbun.symbols.jl_symbol_type_getter()!,
        "Symbol",
      );
      Julia.Function = new JuliaDataType(
        jlbun.symbols.jl_function_type_getter()!,
        "Function",
      );
      Julia.String = new JuliaDataType(
        jlbun.symbols.jl_string_type_getter()!,
        "String",
      );
      Julia.Bool = new JuliaDataType(
        jlbun.symbols.jl_bool_type_getter()!,
        "Bool",
      );
      Julia.Char = new JuliaDataType(
        jlbun.symbols.jl_char_type_getter()!,
        "Char",
      );
      Julia.Int8 = new JuliaDataType(
        jlbun.symbols.jl_int8_type_getter()!,
        "Int8",
      );
      Julia.UInt8 = new JuliaDataType(
        jlbun.symbols.jl_uint8_type_getter()!,
        "UInt8",
      );
      Julia.Int16 = new JuliaDataType(
        jlbun.symbols.jl_int16_type_getter()!,
        "Int16",
      );
      Julia.UInt16 = new JuliaDataType(
        jlbun.symbols.jl_uint16_type_getter()!,
        "UInt16",
      );
      Julia.Int32 = new JuliaDataType(
        jlbun.symbols.jl_int32_type_getter()!,
        "Int32",
      );
      Julia.UInt32 = new JuliaDataType(
        jlbun.symbols.jl_uint32_type_getter()!,
        "UInt32",
      );
      Julia.Int64 = new JuliaDataType(
        jlbun.symbols.jl_int64_type_getter()!,
        "Int64",
      );
      Julia.UInt64 = new JuliaDataType(
        jlbun.symbols.jl_uint64_type_getter()!,
        "UInt64",
      );
      Julia.Float16 = new JuliaDataType(
        jlbun.symbols.jl_float16_type_getter()!,
        "Float16",
      );
      Julia.Float32 = new JuliaDataType(
        jlbun.symbols.jl_float32_type_getter()!,
        "Float32",
      );
      Julia.Float64 = new JuliaDataType(
        jlbun.symbols.jl_float64_type_getter()!,
        "Float64",
      );

      // Initialize additional types for wrapPtr optimization
      Julia.DataType = new JuliaDataType(
        jlbun.symbols.jl_datatype_type_getter()!,
        "DataType",
      );
      Julia.Module = new JuliaDataType(
        jlbun.symbols.jl_module_type_getter()!,
        "Module",
      );
      Julia.Task = new JuliaDataType(
        jlbun.symbols.jl_task_type_getter()!,
        "Task",
      );

      // Pre-populate type string cache for common types
      Julia.typeStrCache.set(Julia.String.ptr, "String");
      Julia.typeStrCache.set(Julia.Bool.ptr, "Bool");
      Julia.typeStrCache.set(Julia.Char.ptr, "Char");
      Julia.typeStrCache.set(Julia.Int8.ptr, "Int8");
      Julia.typeStrCache.set(Julia.UInt8.ptr, "UInt8");
      Julia.typeStrCache.set(Julia.Int16.ptr, "Int16");
      Julia.typeStrCache.set(Julia.UInt16.ptr, "UInt16");
      Julia.typeStrCache.set(Julia.Int32.ptr, "Int32");
      Julia.typeStrCache.set(Julia.UInt32.ptr, "UInt32");
      Julia.typeStrCache.set(Julia.Int64.ptr, "Int64");
      Julia.typeStrCache.set(Julia.UInt64.ptr, "UInt64");
      Julia.typeStrCache.set(Julia.Float16.ptr, "Float16");
      Julia.typeStrCache.set(Julia.Float32.ptr, "Float32");
      Julia.typeStrCache.set(Julia.Float64.ptr, "Float64");
      Julia.typeStrCache.set(Julia.Nothing.ptr, "Nothing");
      Julia.typeStrCache.set(Julia.Symbol.ptr, "Symbol");
      Julia.typeStrCache.set(Julia.DataType.ptr, "DataType");
      Julia.typeStrCache.set(Julia.Module.ptr, "Module");
      Julia.typeStrCache.set(Julia.Task.ptr, "Task");

      // Initialize simple type constructors map for O(1) lookup in wrapPtr
      Julia.simpleTypeConstructors.set(
        Julia.String.ptr,
        (ptr) => new JuliaString(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.Bool.ptr,
        (ptr) => new JuliaBool(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.Char.ptr,
        (ptr) => new JuliaChar(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.Int8.ptr,
        (ptr) => new JuliaInt8(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.UInt8.ptr,
        (ptr) => new JuliaUInt8(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.Int16.ptr,
        (ptr) => new JuliaInt16(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.UInt16.ptr,
        (ptr) => new JuliaUInt16(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.Int32.ptr,
        (ptr) => new JuliaInt32(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.UInt32.ptr,
        (ptr) => new JuliaUInt32(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.Int64.ptr,
        (ptr) => new JuliaInt64(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.UInt64.ptr,
        (ptr) => new JuliaUInt64(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.Float16.ptr,
        (ptr) => new JuliaFloat16(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.Float32.ptr,
        (ptr) => new JuliaFloat32(ptr),
      );
      Julia.simpleTypeConstructors.set(
        Julia.Float64.ptr,
        (ptr) => new JuliaFloat64(ptr),
      );
      Julia.simpleTypeConstructors.set(Julia.Nothing.ptr, () =>
        JuliaNothing.getInstance(),
      );
      Julia.simpleTypeConstructors.set(
        Julia.Task.ptr,
        (ptr) => new JuliaTask(ptr),
      );

      Julia.Core = new JuliaModule(
        jlbun.symbols.jl_core_module_getter()!,
        "Core",
      );
      Julia.Base = new JuliaModule(
        jlbun.symbols.jl_base_module_getter()!,
        "Base",
      );
      Julia.Main = new JuliaModule(
        jlbun.symbols.jl_main_module_getter()!,
        "Main",
      );
      Julia.Pkg = Julia.import("Pkg");

      // Prefetch all the properties of Core, Base and Main
      // Note: Pkg is already prefetched during import
      Julia.prefetch(Julia.Core);
      Julia.prefetch(Julia.Base);
      Julia.prefetch(Julia.Main);

      if (Julia.options.project === null) {
        Julia.eval("Pkg.activate(; temp=true)");
      } else if (Julia.options.project !== "") {
        Julia.Pkg.activate(Julia.options.project);
      }

      Julia.nthreads = Number(Julia.eval("Threads.nthreads()").value);
      Julia.version = (Julia.eval("string(VERSION)") as JuliaString).value;
      Julia.eval("__jlbun_globals__ = IdDict()");
      Julia.globals = new JuliaIdDict(
        jlbun.symbols.jl_get_global(
          Julia.Main.ptr,
          JuliaSymbol.from("__jlbun_globals__").ptr,
        )!,
      );

      // Initialize thread-safe GC manager
      GCManager.init();
    }
  }

  private static getModuleExports(obj: JuliaValue): string[] {
    return Julia.Base.names(obj).value.map((x: symbol) => x.description!);
  }

  /**
   * Sava an object to the global scope maintained by `jlbun`.
   *
   * @param name Name to use.
   * @param obj Object to be saved.
   */
  public static setGlobal(name: string, obj: JuliaValue): void {
    Julia.globals.set(name, obj);
  }

  /**
   * Retrieve an object from the global scope maintained by `jlbun`.
   *
   * @param name Name of the object to be retrieved.
   */
  public static getGlobal(name: string): JuliaValue {
    return Julia.globals.get(name);
  }

  /**
   * Delete an object from the global scope maintained by `jlbun`.
   *
   * @param name Name of the object to be deleted.
   * @returns Whether the object was deleted.
   */
  public static deleteGlobal(name: string): boolean {
    return Julia.globals.delete(name);
  }

  /**
   * Get the type of a Julia value.
   *
   * @param value Value to get the type of.
   */
  public static typeof(value: JuliaValue): JuliaDataType {
    return new JuliaDataType(
      jlbun.symbols.jl_typeof_getter(value.ptr)!,
      Julia.getTypeStr(value.ptr),
    );
  }

  /**
   * Get the string representation of a Julia value's type.
   * Uses caching to avoid repeated FFI calls for common types.
   *
   * @param ptr Pointer to a Julia object, or a `JuliaValue` object.
   */
  public static getTypeStr(ptr: Pointer | JuliaValue): string {
    const actualPtr = typeof ptr === "object" ? ptr.ptr : ptr;
    const typePtr = jlbun.symbols.jl_typeof_getter(actualPtr)!;

    // Check cache first
    const cached = Julia.typeStrCache.get(typePtr);
    if (cached !== undefined) {
      return cached;
    }

    // Cache miss - get the string and cache it
    const typeStr = jlbun.symbols.jl_typeof_str(actualPtr).toString();
    Julia.typeStrCache.set(typePtr, typeStr);
    return typeStr;
  }

  /**
   * Wrap a JS value as a `JuliaValue` object.
   *
   * @param value Value to be wrapped.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static autoWrap(value: any): JuliaValue {
    if (
      ((typeof value === "function" || typeof value === "object") &&
        "ptr" in value) ||
      value instanceof Buffer
    ) {
      return value;
    } else if (typeof value === "number") {
      if (Number.isInteger(value)) {
        return JuliaInt64.from(value);
      } else {
        return JuliaFloat64.from(value);
      }
    } else if (typeof value === "bigint") {
      return JuliaInt64.from(value);
    } else if (typeof value === "string") {
      return JuliaString.from(value);
    } else if (typeof value === "boolean") {
      return JuliaBool.from(value);
    } else if (typeof value === "undefined") {
      return JuliaNothing.getInstance();
    } else if (
      value instanceof Int8Array ||
      value instanceof Uint8Array ||
      value instanceof Int16Array ||
      value instanceof Uint16Array ||
      value instanceof Int32Array ||
      value instanceof Uint32Array ||
      value instanceof Float32Array ||
      value instanceof Float64Array ||
      value instanceof Uint8ClampedArray ||
      value instanceof BigInt64Array ||
      value instanceof BigUint64Array
    ) {
      return JuliaArray.from(value);
    } else if (Array.isArray(value)) {
      return JuliaArray.fromAny(value);
    } else {
      try {
        return JuliaNamedTuple.from(value);
      } catch (_) {
        throw new MethodError(`Cannot convert to Julia value: ${value}`);
      }
    }
  }

  /**
   * Fetch a Julia function from the given module.
   *
   * @param module Module to be fetched from.
   * @param name Name of the function to be fetched.
   */
  public static getFunction(module: JuliaModule, name: string): JuliaFunction {
    const cName = safeCString(name);
    const funcPtr = jlbun.symbols.jl_function_getter(module.ptr, cName);
    if (funcPtr === null) {
      throw new Error(`Failed to get function '${name}' from Julia module`);
    }
    return new JuliaFunction(funcPtr, name);
  }

  /**
   * Wrap a pointer as a `JuliaValue` object.
   * Uses Map lookup for common types (O(1)) before falling back
   * to string comparison for parametric and special types.
   *
   * @param ptr Pointer to the Julia object.
   */
  public static wrapPtr(ptr: Pointer): JuliaValue {
    const typePtr = jlbun.symbols.jl_typeof_getter(ptr)!;

    // Fast path: O(1) Map lookup for simple types
    const simpleCtor = Julia.simpleTypeConstructors.get(typePtr);
    if (simpleCtor) {
      return simpleCtor(ptr);
    }

    // Special types that need extra logic
    if (typePtr === Julia.Symbol.ptr) {
      const namePtr = jlbun.symbols.jl_symbol_name_getter(ptr);
      if (namePtr === null) {
        throw new Error(
          "Failed to get symbol name pointer from Julia symbol object",
        );
      }
      return new JuliaSymbol(ptr, namePtr.toString());
    }
    if (typePtr === Julia.Module.ptr) {
      return new JuliaModule(ptr, Julia.Base.string(new JuliaAny(ptr)).value);
    }
    if (typePtr === Julia.DataType.ptr) {
      return new JuliaDataType(ptr, Julia.Base.string(new JuliaAny(ptr)).value);
    }

    // Get type string (cached)
    let typeStr = Julia.typeStrCache.get(typePtr);
    if (typeStr === undefined) {
      typeStr = jlbun.symbols.jl_typeof_str(ptr).toString();
      Julia.typeStrCache.set(typePtr, typeStr);
    }

    // Handle parametric types by type string
    switch (typeStr) {
      case "Array": {
        const elType = jlbun.symbols.jl_array_eltype(ptr)!;
        return new JuliaArray(
          ptr,
          new JuliaDataType(elType, Julia.getTypeStr(elType)),
        );
      }
      case "Tuple":
        return new JuliaTuple(ptr);
      case "Pair":
        return new JuliaPair(ptr);
      case "NamedTuple":
        return new JuliaNamedTuple(ptr);
      case "Ptr":
        return new JuliaPtr(ptr);
    }

    // Handle parametric collection types
    if (typeStr === "Set" || typeStr.startsWith("Set{")) {
      return new JuliaSet(ptr);
    }
    if (typeStr === "Dict" || typeStr.startsWith("Dict{")) {
      return new JuliaDict(ptr);
    }
    if (typeStr === "IdDict" || typeStr.startsWith("IdDict{")) {
      return new JuliaIdDict(ptr);
    }

    // Handle Range types (UnitRange, StepRange, StepRangeLen, LinRange)
    if (
      typeStr === "UnitRange" ||
      typeStr.startsWith("UnitRange{") ||
      typeStr === "StepRange" ||
      typeStr.startsWith("StepRange{") ||
      typeStr === "StepRangeLen" ||
      typeStr.startsWith("StepRangeLen{") ||
      typeStr === "LinRange" ||
      typeStr.startsWith("LinRange{")
    ) {
      return new JuliaRange(ptr);
    }

    // Handle SubArray type
    if (typeStr === "SubArray" || typeStr.startsWith("SubArray{")) {
      const elTypePtr = jlbun.symbols.jl_array_eltype(ptr);
      if (elTypePtr === null) {
        return new JuliaAny(ptr);
      }
      return new JuliaSubArray(
        ptr,
        new JuliaDataType(elTypePtr, Julia.getTypeStr(elTypePtr)),
      );
    }

    // Handle lambda functions (type starts with #)
    if (typeStr[0] === "#") {
      const funcName =
        typeStr[1] >= "0" && typeStr[1] <= "9"
          ? "Lambda" + typeStr
          : typeStr.slice(1);
      return new JuliaFunction(ptr, funcName);
    }

    return new JuliaAny(ptr);
  }

  /**
   * Wrap a function with several arguments so that it can be run in a `JuliaTask`.
   *
   * @param func Function to be wrapped.
   * @param kwargs Keyword arguments.
   * @param args Variable arguments.
   */
  public static wrapFunctionCall(
    func: JuliaFunction,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kwargs: JuliaNamedTuple | Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): JuliaFunction {
    const kwsorter = Julia.Core.kwfunc(func);
    const wrappedKwargs =
      kwargs instanceof JuliaNamedTuple ? kwargs : JuliaNamedTuple.from(kwargs);
    const wrappedArgs = args.map(Julia.autoWrap);
    if (wrappedKwargs.length > 0) {
      wrappedArgs.splice(0, 0, wrappedKwargs, func);
    }

    const wrappedFunc = Julia.tagEval`
      let
          func = ${wrappedKwargs.length > 0 ? kwsorter : func}
          args = ${wrappedArgs}
          return () -> func(args...)
      end` as JuliaFunction;
    return wrappedFunc;
  }

  private static handleEvalException(code: string): void {
    const errPtr = jlbun.symbols.jl_exception_occurred();
    if (errPtr !== null) {
      const errType = Julia.getTypeStr(errPtr);

      // Try to get the exception message
      let errMsg = code;
      try {
        const stringFunc = Julia.Base?.["string"];
        if (stringFunc) {
          const errJuliaValue = new JuliaAny(errPtr);
          const msgPtr = Julia.call(stringFunc, errJuliaValue);
          if (msgPtr && msgPtr.ptr) {
            errMsg = `${code}: ${msgPtr.toString()}`;
          }
        }
      } catch {
        // Fall back to code only
      }

      throw createJuliaError(errType, errMsg);
    }
  }

  public static handleCallException(
    func: JuliaFunction,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kwargs: JuliaNamedTuple | Record<string, any> = {},
  ): void {
    const errPtr = jlbun.symbols.jl_exception_occurred();
    if (errPtr !== null) {
      const errType = Julia.getTypeStr(errPtr);
      const funcCallParts = [
        func.name,
        "(",
        args.map((arg) => arg.toString()).join(", "),
        "; ",
      ];
      funcCallParts.push(
        Object.entries(
          kwargs instanceof JuliaNamedTuple ? kwargs.value : kwargs,
        )
          .map(([key, value]) => `${key} = ${value}`)
          .join(", "),
      );
      funcCallParts.push(")");
      const funcCall = funcCallParts.join("");

      // Try to get the exception message by calling Julia's string() function
      let errMsg = errType;
      try {
        // Create a Julia string from the exception
        const stringFunc = Julia.Base["string"];
        if (stringFunc) {
          const errJuliaValue = new JuliaAny(errPtr);
          const msgPtr = Julia.call(stringFunc, errJuliaValue);
          if (msgPtr && msgPtr.ptr) {
            errMsg = msgPtr.toString();
          }
        }
      } catch {
        // If we can't get the message, fall back to the type
        errMsg = errType;
      }

      throw createJuliaError(errType, `${funcCall}: ${errMsg}`);
    }
  }

  /**
   * Call a Julia function with variable arguments.
   *
   * @param func The Julia function to be called.
   * @param args The arguments to be passed to the function. Non-`JuliaValue` objects will be automatically wrapped by `Julia.autoWrap`. Since the automatic wrapping does not work perfectly all the time, be sure to wrap the objects yourself in order to feed the function with the exact types.
   */
  public static call(
    func: JuliaFunction,
    ...args: unknown[]
  ): JuliaValue | undefined {
    const wrappedArgs = args.map((arg) => Julia.autoWrap(arg).ptr);

    let ret: Pointer | null;
    if (args.length == 0) {
      ret = jlbun.symbols.jl_call0(func.ptr);
    } else if (args.length == 1) {
      ret = jlbun.symbols.jl_call1(func.ptr, wrappedArgs[0]);
    } else if (args.length == 2) {
      ret = jlbun.symbols.jl_call2(func.ptr, wrappedArgs[0], wrappedArgs[1]);
    } else if (args.length == 3) {
      ret = jlbun.symbols.jl_call3(
        func.ptr,
        wrappedArgs[0],
        wrappedArgs[1],
        wrappedArgs[2],
      );
    } else {
      ret = jlbun.symbols.jl_call(
        func.ptr,
        new BigInt64Array(wrappedArgs.map(BigInt)),
        args.length,
      );
    }

    if (ret === null) {
      Julia.handleCallException(func, args);
      return undefined;
    } else {
      return Julia.wrapPtr(ret);
    }
  }

  /**
   * Call a Julia function with keyword arguments and variable arguments.
   *
   * @param func The Julia function to be called.
   * @param kwargs Keyword arguments to be passed to the function. If a plain object is provided, it will be automatically wrapped as a `JuliaNamedTuple`. Be sure to wrap it yourself to get exact typing.
   * @param args Variable arguments to be passed to the function. Non-`JuliaValue` objects will be automatically wrapped by. Be sure to wrap it yourself to get exact typing.
   */
  public static callWithKwargs(
    func: JuliaFunction,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kwargs: JuliaNamedTuple | Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): JuliaValue {
    const kwsorter = Julia.Core.kwfunc(func);
    const wrappedKwargs =
      kwargs instanceof JuliaNamedTuple ? kwargs : JuliaNamedTuple.from(kwargs);

    const wrappedArgs = args.map((arg) => Julia.autoWrap(arg).ptr);

    let ret: Pointer;
    if (args.length == 0) {
      ret = jlbun.symbols.jl_call2(kwsorter.ptr, wrappedKwargs.ptr, func.ptr)!;
    } else if (args.length == 1) {
      ret = jlbun.symbols.jl_call3(
        kwsorter.ptr,
        wrappedKwargs.ptr,
        func.ptr,
        wrappedArgs[0],
      )!;
    } else {
      wrappedArgs.splice(0, 0, wrappedKwargs.ptr, func.ptr);
      ret = jlbun.symbols.jl_call(
        kwsorter.ptr,
        new BigInt64Array(wrappedArgs.map(BigInt)),
        args.length + 2,
      )!;
    }

    Julia.handleCallException(func, args, kwargs);
    return Julia.wrapPtr(ret);
  }

  /**
   * Evaluate a Julia code fragment and get the result as a `JuliaValue`.
   *
   * @param code Julia code to be evaluated.
   */
  public static eval(code: string): JuliaValue {
    const cCode = safeCString(code);
    const ret = jlbun.symbols.jl_eval_string(cCode)!;
    Julia.handleEvalException(code);
    return Julia.wrapPtr(ret);
  }

  /**
   * Evaluate a Julia code fragment and get the result as a `JuliaValue`.
   * This method supports value-interpolation, meaning that the tagged
   * values will be automatically wrapped and interpolated into the code.
   *
   * @param strings Strings separated by tagged values
   * @param values Tagged values to be interpolated
   */
  public static tagEval(
    strings: TemplateStringsArray,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...values: any[]
  ): JuliaValue {
    const uuids = Array.from(
      { length: values.length },
      () => `${randomUUID()}`,
    );
    for (let i = 0; i < values.length; i++) {
      Julia.setGlobal(uuids[i], Julia.autoWrap(values[i]));
    }
    const codeParts: string[] = strings.slice(0, 1);
    for (let i = 0; i < strings.length - 1; i++) {
      codeParts.push(`__jlbun_globals__["${uuids[i]}"]`);
      codeParts.push(strings[i + 1]);
    }
    try {
      return Julia.eval(codeParts.join(""));
    } finally {
      // Clean up temporary globals to prevent memory leak
      for (const uuid of uuids) {
        Julia.deleteGlobal(uuid);
      }
    }
  }

  /**
   * Import a module and get a `JuliaModule` object referring to that module.
   *
   * @param name Name of the module to be imported.
   */
  public static import(name: string): JuliaModule {
    Julia.eval(`import ${name}`);
    const module = new JuliaModule(Julia.Main[name].ptr, `Main.${name}`);
    Julia.prefetch(module);
    return module;
  }

  /**
   * Shortcut for `Julia.Base.include`.
   *
   * @param file Relative path of the file to be included.
   * @param target Module to include the file. Default to `Main`.
   * @param mapFn Mapping function that will be applied to each `Expr` in the included file.
   */
  public static include(
    file: string,
    target: JuliaModule = Julia.Main,
    mapFn?: JuliaFunction,
  ): JuliaValue {
    if (mapFn !== undefined) {
      return Julia.Base.include(mapFn, target, file);
    } else {
      return Julia.Base.include(target, file);
    }
  }

  /**
   * Shortcut for `Julia.Base.include_string`.
   *
   * @param code Code string to be included.
   * @param target Module to include the file. Default to `Main`.
   * @param mapFn Mapping function that will be applied to each `Expr` in the included code string.
   */
  public static includeString(
    code: string,
    target: JuliaModule = Julia.Main,
    mapFn?: JuliaFunction,
  ): JuliaValue {
    if (mapFn !== undefined) {
      return Julia.Base.include_string(mapFn, target, code);
    } else {
      return Julia.Base.include_string(target, code);
    }
  }

  /**
   * Get a string representation of a `JuliaValue` using Julia's `repr()` function, with the given MIME.
   *
   * @param value Object to be represented.
   * @param mime The MIME to use. Default to `MIME.Default`.
   */
  public static repr(value: JuliaValue, mime: MIME = MIME.Default): string {
    if (mime == "") {
      return (Julia.Base.repr(value) as JuliaString).value;
    } else {
      return (Julia.Base.repr(mime, value) as JuliaString).value;
    }
  }

  /**
   * Stringify a `JuliaValue` using Julia's `string()` function,
   *
   * @param value Object to be stringified.
   */
  public static string(value: JuliaValue): string {
    return (Julia.Base.string(value) as JuliaString).value;
  }

  /**
   * Shortcut for `Julia.Base.print()`.
   *
   * @param value Object to be printed.
   */
  public static print(value: JuliaValue): void {
    Julia.Base.print(value);
  }

  /**
   * Shortcut for `Julia.Base.println()`.
   *
   * @param value Object to be printed.
   */
  public static println(value: JuliaValue): void {
    Julia.Base.println(value);
  }

  /**
   * Execute code within a scoped context where Julia objects are automatically
   * tracked and released when the scope ends.
   *
   * Objects created through the scoped `julia` proxy are automatically tracked
   * and released when the scope ends. This provides automatic memory management
   * without manual `setGlobal()` or `deleteGlobal()` calls.
   *
   * @param fn A function that receives a ScopedJulia proxy and returns a value.
   * @returns The return value of the function.
   *
   * @example
   * ```typescript
   * const result = Julia.scope((julia) => {
   *   const a = julia.Base.rand(1000, 1000);
   *   const b = julia.Base.rand(1000, 1000);
   *   const c = julia.Base["*"](a, b);
   *   return c.value; // Return JS value, Julia objects are auto-released
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Return a Julia object that escapes the scope
   * const arr = Julia.scope((julia) => {
   *   const temp = julia.Base.rand(100);
   *   const sorted = julia.Base.sort(temp);
   *   return julia.escape(sorted); // Escape from scope
   * });
   * // arr is still valid here
   * ```
   */
  public static scope<T>(fn: (julia: ScopedJulia) => T): T {
    const scope = new JuliaScope();
    try {
      const result = fn(scope.julia);

      // If result is a JuliaValue that wasn't escaped, escape it automatically
      if (
        result &&
        typeof result === "object" &&
        "ptr" in result &&
        !scope.isDisposed
      ) {
        scope.escape(result as unknown as JuliaValue);
      }

      return result;
    } finally {
      scope.dispose();
    }
  }

  /**
   * Execute async code within a scoped context where Julia objects are
   * automatically tracked and released when the scope ends.
   *
   * @param fn An async function that receives a ScopedJulia proxy.
   * @returns A promise that resolves to the return value of the function.
   *
   * @example
   * ```typescript
   * const result = await Julia.scopeAsync(async (julia) => {
   *   const task = JuliaTask.from(julia.eval("() -> sum(1:1000)"));
   *   const value = await task.value;
   *   return value.value;
   * });
   * ```
   */
  public static async scopeAsync<T>(
    fn: (julia: ScopedJulia) => Promise<T>,
  ): Promise<T> {
    const scope = new JuliaScope();
    try {
      const result = await fn(scope.julia);

      // If result is a JuliaValue that wasn't escaped, escape it automatically
      if (
        result &&
        typeof result === "object" &&
        "ptr" in result &&
        !scope.isDisposed
      ) {
        scope.escape(result as unknown as JuliaValue);
      }

      return result;
    } finally {
      scope.dispose();
    }
  }

  /**
   * Close the Julia runtime and also close the dynamic library.
   *
   * @param status Status code to be reported.
   */
  public static close(status = 0) {
    GCManager.close();
    jlbun.symbols.jl_atexit_hook(status);
    jlbun.close();
  }
}
