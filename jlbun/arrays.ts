import { Pointer, ptr, toArrayBuffer } from "bun:ffi";

/**
 * A typed JS Array.
 */
type BunArray = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | Uint8ClampedArray | BigInt64Array | BigUint64Array;
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
  JuliaNothing,
  JuliaString,
  JuliaSymbol,
  JuliaUInt8,
  JuliaUInt16,
  JuliaUInt32,
  JuliaUInt64,
  JuliaValue,
  MethodError,
} from "./index.js";


interface FromBunArrayOptions {
  juliaGC: boolean;
}

const DEFAULT_FROM_BUN_ARRAY_OPTIONS: FromBunArrayOptions = {
  juliaGC: false,
};

/**
 * Wrapper for Julia `Array`.
 */
export class JuliaArray implements JuliaValue {
  ptr: Pointer;
  elType: JuliaDataType;

  constructor(ptr: Pointer, elType: JuliaDataType) {
    this.ptr = ptr;
    this.elType = elType;
  }

  /**
   * Create a `JuliaArray` with given element type and length.
   *
   * @param elType Element type of the array.
   * @param length Length of the array.
   */
  static init(elType: JuliaDataType, length: number): JuliaArray {
    const arrType = jlbun.symbols.jl_apply_array_type(elType.ptr, 1)!;
    return new JuliaArray(
      jlbun.symbols.jl_alloc_array_1d(arrType, length)!,
      elType,
    );
  }

  /**
   * Create a `JuliaArray` from a `BunArray` (`TypedArray | BigInt64Array | BigUint64Array`).
   *
   * @param arr
   * @param extraOptions
   */
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

    const arrType = jlbun.symbols.jl_apply_array_type(elType.ptr, 1)!;
    return new JuliaArray(
      jlbun.symbols.jl_ptr_to_array_1d(arrType, rawPtr, arr.length, juliaGC)!,
      elType,
    );
  }

  /**
   * Create a `JuliaArray` from a JS `Array` with arbitrary types.
   *
   * @param values
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromAny(values: any[]): JuliaArray {
    const arr = JuliaArray.init(Julia.Any, 0);
    for (const v of values) {
      arr.push(Julia.autoWrap(v));
    }
    return arr;
  }

  /**
   * Length of the array.
   */
  get length(): number {
    // Use Julia's length function since jl_array_len_getter seems to be returning the length of the underlying container.
    return Number(Julia.Base.length(this).value);
  }

  /**
   * Size (equivalent to `shape` in `numpy`'s terms) of the array.
   */
  get size(): number[] {
    const size = new Array<number>(this.ndims);
    for (let i = 0; i < this.ndims; i++) {
      size[i] = Number(jlbun.symbols.jl_array_dim_getter(this.ptr, i));
    }
    return size;
  }

  /**
   * Number of dimensions of the array.
   */
  get ndims(): number {
    return Number(jlbun.symbols.jl_array_ndims_getter(this.ptr));
  }

  /**
   * Get the raw pointer of the array.
   */
  get rawPtr(): Pointer {
    return jlbun.symbols.jl_array_data_getter(this.ptr)!;
  }

  /**
   * Get data at the given index.
   *
   * @param index The index (starting from 0) to be fetched.
   * @returns Julia data at the given index, wrapped in a `JuliaValue` object.
   */
  get(index: number): JuliaValue {
    if (jlbun.symbols.jl_array_isboxed(this.ptr)) {
      // For boxed arrays, use direct C API
      return Julia.wrapPtr(jlbun.symbols.jl_array_ptr_ref_wrapper(this.ptr, index)!);
    } else {
      // For unboxed arrays, we need to use Julia's getindex function
      // But Julia might not be fully initialized yet, so we need to check
      if (!Julia.Base) {
        throw new Error("Cannot access unboxed array elements before Julia is fully initialized. Call Julia.init() first.");
      }
      return Julia.Base.getindex(this, index + 1); // Julia uses 1-based indexing
    }
  }

  /**
   *
   * @param index
   * @param value Data to be set at the given index.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(index: number, value: any): void {
    if (jlbun.symbols.jl_array_isboxed(this.ptr)) {
      // For boxed arrays, convert value and use direct C API
      let ptr: Pointer;

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

      jlbun.symbols.jl_array_ptr_set_wrapper(this.ptr, ptr, index);
    } else {
      // For unboxed arrays, use Julia's setindex! function
      if (!Julia.Base) {
        throw new Error("Cannot set unboxed array elements before Julia is fully initialized. Call Julia.init() first.");
      }
      Julia.Base["setindex!"](this, value, index + 1); // Julia uses 1-based indexing
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): BunArray | any[] {
    const rawPtr = this.rawPtr;

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
  push(...values: any[]): number {
    if (this.ndims === 1) {
      Julia.Base["push!"](this, ...values);
      return values.length;
    } else {
      throw new MethodError(
        "`push` is not implemented for arrays with two or more dimensions.",
      );
    }
  }

  /**
   * Pop the last element of the array and return it.
   */
  pop(): JuliaValue | undefined {
    if (this.ndims === 1) {
      if (this.length === 0) {
        return undefined;
      }
      return Julia.Base["pop!"](this);
    } else {
      throw new MethodError(
        "`pop` is not implemented for arrays with two or more dimensions.",
      );
    }
  }

  /**
   * Reverse the array in place.
   */
  reverse(): void {
    Julia.Base["reverse!"](this);
  }

  /**
   * Reshape the array with the given shape and get a new array.
   *
   * Note that the new array shares the underlying memory with the original array.
   * So if you have reshaped an array, you cannot perform `pop()` or `push()` operations
   * on it since this will affect the arrays that share data with the current array.
   */
  reshape(...shape: number[]): JuliaArray {
    const arr = Julia.Base.reshape(this, ...shape);
    return new JuliaArray(arr.ptr, this.elType);
  }

  /**
   * Fill the array with the given value.
   *
   * @param value Value to be filled.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fill(value: any): void {
    Julia.Base["fill!"](this, value);
  }

  /**
   * Map the given function to the array and get a new array.
   *
   * @param f Function to be mapped.
   */
  map(f: JuliaFunction): JuliaArray {
    const arr = Julia.Base.map(f, this);
    const elType = jlbun.symbols.jl_array_eltype(arr.ptr)!;
    const typeStr = Julia.getTypeStr(elType);
    return new JuliaArray(arr.ptr, new JuliaDataType(elType, typeStr));
  }
}
