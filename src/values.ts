import { CString } from "bun:ffi";
import { safeCString } from "./utils.js";
import { jlbun } from "./wrapper.js";
import { Julia } from "./julia.js";
import { WrappedPointer } from "./types.js";

export abstract class JuliaValue implements WrappedPointer {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  abstract get value(): any;

  toString(): string {
    return this.value.toString();
  }
}

export class JuliaInt8 extends JuliaValue {
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

export class JuliaUInt8 extends JuliaValue {
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

export class JuliaInt16 extends JuliaValue {
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

export class JuliaUInt16 extends JuliaValue {
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

export class JuliaInt32 extends JuliaValue {
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

export class JuliaUInt32 extends JuliaValue {
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

export class JuliaInt64 extends JuliaValue {
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

export class JuliaUInt64 extends JuliaValue {
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

export class JuliaFloat32 extends JuliaValue {
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

export class JuliaFloat64 extends JuliaValue {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: number): JuliaFloat64 {
    return new JuliaFloat64(jlbun.symbols.jl_box_float64(value));
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_float64(this.ptr);
  }
}

export class JuliaBool extends JuliaValue {
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

export class JuliaString extends JuliaValue {
  constructor(ptr: number) {
    super(ptr);
  }

  static from(value: string): JuliaString {
    return new JuliaString(jlbun.symbols.jl_cstr_to_string(safeCString(value)));
  }

  get value(): string {
    return new CString(jlbun.symbols.jl_string_ptr(this.ptr)).toString();
  }
}

export class JuliaAny extends JuliaValue {
  constructor(ptr: number) {
    super(ptr);
  }

  get value(): string {
    return Julia.Base.string(this).value;
  }
}
