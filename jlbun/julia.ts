import { ptr } from "bun:ffi";
import { randomUUID } from "crypto";
import {
  InexactError,
  jlbun,
  JuliaAny,
  JuliaArray,
  JuliaBool,
  JuliaChar,
  JuliaDataType,
  JuliaDict,
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
  JuliaSet,
  JuliaString,
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
  UnknownJuliaError,
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
};

export class Julia {
  private static options: JuliaOptions = DEFAULT_JULIA_OPTIONS;
  private static globals: JuliaIdDict;
  public static nthreads: number;

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

  private static prefetch(module: JuliaModule): void {
    const props = Julia.getModuleExports(module);
    for (const prop of props) {
      try {
        module[prop];
      } catch (e) {
        console.error(`Failed to prefetch ${prop} from ${module.name}!`);
      }
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

      Julia.Any = new JuliaDataType(jlbun.symbols.jl_any_type_getter(), "Any");
      Julia.Nothing = new JuliaDataType(
        jlbun.symbols.jl_nothing_type_getter(),
        "Nothing",
      );
      Julia.Symbol = new JuliaDataType(
        jlbun.symbols.jl_symbol_type_getter(),
        "Symbol",
      );
      Julia.Function = new JuliaDataType(
        jlbun.symbols.jl_function_type_getter(),
        "Function",
      );
      Julia.String = new JuliaDataType(
        jlbun.symbols.jl_string_type_getter(),
        "String",
      );
      Julia.Bool = new JuliaDataType(
        jlbun.symbols.jl_bool_type_getter(),
        "Bool",
      );
      Julia.Char = new JuliaDataType(
        jlbun.symbols.jl_char_type_getter(),
        "Char",
      );
      Julia.Int8 = new JuliaDataType(
        jlbun.symbols.jl_int8_type_getter(),
        "Int8",
      );
      Julia.UInt8 = new JuliaDataType(
        jlbun.symbols.jl_uint8_type_getter(),
        "UInt8",
      );
      Julia.Int16 = new JuliaDataType(
        jlbun.symbols.jl_int16_type_getter(),
        "Int16",
      );
      Julia.UInt16 = new JuliaDataType(
        jlbun.symbols.jl_uint16_type_getter(),
        "UInt16",
      );
      Julia.Int32 = new JuliaDataType(
        jlbun.symbols.jl_int32_type_getter(),
        "Int32",
      );
      Julia.UInt32 = new JuliaDataType(
        jlbun.symbols.jl_uint32_type_getter(),
        "UInt32",
      );
      Julia.Int64 = new JuliaDataType(
        jlbun.symbols.jl_int64_type_getter(),
        "Int64",
      );
      Julia.UInt64 = new JuliaDataType(
        jlbun.symbols.jl_uint64_type_getter(),
        "UInt64",
      );
      Julia.Float16 = new JuliaDataType(
        jlbun.symbols.jl_float16_type_getter(),
        "Float16",
      );
      Julia.Float32 = new JuliaDataType(
        jlbun.symbols.jl_float32_type_getter(),
        "Float32",
      );
      Julia.Float64 = new JuliaDataType(
        jlbun.symbols.jl_float64_type_getter(),
        "Float64",
      );

      Julia.Core = new JuliaModule(
        jlbun.symbols.jl_core_module_getter(),
        "Core",
      );
      Julia.Base = new JuliaModule(
        jlbun.symbols.jl_base_module_getter(),
        "Base",
      );
      Julia.Main = new JuliaModule(
        jlbun.symbols.jl_main_module_getter(),
        "Main",
      );
      Julia.Pkg = Julia.import("Pkg");

      // Prefetch all the properties of Core, Base and Main
      Julia.prefetch(Julia.Core);
      Julia.prefetch(Julia.Base);
      Julia.prefetch(Julia.Main);
      Julia.prefetch(Julia.Pkg);

      if (Julia.options.project === null) {
        Julia.eval("Pkg.activate(; temp=true)");
      } else if (Julia.options.project !== "") {
        Julia.Pkg.activate(Julia.options.project);
      }

      Julia.nthreads = Number(Julia.eval("Threads.nthreads()").value);
      Julia.eval("__jlbun_globals__ = IdDict()");
      Julia.globals = new JuliaIdDict(
        jlbun.symbols.jl_get_global(
          Julia.Main.ptr,
          JuliaSymbol.from("__jlbun_globals__").ptr,
        ),
      );
    }
  }

  private static getModuleExports(obj: JuliaValue): string[] {
    return Julia.Base.names(obj).value.map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (x: symbol) => x.description!,
    );
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
   * Get the string representation of a Julia value's type.
   *
   * @param ptr Pointer to a Julia object, or a `JuliaValue` object.
   */
  public static getTypeStr(ptr: number | JuliaValue): string {
    if (typeof ptr === "number") {
      return jlbun.symbols.jl_typeof_str(ptr).toString();
    } else {
      return jlbun.symbols.jl_typeof_str(ptr.ptr).toString();
    }
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
      const arr = JuliaArray.init(Julia.Any, 0);
      for (const v of value) {
        arr.push(Julia.autoWrap(v));
      }
      return arr;
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
    return new JuliaFunction(
      jlbun.symbols.jl_function_getter(module.ptr, cName),
      name,
    );
  }

  /**
   * Wrap a pointer as a `JuliaValue` object.
   *
   * @param ptr Pointer to the Julia object.
   */
  public static wrapPtr(ptr: number): JuliaValue {
    const typeStr = Julia.getTypeStr(ptr);
    if (typeStr === "String") {
      return new JuliaString(ptr);
    } else if (typeStr === "Bool") {
      return new JuliaBool(ptr);
    } else if (typeStr === "Char") {
      return new JuliaChar(ptr);
    } else if (typeStr === "Int8") {
      return new JuliaInt8(ptr);
    } else if (typeStr === "UInt8") {
      return new JuliaUInt8(ptr);
    } else if (typeStr === "Int16") {
      return new JuliaInt16(ptr);
    } else if (typeStr === "UInt16") {
      return new JuliaUInt16(ptr);
    } else if (typeStr === "Int32") {
      return new JuliaInt32(ptr);
    } else if (typeStr === "UInt32") {
      return new JuliaUInt32(ptr);
    } else if (typeStr === "Int64") {
      return new JuliaInt64(ptr);
    } else if (typeStr === "UInt64") {
      return new JuliaUInt64(ptr);
    } else if (typeStr === "Float16") {
      return new JuliaFloat32(ptr);
    } else if (typeStr === "Float32") {
      return new JuliaFloat32(ptr);
    } else if (typeStr === "Float64") {
      return new JuliaFloat64(ptr);
    } else if (typeStr === "Module") {
      return new JuliaModule(ptr, Julia.Base.string(new JuliaAny(ptr)).value);
    } else if (typeStr === "Array") {
      const elType = jlbun.symbols.jl_array_eltype(ptr);
      const elTypeStr = Julia.getTypeStr(elType);
      return new JuliaArray(ptr, new JuliaDataType(elType, elTypeStr));
    } else if (typeStr === "Nothing") {
      return JuliaNothing.getInstance();
    } else if (typeStr === "DataType") {
      return new JuliaDataType(ptr, Julia.Base.string(new JuliaAny(ptr)).value);
    } else if (typeStr === "Symbol") {
      return new JuliaSymbol(
        ptr,
        jlbun.symbols.jl_symbol_name_getter(ptr).toString(),
      );
    } else if (typeStr === "Tuple") {
      return new JuliaTuple(ptr);
    } else if (typeStr === "Pair") {
      return new JuliaPair(ptr);
    } else if (typeStr === "NamedTuple") {
      return new JuliaNamedTuple(ptr);
    } else if (typeStr === "Set") {
      return new JuliaSet(ptr);
    } else if (typeStr === "Dict") {
      return new JuliaDict(ptr);
    } else if (typeStr === "IdDict") {
      return new JuliaIdDict(ptr);
    } else if (typeStr[0] === "#") {
      let funcName: string;
      if (typeStr[1] >= "0" && typeStr[1] <= "9") {
        funcName = "Lambda" + typeStr;
      } else {
        funcName = typeStr.slice(1);
      }
      return new JuliaFunction(ptr, funcName);
    } else if (typeStr === "Task") {
      return new JuliaTask(ptr);
    } else if (typeStr === "Ptr") {
      return new JuliaPtr(ptr);
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
    const wrappedArgs: number[] = args.map((arg) => Julia.autoWrap(arg).ptr);

    if (wrappedKwargs.length > 0) {
      wrappedArgs.splice(0, 0, wrappedKwargs.ptr, func.ptr);
    }

    const bigArgs = new BigInt64Array(wrappedArgs.map(BigInt));
    const funcPtr = wrappedKwargs.length === 0 ? func.ptr : kwsorter.ptr;
    const interpolated = `
      function ()
        ptr = ccall(:jl_call, 
          Ptr{Nothing}, 
          (Ptr{Nothing}, Ptr{Nothing}, Cint),
          convert(Ptr{Nothing}, ${funcPtr}),
          convert(Ptr{Nothing}, ${ptr(bigArgs as unknown as TypedArray)}),
          ${wrappedArgs.length},
        )
        
        unsafe_pointer_to_objref(ptr)
      end
    `;

    return Julia.eval(interpolated) as JuliaFunction;
  }

  private static handleEvalException(code: string): void {
    const errPtr = jlbun.symbols.jl_exception_occurred();
    if (errPtr !== null) {
      const errType = Julia.getTypeStr(errPtr);
      if (errType == "MethodError") {
        throw new MethodError(code);
      } else if (errType == "InexactError") {
        throw new InexactError(code);
      } else {
        console.log(Julia.getTypeStr(errPtr));
        console.log(Julia.string(Julia.wrapPtr(errPtr)));
        throw new UnknownJuliaError(errType);
      }
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

      if (errType == "MethodError") {
        throw new MethodError(funcCall);
      } else if (errType == "InexactError") {
        throw new InexactError(funcCall);
      } else {
        throw new UnknownJuliaError(Julia.string(Julia.wrapPtr(errPtr)));
      }
    }
  }

  /**
   * Call a Julia function with variable arguments.
   *
   * @param func The Julia function to be called.
   * @param args The arguments to be passed to the function. Non-`JuliaValue` objects will be automatically wrapped by `Julia.autoWrap`. Since the automatic wrapping does not work perfectly all the time, be sure to wrap the objects yourself in order to feed the function with the exact types.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static call(func: JuliaFunction, ...args: any[]): JuliaValue {
    const wrappedArgs: number[] = args.map((arg) => Julia.autoWrap(arg).ptr);

    let ret: number;
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

    Julia.handleCallException(func, args);
    return Julia.wrapPtr(ret);
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

    const wrappedArgs: number[] = args.map((arg) => Julia.autoWrap(arg).ptr);

    let ret: number;
    if (args.length == 0) {
      ret = jlbun.symbols.jl_call2(kwsorter.ptr, wrappedKwargs.ptr, func.ptr);
    } else if (args.length == 1) {
      ret = jlbun.symbols.jl_call3(
        kwsorter.ptr,
        wrappedKwargs.ptr,
        func.ptr,
        wrappedArgs[0],
      );
    } else {
      wrappedArgs.splice(0, 0, wrappedKwargs.ptr, func.ptr);
      ret = jlbun.symbols.jl_call(
        kwsorter.ptr,
        new BigInt64Array(wrappedArgs.map(BigInt)),
        args.length + 2,
      );
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
    const ret = jlbun.symbols.jl_eval_string(cCode);
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
      () => `tmp_${randomUUID()}`,
    );
    for (let i = 0; i < values.length; i++) {
      Julia.setGlobal(uuids[i], Julia.autoWrap(values[i]));
    }
    const codeParts: string[] = strings.slice(0, 1);
    for (let i = 0; i < strings.length - 1; i++) {
      codeParts.push(`__jlbun_globals__["${uuids[i]}"]`);
      codeParts.push(strings[i + 1]);
    }
    return Julia.eval(codeParts.join(""));
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
   * Close the Julia runtime and also close the dynamic library.
   *
   * @param status Status code to be reported.
   */
  public static close(status = 0) {
    jlbun.symbols.jl_atexit_hook(status);
    jlbun.close();
  }
}
