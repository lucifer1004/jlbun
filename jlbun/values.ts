import { jlbun, Julia, JuliaValue, MethodError, safeCString } from "./index.js";

abstract class JuliaPrimitive implements JuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  abstract get value(): number | bigint | boolean | string | symbol | null;

  toString(): string {
    return Julia.string(this);
  }
}

/**
 * Wrapper for Julia `Int8`.
 */
export class JuliaInt8 extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number): JuliaInt8 {
    return new JuliaInt8(jlbun.symbols.jl_box_int8(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_int8(this.ptr);
  }
}

/**
 * Wrapper for Julia `UInt8`.
 */
export class JuliaUInt8 extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number): JuliaUInt8 {
    return new JuliaUInt8(jlbun.symbols.jl_box_uint8(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_uint8(this.ptr);
  }
}

/**
 * Wrapper for Julia `Int16`.
 */
export class JuliaInt16 extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number): JuliaInt16 {
    return new JuliaInt16(jlbun.symbols.jl_box_int16(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_int16(this.ptr);
  }
}

/**
 * Wrapper for Julia UInt16.
 */
export class JuliaUInt16 extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number): JuliaUInt16 {
    return new JuliaUInt16(jlbun.symbols.jl_box_uint16(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_uint16(this.ptr);
  }
}

/**
 * Wrapper for Julia `Int32`.
 */
export class JuliaInt32 extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number): JuliaInt32 {
    return new JuliaInt32(jlbun.symbols.jl_box_int32(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_int32(this.ptr);
  }
}

/**
 * Wrapper for Julia `UInt32`.
 */
export class JuliaUInt32 extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number): JuliaUInt32 {
    return new JuliaUInt32(jlbun.symbols.jl_box_uint32(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_uint32(this.ptr);
  }
}

/**
 * Wrapper for Julia `Int64`.
 */
export class JuliaInt64 extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number | bigint): JuliaInt64 {
    return new JuliaInt64(jlbun.symbols.jl_box_int64(value));
  }

  get value(): bigint {
    return jlbun.symbols.jl_unbox_int64(this.ptr);
  }
}

/**
 * Wrapper for Julia `UInt64`.
 */
export class JuliaUInt64 extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number | bigint): JuliaUInt64 {
    return new JuliaUInt64(jlbun.symbols.jl_box_uint64(value));
  }

  get value(): bigint {
    return jlbun.symbols.jl_unbox_uint64(this.ptr);
  }
}

/**
 * Wrapper for Julia `Float32`.
 */
export class JuliaFloat32 extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number): JuliaFloat32 {
    return new JuliaFloat32(jlbun.symbols.jl_box_float32(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_float32(this.ptr);
  }
}

/**
 * Wrapper for Julia `Float64`.
 */
export class JuliaFloat64 extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number | bigint): JuliaFloat64 {
    return new JuliaFloat64(jlbun.symbols.jl_box_float64(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_float64(this.ptr);
  }
}

/**
 * Wrapper for Julia `Bool`.
 */
export class JuliaBool extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: boolean): JuliaBool {
    return new JuliaBool(jlbun.symbols.jl_box_bool(value));
  }

  get value(): boolean {
    return jlbun.symbols.jl_unbox_bool(this.ptr) === 1;
  }
}

/**
 * Wrapper for Julia `Char`.
 */
export class JuliaChar extends JuliaPrimitive {
  name: string;

  constructor(ptr: number) {
    super(ptr);
    this.name = Julia.string(this);
  }

  static from(value: string): JuliaChar {
    if (value.length !== 1) {
      throw new MethodError("Expected a single character");
    }
    return Julia.Base.Char(value.charCodeAt(0));
  }

  get value(): string {
    return this.name;
  }
}

/**
 * Wrapper for Julia `String`.
 */
export class JuliaString extends JuliaPrimitive {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: string): JuliaString {
    return new JuliaString(jlbun.symbols.jl_cstr_to_string(safeCString(value)));
  }

  get value(): string {
    return jlbun.symbols.jl_string_ptr(this.ptr).toString();
  }
}

/**
 * Wrapper for Julia `Symbol`.
 */
export class JuliaSymbol extends JuliaPrimitive {
  name: string;

  constructor(ptr: number, name: string) {
    super(ptr);
    this.name = name;
  }

  static from(value: string | symbol): JuliaSymbol {
    const name =
      typeof value === "string" ? value : (value.description as string);
    return new JuliaSymbol(jlbun.symbols.jl_symbol(safeCString(name)), name);
  }

  get value(): symbol {
    return Symbol.for(this.name);
  }
}

/**
 * Singleton wrapper for Julia `Nothing`.
 */
export class JuliaNothing extends JuliaPrimitive {
  static instance: JuliaNothing;

  private constructor(ptr: number) {
    super(ptr);
  }

  static getInstance(): JuliaNothing {
    if (!JuliaNothing.instance) {
      JuliaNothing.instance = new JuliaNothing(
        jlbun.symbols.jl_nothing_getter(),
      );
    }
    return JuliaNothing.instance;
  }

  get value(): null {
    return null;
  }
}

/**
 * Wrapper for Julia objects not handled yet.
 */
export class JuliaAny implements JuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  get value(): string {
    return this.toString();
  }

  toString(): string {
    return `[JuliaValue ${Julia.string(this)}]`;
  }
}
