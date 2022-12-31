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
  JuliaInt8,
  JuliaInt16,
  JuliaInt32,
  JuliaInt64,
  JuliaModule,
  JuliaNamedTuple,
  JuliaNothing,
  JuliaPair,
  JuliaSet,
  JuliaString,
  JuliaSymbol,
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
  String = "",
  TextPlain = "text/plain",
  TextHTML = "text/html",
  TextLaTeX = "text/latex",
  TextMarkdown = "text/markdown",
}

interface JuliaOptions {
  bindir: string;
  sysimage: string;
  project: string | null;
  reprMIME: MIME;
}

const DEFAULT_JULIA_OPTIONS = {
  bindir: "",
  sysimage: "",
  project: "",
  reprMIME: MIME.TextPlain,
};

export class Julia {
  private static options: JuliaOptions = DEFAULT_JULIA_OPTIONS;

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
    const props = Julia.getProperties(module);
    for (const prop of props) {
      try {
        module[prop];
      } catch (e) {
        console.error(`Failed to prefetch ${prop} from ${module.name}!`);
      }
    }
  }

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
    }
  }

  private static getProperties(obj: JuliaValue): string[] {
    const properties = Julia.Base.propertynames(obj) as JuliaArray;
    const props: string[] = [];
    for (let i = 0; i < properties.length; i++) {
      const prop = (properties.get(i) as JuliaSymbol).name;
      props.push(prop);
    }
    return props;
  }

  public static getTypeStr(ptr: number | JuliaValue): string {
    if (typeof ptr === "number") {
      return jlbun.symbols.jl_typeof_str(ptr).toString();
    } else {
      return jlbun.symbols.jl_typeof_str(ptr.ptr).toString();
    }
  }

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
    } else if (Array.isArray(value)) {
      try {
        return JuliaArray.from(
          value as unknown as TypedArray | BigInt64Array | BigUint64Array,
        );
      } catch (_) {
        const arr = JuliaArray.init(Julia.Any, 0);
        for (const v of value) {
          arr.push(Julia.autoWrap(v));
        }
        return arr;
      }
    } else {
      throw new MethodError(`Cannot convert to Julia value: ${value}`);
    }
  }

  public static getFunction(module: JuliaModule, name: string): JuliaFunction {
    const cName = safeCString(name);
    return new JuliaFunction(
      jlbun.symbols.jl_function_getter(module.ptr, cName),
      name,
    );
  }

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
    } else if (typeStr[0] === "#") {
      let funcName: string;
      if (typeStr[1] >= "0" && typeStr[1] <= "9") {
        funcName = "Lambda" + typeStr;
      } else {
        funcName = typeStr.slice(1);
      }
      return new JuliaFunction(ptr, funcName);
    }

    return new JuliaAny(ptr);
  }

  private static handleEvalException(code: string): void {
    const err = jlbun.symbols.jl_exception_occurred();
    if (err !== null) {
      const errType = Julia.getTypeStr(err);
      if (errType == "MethodError") {
        throw new MethodError(code);
      } else if (errType == "InexactError") {
        throw new InexactError(code);
      } else {
        throw new UnknownJuliaError(errType);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static handleCallException(func: JuliaFunction, args: any[]): void {
    const err = jlbun.symbols.jl_exception_occurred();
    if (err !== null) {
      const errType = Julia.getTypeStr(err);
      const funcCall =
        func.name + "(" + args.map((arg) => arg.toString()).join(", ") + ")";
      if (errType == "MethodError") {
        throw new MethodError(funcCall);
      } else if (errType == "InexactError") {
        throw new InexactError(funcCall);
      } else {
        throw new UnknownJuliaError(errType);
      }
    }
  }

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

  public static eval(code: string): JuliaValue {
    const cCode = safeCString(code);
    const ret = jlbun.symbols.jl_eval_string(cCode);
    Julia.handleEvalException(code);
    return Julia.wrapPtr(ret);
  }

  public static import(name: string): JuliaModule {
    Julia.eval(`import ${name}`);
    const module = new JuliaModule(Julia.Main[name].ptr, `Main.${name}`);
    Julia.prefetch(module);
    return module;
  }

  public static repr(value: JuliaValue): string {
    if (Julia.options.reprMIME == "") {
      return (Julia.Base.repr(value) as JuliaString).value;
    } else {
      return (Julia.Base.repr(Julia.options.reprMIME, value) as JuliaString)
        .value;
    }
  }

  public static string(value: JuliaValue): string {
    return (Julia.Base.string(value) as JuliaString).value;
  }

  public static print(value: JuliaValue): void {
    Julia.Base.print(value);
  }

  public static println(value: JuliaValue): void {
    Julia.Base.println(value);
  }

  public static close(status = 0) {
    jlbun.symbols.jl_atexit_hook(status);
    jlbun.close();
  }
}
