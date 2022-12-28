import { ptr, toArrayBuffer } from "bun:ffi";
import {
  jlbun,
  IJuliaValue,
  Julia,
  JuliaDataType,
  JuliaFunction,
  MethodError,
} from "./index.js";

type BunArray = TypedArray | BigInt64Array | BigUint64Array;

interface IFromBunArrayOptions {
  juliaGC: boolean;
}

const DEFAULT_FROM_BUN_ARRAY_OPTIONS: IFromBunArrayOptions = {
  juliaGC: false,
};

export class JuliaArray implements IJuliaValue {
  ptr: number;
  type: JuliaDataType;

  constructor(type: JuliaDataType, ptr: number) {
    this.ptr = ptr;
    this.type = type;
  }

  static init(type: JuliaDataType, length: number): JuliaArray {
    const arrType = jlbun.symbols.jl_apply_array_type(type.ptr, 1);
    return new JuliaArray(
      type,
      jlbun.symbols.jl_alloc_array_1d(arrType, length),
    );
  }

  static from(
    arr: BunArray,
    extraOptions: Partial<IFromBunArrayOptions> = {},
  ): JuliaArray {
    const options = { ...DEFAULT_FROM_BUN_ARRAY_OPTIONS, ...extraOptions };
    const rawPtr = ptr(arr.buffer);
    const juliaGC = options.juliaGC ? 1 : 0;
    let elementType: JuliaDataType;
    if (arr instanceof Int8Array) {
      elementType = Julia.Int8;
    } else if (arr instanceof Uint8Array || arr instanceof Uint8ClampedArray) {
      elementType = Julia.UInt8;
    } else if (arr instanceof Int16Array) {
      elementType = Julia.Int16;
    } else if (arr instanceof Uint16Array) {
      elementType = Julia.UInt16;
    } else if (arr instanceof Int32Array) {
      elementType = Julia.Int32;
    } else if (arr instanceof Uint32Array) {
      elementType = Julia.UInt32;
    } else if (arr instanceof Float32Array) {
      elementType = Julia.Float32;
    } else if (arr instanceof Float64Array) {
      elementType = Julia.Float64;
    } else if (arr instanceof BigInt64Array) {
      elementType = Julia.Int64;
    } else if (arr instanceof BigUint64Array) {
      elementType = Julia.UInt64;
    } else {
      throw new MethodError("Unsupported TypedArray type.");
    }

    const arrType = jlbun.symbols.jl_apply_array_type(elementType.ptr, 1);
    return new JuliaArray(
      elementType,
      jlbun.symbols.jl_ptr_to_array_1d(arrType, rawPtr, arr.length, juliaGC),
    );
  }

  get length(): number {
    return Number(jlbun.symbols.jl_array_len_getter(this.ptr));
  }

  get ndims(): number {
    return Number(jlbun.symbols.jl_array_ndims_getter(this.ptr));
  }

  get(index: number): IJuliaValue {
    return Julia.wrap(jlbun.symbols.jl_arrayref(this.ptr, index));
  }

  get value(): BunArray | Array<string> | string {
    const eltype = jlbun.symbols.jl_array_eltype(this.ptr);
    const rawPtr = jlbun.symbols.jl_array_data_getter(this.ptr);

    if (eltype === Julia.Int8.ptr) {
      return new Int8Array(toArrayBuffer(rawPtr, 0, this.length));
    } else if (eltype === Julia.UInt8.ptr) {
      return new Uint8Array(toArrayBuffer(rawPtr, 0, this.length));
    } else if (eltype === Julia.Int16.ptr) {
      return new Int16Array(toArrayBuffer(rawPtr, 0, 2 * this.length));
    } else if (eltype === Julia.UInt16.ptr) {
      return new Uint16Array(toArrayBuffer(rawPtr, 0, 2 * this.length));
    } else if (eltype === Julia.Int32.ptr) {
      return new Int32Array(toArrayBuffer(rawPtr, 0, 4 * this.length));
    } else if (eltype === Julia.UInt32.ptr) {
      return new Uint32Array(toArrayBuffer(rawPtr, 0, 4 * this.length));
    } else if (eltype === Julia.Float32.ptr) {
      return new Float32Array(toArrayBuffer(rawPtr, 0, 4 * this.length));
    } else if (eltype === Julia.Float64.ptr) {
      return new Float64Array(toArrayBuffer(rawPtr, 0, 8 * this.length));
    } else if (eltype === Julia.Int64.ptr) {
      return new BigInt64Array(toArrayBuffer(rawPtr, 0, 8 * this.length));
    } else if (eltype === Julia.UInt64.ptr) {
      return new BigUint64Array(toArrayBuffer(rawPtr, 0, 8 * this.length));
    } else if (eltype === Julia.String.ptr) {
      const arr = new Array<string>(this.length);
      for (let i = 0; i < this.length; i++) {
        arr[i] = this.get(i).toString();
      }
      return arr;
    }

    return Julia.Base.string(this).value;
  }

  toString(): string {
    return this.value.toString();
  }

  push(value: IJuliaValue): void {
    if (this.ndims === 1) {
      jlbun.symbols.jl_array_ptr_1d_push(this.ptr, value.ptr);
    } else {
      throw new MethodError(
        "`push` is not implemented for arrays with two or more dimensions.",
      );
    }
  }

  reverse(): void {
    Julia.Base["reverse!"](this);
  }

  fill(value: any): void {
    Julia.Base["fill!"](this, value);
  }

  map(f: JuliaFunction): JuliaArray {
    const arr = Julia.Base.map(f, this);
    const eltype = jlbun.symbols.jl_array_eltype(arr.ptr);
    const ndims = Number(jlbun.symbols.jl_array_ndims_getter(arr.ptr));
    const arrType = jlbun.symbols.jl_apply_array_type(eltype, ndims);
    return new JuliaArray(new JuliaDataType(arrType, "Array"), arr.ptr);
  }
}
