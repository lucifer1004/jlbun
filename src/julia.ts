import { CString, toArrayBuffer } from "bun:ffi";
import {
  IJuliaValue,
  InexactError,
  jlbun,
  JuliaAny,
  JuliaArray,
  JuliaBool,
  JuliaDataType,
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
  JuliaString,
  JuliaSymbol,
  JuliaTuple,
  JuliaUInt8,
  JuliaUInt16,
  JuliaUInt32,
  JuliaUInt64,
  MethodError,
  safeCString,
  UnknownJuliaError,
} from "./index.js";

interface IJuliaInitOptions {
  bindir: string;
  sysimage: string;
  project: string | null;
}

const DEFAULT_JULIA_INIT_OPTIONS = {
  bindir: "",
  sysimage: "",
  project: null,
};

export class Julia {
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

  public static init(extraOptions: Partial<IJuliaInitOptions> = {}): void {
    const options = { ...DEFAULT_JULIA_INIT_OPTIONS, ...extraOptions };

    if (!Julia.Base) {
      if (options.sysimage === "" || options.bindir === "") {
        jlbun.symbols.jl_init0();
      } else {
        jlbun.symbols.jl_init_with_image0(
          safeCString(options.bindir),
          safeCString(options.sysimage),
        );
      }
      Julia.Base = new JuliaModule(
        jlbun.symbols.jl_base_module_getter(),
        "Base",
      );
      Julia.Main = new JuliaModule(
        jlbun.symbols.jl_main_module_getter(),
        "Main",
      );
      Julia.Pkg = Julia.import("Pkg");

      // Prefetch all the properties of Base, Core and Main
      Julia.prefetch(Julia.Base);
      Julia.prefetch(Julia.Main);
      Julia.prefetch(Julia.Pkg);

      if (options.project === "") {
        Julia.Pkg.activate(options.project);
      } else if (options.project !== null) {
        Julia.eval("Pkg.activate(; temp=true)");
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

  public static getFunction(module: JuliaModule, name: string): JuliaFunction {
    const cName = safeCString(name);
    return new JuliaFunction(
      jlbun.symbols.jl_function_getter(module.ptr, cName),
      name,
    );
  }

  public static getProperties(obj: IJuliaValue): string[] {
    const len = Number(jlbun.symbols.jl_propertycount(obj.ptr));
    const rawPtr = jlbun.symbols.jl_propertynames(obj.ptr);
    const propPointers = new BigUint64Array(toArrayBuffer(rawPtr, 0, 8 * len));
    const props: string[] = [];
    for (let i = 0; i < len; i++) {
      props.push(new CString(Number(propPointers[i])).toString());
    }
    return props;
  }

  public static getTypeStr(ptr: number | IJuliaValue): string {
    if (typeof ptr === "number") {
      return new CString(jlbun.symbols.jl_typeof_str(ptr)).toString();
    } else {
      return new CString(jlbun.symbols.jl_typeof_str(ptr.ptr)).toString();
    }
  }

  public static wrapPtr(ptr: number): IJuliaValue {
    const typeStr = Julia.getTypeStr(ptr);
    if (typeStr === "String") {
      return new JuliaString(ptr);
    } else if (typeStr === "Bool") {
      return new JuliaBool(ptr);
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
      const elTypeStr = jlbun.symbols.jl_typeof_str(elType).toString();
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
    } else if (typeStr === "NamedTuple") {
      return new JuliaNamedTuple(ptr);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static autoWrap(value: any): IJuliaValue {
    if (
      (typeof value === "function" || typeof value === "object") &&
      "ptr" in value
    ) {
      return value;
    } else if (typeof value === "number") {
      if (Number.isInteger(value)) {
        return JuliaInt64.from(value);
      } else {
        return JuliaFloat64.from(value);
      }
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

  public static import(name: string): JuliaModule {
    Julia.eval(`import ${name}`);
    const module = new JuliaModule(Julia.Main[name].ptr, `Main.${name}`);
    Julia.prefetch(module);
    return module;
  }

  public static eval(code: string): IJuliaValue {
    const cCode = safeCString(code);
    const ret = jlbun.symbols.jl_eval_string(cCode);

    // Error handling
    const err = jlbun.symbols.jl_exception_occurred();
    if (err !== null) {
      const errType = new CString(jlbun.symbols.jl_typeof_str(err)).toString();
      if (errType == "MethodError") {
        throw new MethodError(code);
      } else if (errType == "InexactError") {
        throw new InexactError(code);
      } else {
        throw new UnknownJuliaError(errType);
      }
    }

    return Julia.wrapPtr(ret);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static call(func: JuliaFunction, ...args: any[]): IJuliaValue {
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

    // Error handling
    const err = jlbun.symbols.jl_exception_occurred();
    if (err !== null) {
      const errType = new CString(jlbun.symbols.jl_typeof_str(err)).toString();
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

    return Julia.wrapPtr(ret);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static apply(func: JuliaFunction, args: any[]) {
    return this.call(func, ...args);
  }

  public static close(status = 0) {
    jlbun.symbols.jl_atexit_hook(status);
    jlbun.close();
  }
}
