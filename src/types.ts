import { CString, toArrayBuffer } from "bun:ffi";
import { safeCString } from "./utils.js";
import { jlbun } from "./wrapper.js";
import { InexactError, MethodError, UnknownJuliaError } from "./errors.js";

export interface WrappedPointer {
  ptr: number;
}

export class JuliaModule implements WrappedPointer {
  ptr: number;
  name: string;
  cache: Map<string, JuliaFunction>;
  [key: string]: any;

  constructor(ptr: number, name: string) {
    this.ptr = ptr;
    this.name = name;
    this.cache = new Map();

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === "ptr") {
          return target.ptr;
        }
        if (target.cache.has(prop as string)) {
          return target.cache.get(prop as string);
        }

        const exist = jlbun.symbols.jl_hasproperty(
          target.ptr,
          safeCString(prop as string),
        );
        if (exist === 0) {
          throw new MethodError(
            `${prop as string} does not exist in module ${target.name}!`,
          );
        }

        const juliaFunc = Julia.getFunction(target, prop as string);
        target.cache.set(prop as string, juliaFunc);
        return juliaFunc;
      },
    });
  }
}

export class JuliaDataType implements WrappedPointer {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }
}

export class JuliaFunction extends Function implements WrappedPointer {
  ptr: number;

  constructor(ptr: number) {
    super();
    this.ptr = ptr;
    return new Proxy(this, {
      apply: (target, _thisArg, args) => target._call(...args),
    });
  }

  _call(...args: any[]): any {
    return Julia.call(this, ...args);
  }

  call(...args: any[]): any {
    return Julia.call(this, ...args);
  }

  apply(args: any[]): any {
    return Julia.call(this, ...args);
  }
}

export class Julia {
  public static Base: JuliaModule;
  public static Core: JuliaModule;
  public static Main: JuliaModule;

  public static Any: JuliaDataType;
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
      module[prop];
    }
  }

  public static init(bindir: string = "", sysimage: string = ""): void {
    if (!Julia.Base) {
      if (sysimage === "") {
        jlbun.symbols.jl_init();
      } else {
        jlbun.symbols.jl_init_with_image(
          safeCString(bindir),
          safeCString(sysimage),
        );
      }
      Julia.Base = new JuliaModule(
        jlbun.symbols.jl_base_module_getter(),
        "Base",
      );
      Julia.Core = new JuliaModule(
        jlbun.symbols.jl_core_module_getter(),
        "Core",
      );
      Julia.Main = new JuliaModule(
        jlbun.symbols.jl_main_module_getter(),
        "Main",
      );

      // Prefetch all the properties of Base, Core and Main
      Julia.prefetch(Julia.Base);
      Julia.prefetch(Julia.Core);
      Julia.prefetch(Julia.Main);

      Julia.Any = new JuliaDataType(jlbun.symbols.jl_any_type_getter());
      Julia.Symbol = new JuliaDataType(jlbun.symbols.jl_symbol_type_getter());
      Julia.Function = new JuliaDataType(
        jlbun.symbols.jl_function_type_getter(),
      );
      Julia.String = new JuliaDataType(jlbun.symbols.jl_string_type_getter());
      Julia.Bool = new JuliaDataType(jlbun.symbols.jl_bool_type_getter());
      Julia.Char = new JuliaDataType(jlbun.symbols.jl_char_type_getter());
      Julia.Int8 = new JuliaDataType(jlbun.symbols.jl_int8_type_getter());
      Julia.UInt8 = new JuliaDataType(jlbun.symbols.jl_uint8_type_getter());
      Julia.Int16 = new JuliaDataType(jlbun.symbols.jl_int16_type_getter());
      Julia.UInt16 = new JuliaDataType(jlbun.symbols.jl_uint16_type_getter());
      Julia.Int32 = new JuliaDataType(jlbun.symbols.jl_int32_type_getter());
      Julia.UInt32 = new JuliaDataType(jlbun.symbols.jl_uint32_type_getter());
      Julia.Int64 = new JuliaDataType(jlbun.symbols.jl_int64_type_getter());
      Julia.UInt64 = new JuliaDataType(jlbun.symbols.jl_uint64_type_getter());
      Julia.Float16 = new JuliaDataType(jlbun.symbols.jl_float16_type_getter());
      Julia.Float32 = new JuliaDataType(jlbun.symbols.jl_float32_type_getter());
      Julia.Float64 = new JuliaDataType(jlbun.symbols.jl_float64_type_getter());
    }
  }

  public static getFunction(module: JuliaModule, name: string): JuliaFunction {
    const cName = safeCString(name);
    return new JuliaFunction(
      jlbun.symbols.jl_function_getter(module.ptr, cName),
    );
  }

  public static getProperties(obj: WrappedPointer): string[] {
    const len = Number(jlbun.symbols.jl_propertycount(obj.ptr));
    const rawPtr = jlbun.symbols.jl_propertynames(obj.ptr);
    let propPointers = new BigUint64Array(toArrayBuffer(rawPtr, 0, 8 * len));
    const props: string[] = [];
    for (let i = 0; i < len; i++) {
      props.push(new CString(Number(propPointers[i])).toString());
    }
    return props;
  }

  public static eval(code: string): any {
    const cCode = safeCString(code);
    return jlbun.symbols.jl_eval_string(cCode);
  }

  public static call(func: JuliaFunction, ...args: any[]): any {
    const wrappedArgs: number[] = args.map((arg) => {
      if (
        (typeof arg === "object" || typeof arg === "function") &&
        "ptr" in arg
      ) {
        return arg.ptr;
      } else if (typeof arg === "number") {
        if (Number.isInteger(arg)) {
          return jlbun.symbols.jl_box_int64(arg);
        } else {
          return jlbun.symbols.jl_box_float64(arg);
        }
      } else if (typeof arg === "string") {
        return jlbun.symbols.jl_cstr_to_string(safeCString(arg));
      } else {
        throw new MethodError("Unsupported argument type");
      }
    });

    let ret: any;
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
      if (errType == "MethodError") {
        throw new MethodError("MethodError");
      } else if (errType == "InexactError") {
        throw new InexactError("InexactError");
      } else {
        throw new UnknownJuliaError(errType);
      }
    }
    return ret;
  }

  public static apply(func: JuliaFunction, args: any[]) {
    return this.call(func, ...args);
  }

  public static close(status: number = 0) {
    jlbun.symbols.jl_atexit_hook(status);
    jlbun.close();
  }
}
