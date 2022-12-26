import { jlbun } from "./wrapper.js";

export interface WrappedPointer {
  ptr: number;
}

export class JuliaModule implements WrappedPointer {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
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
    Julia.getInstance().call(this, ...args);
  }

  call(...args: any[]): any {
    Julia.getInstance().call(this, ...args);
  }

  apply(args: any[]): any {
    Julia.getInstance().call(this, ...args);
  }
}

export class Julia {
  private static instance: Julia;
  public static Base: JuliaModule;
  public static Core: JuliaModule;
  public static Main: JuliaModule;

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

  private constructor() {
    jlbun.symbols.jl_init();
  }

  private static safeCString(s: string): Buffer {
    // FIXME: need to copy the buffer again to avoid memory corruption
    return Buffer.from(Buffer.from(s));
  }

  public static getInstance(): Julia {
    if (!Julia.instance) {
      Julia.instance = new Julia();
      Julia.Base = new JuliaModule(jlbun.symbols.jl_base_module_getter());
      Julia.Core = new JuliaModule(jlbun.symbols.jl_core_module_getter());
      Julia.Main = new JuliaModule(jlbun.symbols.jl_main_module_getter());

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
      Julia.Float16 = new JuliaDataType(
        jlbun.symbols.jl_float16_type_getter(),
      );
      Julia.Float32 = new JuliaDataType(
        jlbun.symbols.jl_float32_type_getter(),
      );
      Julia.Float64 = new JuliaDataType(
        jlbun.symbols.jl_float64_type_getter(),
      );
    }

    return Julia.instance;
  }

  public getFunction(module: JuliaModule, name: string): JuliaFunction {
    const cName = Julia.safeCString(name);
    return new JuliaFunction(
      jlbun.symbols.jl_function_getter(module.ptr, cName),
    );
  }

  public eval(code: string): WrappedPointer {
    const cCode = Julia.safeCString(code);
    return { ptr: jlbun.symbols.jl_eval_string(cCode) };
  }

  public call(func: JuliaFunction, ...args: any[]): any {
    const bigArgs = new BigUint64Array(args.length);
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === "object" && "ptr" in args[i]) {
        bigArgs[i] = BigInt(args[i].ptr);
      } else if (typeof args[i] === "number") {
        if (Number.isInteger(args[i])) {
          bigArgs[i] = BigInt(jlbun.symbols.jl_box_int64(args[i]));
        } else {
          bigArgs[i] = BigInt(jlbun.symbols.jl_box_float64(args[i]));
        }
      } else if (typeof args[i] === "string") {
        bigArgs[i] = BigInt(
          jlbun.symbols.jl_cstr_to_string(Julia.safeCString(args[i])),
        );
      }
    }
    return jlbun.symbols.jl_call(func.ptr, bigArgs, args.length);
  }

  public apply(func: JuliaFunction, args: any[]) {
    return this.call(func, ...args);
  }

  public close() {
    jlbun.symbols.jl_atexit_hook(0);
    jlbun.close();
  }
}
