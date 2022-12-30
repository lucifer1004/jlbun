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

export class JuliaSymbol extends JuliaPrimitive {
  name: string;

  constructor(ptr: number, name: string) {
    super(ptr);
    this.name = name;
  }

  static from(value: string): JuliaSymbol {
    return new JuliaSymbol(jlbun.symbols.jl_symbol(safeCString(value)), value);
  }

  get value(): symbol {
    return Symbol.for(this.name);
  }
}

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

export class JuliaAny implements JuliaValue {
  ptr: number;
  display?: string;

  constructor(ptr: number) {
    this.ptr = ptr;
    this.display = undefined;
  }

  get value(): string {
    if (this.display === undefined) {
      this.display = Julia.string(this);
    }
    return this.display;
  }

  toString(): string {
    return `[JuliaValue ${this.value}`;
  }
}
