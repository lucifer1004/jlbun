import { CString } from "bun:ffi";
import { jlbun, safeCString, IJuliaValue, Julia } from "./index.js";

export class JuliaInt8 implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: number): JuliaInt8 {
    return new JuliaInt8(jlbun.symbols.jl_box_int8(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_int8(this.ptr);
  }

  toString(): string {
    return this.value.toString();
  }
}

export class JuliaUInt8 implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: number): JuliaUInt8 {
    return new JuliaUInt8(jlbun.symbols.jl_box_uint8(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_uint8(this.ptr);
  }

  toString(): string {
    return this.value.toString();
  }
}

export class JuliaInt16 implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: number): JuliaInt16 {
    return new JuliaInt16(jlbun.symbols.jl_box_int16(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_int16(this.ptr);
  }

  toString(): string {
    return this.value.toString();
  }
}

export class JuliaUInt16 implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: number): JuliaUInt16 {
    return new JuliaUInt16(jlbun.symbols.jl_box_uint16(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_uint16(this.ptr);
  }

  toString(): string {
    return this.value.toString();
  }
}

export class JuliaInt32 implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: number): JuliaInt32 {
    return new JuliaInt32(jlbun.symbols.jl_box_int32(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_int32(this.ptr);
  }

  toString(): string {
    return this.value.toString();
  }
}

export class JuliaUInt32 implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: number): JuliaUInt32 {
    return new JuliaUInt32(jlbun.symbols.jl_box_uint32(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_uint32(this.ptr);
  }
  toString(): string {
    return this.value.toString();
  }
}

export class JuliaInt64 implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: number | bigint): JuliaInt64 {
    return new JuliaInt64(jlbun.symbols.jl_box_int64(value));
  }

  get value(): bigint {
    return jlbun.symbols.jl_unbox_int64(this.ptr);
  }
  toString(): string {
    return this.value.toString();
  }
}

export class JuliaUInt64 implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: number | bigint): JuliaUInt64 {
    return new JuliaUInt64(jlbun.symbols.jl_box_uint64(value));
  }

  get value(): bigint {
    return jlbun.symbols.jl_unbox_uint64(this.ptr);
  }
}

export class JuliaFloat32 implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: number): JuliaFloat32 {
    return new JuliaFloat32(jlbun.symbols.jl_box_float32(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_float32(this.ptr);
  }

  toString(): string {
    return this.value.toString();
  }
}

export class JuliaFloat64 implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: number): JuliaFloat64 {
    return new JuliaFloat64(jlbun.symbols.jl_box_float64(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_float64(this.ptr);
  }

  toString(): string {
    return this.value.toString();
  }
}

export class JuliaBool implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: boolean): JuliaBool {
    return new JuliaBool(jlbun.symbols.jl_box_bool(value));
  }

  get value(): boolean {
    return jlbun.symbols.jl_unbox_bool(this.ptr) === 1;
  }

  toString(): string {
    return this.value.toString();
  }
}

export class JuliaString implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(value: string): JuliaString {
    return new JuliaString(jlbun.symbols.jl_cstr_to_string(safeCString(value)));
  }

  get value(): string {
    return new CString(jlbun.symbols.jl_string_ptr(this.ptr)).toString();
  }

  toString(): string {
    return this.value;
  }
}

export class JuliaAny implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  get value(): string {
    return Julia.Base.string(this).value;
  }

  toString(): string {
    return this.value;
  }
}

export class JuliaSymbol implements IJuliaValue {
  ptr: number;
  name: string;

  constructor(ptr: number, name: string) {
    this.ptr = ptr;
    this.name = name;
  }

  static from(value: string): JuliaSymbol {
    return new JuliaSymbol(jlbun.symbols.jl_symbol(safeCString(value)), value);
  }

  get value(): string {
    return this.toString();
  }

  toString(): string {
    return `[Symbol] ${this.name}`;
  }
}

export class JuliaNothing implements IJuliaValue {
  static instance: JuliaNothing;
  ptr: number;

  private constructor(ptr: number) {
    this.ptr = ptr;
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

  toString(): string {
    return "null";
  }
}
