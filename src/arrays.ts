import { ptr } from "bun:ffi";
import { jlbun } from "./wrapper.js";
import { Julia } from "./julia.js";
import { JuliaDataType, JuliaFunction } from "./types.js";
import { JuliaValue } from "./values.js";
import { MethodError } from "./errors.js";

type BunArray = TypedArray | BigInt64Array | BigUint64Array;

interface FromBunArrayOptions {
  juliaGC: boolean;
}

const DEFAULT_FROM_BUN_ARRAY_OPTIONS: FromBunArrayOptions = {
  juliaGC: false,
};

export class JuliaArray extends JuliaValue {
  type: JuliaDataType;

  constructor(type: JuliaDataType, ptr: number) {
    super(ptr);
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
    extraOptions: Partial<FromBunArrayOptions> = {},
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

  get value(): string {
    return Julia.Base.string(this).value;
  }

  push(value: JuliaValue): void {
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
    // TODO: get actual function return type
    return new JuliaArray(this.type, Julia.Base.map(f, this));
  }
}
