import { ptr, toArrayBuffer } from "bun:ffi";
import {
  jlbun,
  Julia,
  JuliaBool,
  JuliaDataType,
  JuliaFloat32,
  JuliaFloat64,
  JuliaFunction,
  JuliaInt8,
  JuliaInt16,
  JuliaInt32,
  JuliaInt64,
  JuliaString,
  JuliaSymbol,
  JuliaUInt8,
  JuliaUInt16,
  JuliaUInt32,
  JuliaUInt64,
  JuliaValue,
  MethodError,
} from "./index.js";

type BunArray = TypedArray | BigInt64Array | BigUint64Array;

interface FromBunArrayOptions {
  juliaGC: boolean;
}

const DEFAULT_FROM_BUN_ARRAY_OPTIONS: FromBunArrayOptions = {
  juliaGC: false,
};

export class JuliaArray implements JuliaValue {
  ptr: number;
  elType: JuliaDataType;

  constructor(ptr: number, elType: JuliaDataType) {
    this.ptr = ptr;
    this.elType = elType;
  }

  static init(elType: JuliaDataType, length: number): JuliaArray {
    const arrType = jlbun.symbols.jl_apply_array_type(elType.ptr, 1);
    return new JuliaArray(
      jlbun.symbols.jl_alloc_array_1d(arrType, length),
      elType,
    );
  }

  static from(
    arr: BunArray,
    extraOptions: Partial<FromBunArrayOptions> = {},
  ): JuliaArray {
    const options = { ...DEFAULT_FROM_BUN_ARRAY_OPTIONS, ...extraOptions };
    const rawPtr = ptr(arr.buffer);
    const juliaGC = options.juliaGC ? 1 : 0;
    let elType: JuliaDataType;
    if (arr instanceof Int8Array) {
      elType = Julia.Int8;
    } else if (arr instanceof Uint8Array || arr instanceof Uint8ClampedArray) {
      elType = Julia.UInt8;
    } else if (arr instanceof Int16Array) {
      elType = Julia.Int16;
    } else if (arr instanceof Uint16Array) {
      elType = Julia.UInt16;
    } else if (arr instanceof Int32Array) {
      elType = Julia.Int32;
    } else if (arr instanceof Uint32Array) {
      elType = Julia.UInt32;
    } else if (arr instanceof Float32Array) {
      elType = Julia.Float32;
    } else if (arr instanceof Float64Array) {
      elType = Julia.Float64;
    } else if (arr instanceof BigInt64Array) {
      elType = Julia.Int64;
    } else if (arr instanceof BigUint64Array) {
      elType = Julia.UInt64;
    } else {
      throw new MethodError("Unsupported TypedArray type.");
    }

    const arrType = jlbun.symbols.jl_apply_array_type(elType.ptr, 1);
    return new JuliaArray(
      jlbun.symbols.jl_ptr_to_array_1d(arrType, rawPtr, arr.length, juliaGC),
      elType,
    );
  }

  get length(): number {
    return Number(jlbun.symbols.jl_array_len_getter(this.ptr));
  }

  get size(): number[] {
    const size = new Array<number>(this.ndims);
    for (let i = 0; i < this.ndims; i++) {
      size[i] = Number(jlbun.symbols.jl_array_dim_getter(this.ptr, i));
    }
    return size;
  }

  get ndims(): number {
    return Number(jlbun.symbols.jl_array_ndims_getter(this.ptr));
  }

  get(index: number): JuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_arrayref(this.ptr, index));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(index: number, value: any): void {
    let ptr: number;

    if (
      (typeof value === "object" || typeof value === "function") &&
      "ptr" in value
    ) {
      ptr = value.ptr;
    } else if (this.elType.isEqual(Julia.Int8)) {
      ptr = JuliaInt8.from(value).ptr;
    } else if (this.elType.isEqual(Julia.UInt8)) {
      ptr = JuliaUInt8.from(value).ptr;
    } else if (this.elType.isEqual(Julia.Int16)) {
      ptr = JuliaInt16.from(value).ptr;
    } else if (this.elType.isEqual(Julia.UInt16)) {
      ptr = JuliaUInt16.from(value).ptr;
    } else if (this.elType.isEqual(Julia.Int32)) {
      ptr = JuliaInt32.from(value).ptr;
    } else if (this.elType.isEqual(Julia.UInt32)) {
      ptr = JuliaUInt32.from(value).ptr;
    } else if (this.elType.isEqual(Julia.Int64)) {
      ptr = JuliaInt64.from(value).ptr;
    } else if (this.elType.isEqual(Julia.UInt64)) {
      ptr = JuliaUInt64.from(value).ptr;
    } else if (this.elType.isEqual(Julia.Float32)) {
      ptr = JuliaFloat32.from(value).ptr;
    } else if (this.elType.isEqual(Julia.Float64)) {
      ptr = JuliaFloat64.from(value).ptr;
    } else if (this.elType.isEqual(Julia.String)) {
      ptr = JuliaString.from(value).ptr;
    } else if (this.elType.isEqual(Julia.Bool)) {
      ptr = JuliaBool.from(value).ptr;
    } else if (this.elType.isEqual(Julia.Symbol)) {
      ptr = JuliaSymbol.from(value).ptr;
    } else {
      throw new MethodError("Cannot convert to the array's element type.");
    }

    jlbun.symbols.jl_arrayset(this.ptr, ptr, index);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): BunArray | any[] {
    const rawPtr = jlbun.symbols.jl_array_data_getter(this.ptr);

    if (this.elType.isEqual(Julia.Int8)) {
      return new Int8Array(toArrayBuffer(rawPtr, 0, this.length));
    } else if (this.elType.isEqual(Julia.UInt8)) {
      return new Uint8Array(toArrayBuffer(rawPtr, 0, this.length));
    } else if (this.elType.isEqual(Julia.Int16)) {
      return new Int16Array(toArrayBuffer(rawPtr, 0, 2 * this.length));
    } else if (this.elType.isEqual(Julia.UInt16)) {
      return new Uint16Array(toArrayBuffer(rawPtr, 0, 2 * this.length));
    } else if (this.elType.isEqual(Julia.Int32)) {
      return new Int32Array(toArrayBuffer(rawPtr, 0, 4 * this.length));
    } else if (this.elType.isEqual(Julia.UInt32)) {
      return new Uint32Array(toArrayBuffer(rawPtr, 0, 4 * this.length));
    } else if (this.elType.isEqual(Julia.Float32)) {
      return new Float32Array(toArrayBuffer(rawPtr, 0, 4 * this.length));
    } else if (this.elType.isEqual(Julia.Float64)) {
      return new Float64Array(toArrayBuffer(rawPtr, 0, 8 * this.length));
    } else if (this.elType.isEqual(Julia.Int64)) {
      return new BigInt64Array(toArrayBuffer(rawPtr, 0, 8 * this.length));
    } else if (this.elType.isEqual(Julia.UInt64)) {
      return new BigUint64Array(toArrayBuffer(rawPtr, 0, 8 * this.length));
    } else {
      return Array.from({ length: this.length }, (_, i) => this.get(i).value);
    }
  }

  toString(): string {
    return `[JuliaArray ${Julia.string(this)}]`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  push(...values: any[]): void {
    if (this.ndims === 1) {
      const wrappedValues = values.map((value) => Julia.autoWrap(value));
      for (const value of wrappedValues) {
        jlbun.symbols.jl_array_ptr_1d_push(this.ptr, value.ptr);
      }
    } else {
      throw new MethodError(
        "`push` is not implemented for arrays with two or more dimensions.",
      );
    }
  }

  pop(): JuliaValue {
    return Julia.Base["pop!"](this);
  }

  reverse(): void {
    Julia.Base["reverse!"](this);
  }

  reshape(...shape: number[]): JuliaArray {
    const arr = Julia.Base.reshape(this, ...shape);
    return new JuliaArray(arr.ptr, this.elType);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fill(value: any): void {
    Julia.Base["fill!"](this, value);
  }

  map(f: JuliaFunction): JuliaArray {
    const arr = Julia.Base.map(f, this);
    const elType = jlbun.symbols.jl_array_eltype(arr.ptr);
    const typeStr = Julia.getTypeStr(elType);
    return new JuliaArray(arr.ptr, new JuliaDataType(elType, typeStr));
  }
}
