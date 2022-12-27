import { ptr } from "bun:ffi";
import { jlbun } from "./wrapper.js";
import { Julia, JuliaDataType, WrappedPointer } from "./types.js";
import { MethodError } from "./errors.js";

type BunArray = TypedArray | BigInt64Array | BigUint64Array;

interface FromBunArrayOptions {
  juliaGC: boolean;
}

const DEFAULT_FROM_BUN_ARRAY_OPTIONS: FromBunArrayOptions = {
  juliaGC: false,
};

export class JuliaArray implements WrappedPointer {
  type: JuliaDataType;
  ptr: number;

  constructor(type: JuliaDataType, ptr: number) {
    this.type = type;
    this.ptr = ptr;
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
    extraOptions: Partial<FromBunArrayOptions> = {},
  ): JuliaArray {
    const options = { ...DEFAULT_FROM_BUN_ARRAY_OPTIONS, ...extraOptions };
    const rawPtr = ptr(arr.buffer);
    const juliaGC = options.juliaGC ? 1 : 0;
    if (arr instanceof Int8Array) {
      const arrType = jlbun.symbols.jl_apply_array_type(Julia.Int8.ptr, 1);
      const ptr = jlbun.symbols.jl_ptr_to_array_1d(
        arrType,
        rawPtr,
        arr.length,
        juliaGC,
      );
      return new JuliaArray(Julia.Int8, ptr);
    } else if (arr instanceof Uint8Array || arr instanceof Uint8ClampedArray) {
      const arrType = jlbun.symbols.jl_apply_array_type(Julia.UInt8.ptr, 1);
      const ptr = jlbun.symbols.jl_ptr_to_array_1d(
        arrType,
        rawPtr,
        arr.length,
        juliaGC,
      );
      return new JuliaArray(Julia.UInt8, ptr);
    } else if (arr instanceof Int16Array) {
      const arrType = jlbun.symbols.jl_apply_array_type(Julia.Int16.ptr, 1);
      const ptr = jlbun.symbols.jl_ptr_to_array_1d(
        arrType,
        rawPtr,
        arr.length,
        juliaGC,
      );
      return new JuliaArray(Julia.Int16, ptr);
    } else if (arr instanceof Uint16Array) {
      const arrType = jlbun.symbols.jl_apply_array_type(Julia.UInt16.ptr, 1);
      const ptr = jlbun.symbols.jl_ptr_to_array_1d(
        arrType,
        rawPtr,
        arr.length,
        juliaGC,
      );
      return new JuliaArray(Julia.UInt16, ptr);
    } else if (arr instanceof Int32Array) {
      const arrType = jlbun.symbols.jl_apply_array_type(Julia.Int32.ptr, 1);
      const ptr = jlbun.symbols.jl_ptr_to_array_1d(
        arrType,
        rawPtr,
        arr.length,
        juliaGC,
      );
      return new JuliaArray(Julia.Int32, ptr);
    } else if (arr instanceof Uint32Array) {
      const arrType = jlbun.symbols.jl_apply_array_type(Julia.UInt32.ptr, 1);
      const ptr = jlbun.symbols.jl_ptr_to_array_1d(
        arrType,
        rawPtr,
        arr.length,
        juliaGC,
      );
      return new JuliaArray(Julia.UInt32, ptr);
    } else if (arr instanceof Float32Array) {
      const arrType = jlbun.symbols.jl_apply_array_type(Julia.Float32.ptr, 1);
      const ptr = jlbun.symbols.jl_ptr_to_array_1d(
        arrType,
        rawPtr,
        arr.length,
        juliaGC,
      );
      return new JuliaArray(Julia.Float32, ptr);
    } else if (arr instanceof Float64Array) {
      const arrType = jlbun.symbols.jl_apply_array_type(Julia.Float64.ptr, 1);
      const ptr = jlbun.symbols.jl_ptr_to_array_1d(
        arrType,
        rawPtr,
        arr.length,
        juliaGC,
      );
      return new JuliaArray(Julia.Float64, ptr);
    } else if (arr instanceof BigInt64Array) {
      const arrType = jlbun.symbols.jl_apply_array_type(Julia.Int64.ptr, 1);
      const ptr = jlbun.symbols.jl_ptr_to_array_1d(
        arrType,
        rawPtr,
        arr.length,
        juliaGC,
      );
      return new JuliaArray(Julia.Int64, ptr);
    } else if (arr instanceof BigUint64Array) {
      const arrType = jlbun.symbols.jl_apply_array_type(Julia.UInt64.ptr, 1);
      const ptr = jlbun.symbols.jl_ptr_to_array_1d(
        arrType,
        rawPtr,
        arr.length,
        juliaGC,
      );
      return new JuliaArray(Julia.UInt64, ptr);
    } else {
      throw new MethodError("Unsupported TypedArray type.");
    }
  }

  get length(): number {
    return Number(jlbun.symbols.jl_array_len_getter(this.ptr));
  }

  get ndims(): number {
    return Number(jlbun.symbols.jl_array_ndims_getter(this.ptr));
  }

  push(value: WrappedPointer): void {
    if (this.ndims === 1) {
      jlbun.symbols.jl_array_ptr_1d_push(this.ptr, value.ptr);
    } else {
      throw new MethodError(
        "`push` is not implemented for arrays with two or more dimensions.",
      );
    }
  }
}
