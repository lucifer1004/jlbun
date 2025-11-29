import { Pointer, ptr, toArrayBuffer } from "bun:ffi";

/**
 * A typed JS Array.
 */
type BunArray =
  | Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array
  | Uint8ClampedArray
  | BigInt64Array
  | BigUint64Array;
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

interface FromBunArrayOptions {
  juliaGC: boolean;
}

const DEFAULT_FROM_BUN_ARRAY_OPTIONS: FromBunArrayOptions = {
  juliaGC: false,
};

/**
 * Wrapper for Julia `Array`.
 *
 * ## Column-Major Order
 *
 * Julia uses **column-major order** (like Fortran), meaning elements are stored
 * column-by-column in memory. This is different from C/JavaScript which use
 * row-major order.
 *
 * For a 2D array (matrix), elements are stored as:
 * ```
 * [a[0,0], a[1,0], a[2,0], ..., a[0,1], a[1,1], a[2,1], ...]
 * ```
 *
 * Example: For a 2x3 matrix:
 * ```
 * Julia:  [ 1  3  5 ]    Memory layout: [1, 2, 3, 4, 5, 6]
 *         [ 2  4  6 ]
 *
 * C/JS:   [ 1  2  3 ]    Memory layout: [1, 2, 3, 4, 5, 6]
 *         [ 4  5  6 ]
 * ```
 *
 * When using `get(linearIndex)` or `set(linearIndex, value)`, the linear index
 * follows column-major order. For multi-dimensional access, use `getAt(...indices)`
 * and `setAt(...indices, value)` which handle the index conversion automatically.
 *
 * @example
 * ```typescript
 * const matrix = JuliaArray.init(Julia.Float64, 3, 4); // 3 rows, 4 columns
 *
 * // Linear indexing (column-major)
 * matrix.set(0, 1.0);  // Sets element at row 0, col 0
 * matrix.set(1, 2.0);  // Sets element at row 1, col 0
 * matrix.set(3, 4.0);  // Sets element at row 0, col 1
 *
 * // Multi-dimensional indexing (more intuitive)
 * matrix.setAt(0, 0, 1.0);  // row 0, col 0
 * matrix.setAt(1, 0, 2.0);  // row 1, col 0
 * matrix.setAt(0, 1, 4.0);  // row 0, col 1
 *
 * // Get element at row 2, col 3
 * const val = matrix.getAt(2, 3);
 * ```
 */
export class JuliaArray implements JuliaValue {
  ptr: Pointer;
  elType: JuliaDataType;

  constructor(ptr: Pointer, elType: JuliaDataType) {
    this.ptr = ptr;
    this.elType = elType;
  }

  /**
   * Create a `JuliaArray` with given element type and dimensions.
   *
   * @param elType Element type of the array.
   * @param dims Dimensions of the array. For 1D array, pass a single number.
   *             For multi-dimensional arrays, pass multiple numbers.
   *
   * @example
   * ```typescript
   * // 1D array with 100 elements
   * const arr1d = JuliaArray.init(Julia.Float64, 100);
   *
   * // 2D array (10x20 matrix)
   * const arr2d = JuliaArray.init(Julia.Float64, 10, 20);
   *
   * // 3D array (10x20x30)
   * const arr3d = JuliaArray.init(Julia.Float64, 10, 20, 30);
   *
   * // N-dimensional array
   * const arrNd = JuliaArray.init(Julia.Float64, 2, 3, 4, 5);
   * ```
   */
  static init(elType: JuliaDataType, ...dims: number[]): JuliaArray {
    if (dims.length === 0) {
      throw new MethodError("At least one dimension must be provided");
    }

    const ndims = dims.length;
    const arrType = jlbun.symbols.jl_apply_array_type(elType.ptr, ndims)!;

    let arrPtr: Pointer | null;

    if (ndims === 1) {
      arrPtr = jlbun.symbols.jl_alloc_array_1d(arrType, dims[0]);
    } else if (ndims === 2) {
      arrPtr = jlbun.symbols.jl_alloc_array_2d(arrType, dims[0], dims[1]);
    } else if (ndims === 3) {
      arrPtr = jlbun.symbols.jl_alloc_array_3d(
        arrType,
        dims[0],
        dims[1],
        dims[2],
      );
    } else {
      // For 4+ dimensions, use jl_alloc_array_nd_wrapper (compatibility for Julia < 1.11)
      const dimsArray = new BigUint64Array(dims.map(BigInt));
      arrPtr = jlbun.symbols.jl_alloc_array_nd_wrapper(
        arrType,
        ptr(dimsArray.buffer),
        ndims,
      );
    }

    if (arrPtr === null) {
      throw new Error(`Failed to allocate Julia array with dims: ${dims}`);
    }

    return new JuliaArray(arrPtr, elType);
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
    // Use jl_array_length which computes product of dimensions
    // This handles reshaped arrays correctly (unlike jl_array_len which
    // returns underlying storage size that may be larger after push/resize)
    return Number(jlbun.symbols.jl_array_length(this.ptr));
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
    const dataPtr = jlbun.symbols.jl_array_data_getter(this.ptr);
    if (dataPtr === null) {
      throw new Error("Failed to get array data pointer from Julia array");
    }
    return dataPtr;
  }

  /**
   * Convert multi-dimensional indices to linear index (column-major order).
   *
   * @param indices Array indices (0-based) for each dimension.
   * @returns Linear index in column-major order.
   */
  private indicesToLinear(...indices: number[]): number {
    const dims = this.size;
    if (indices.length !== dims.length) {
      throw new RangeError(
        `Expected ${dims.length} indices, got ${indices.length}`,
      );
    }

    let linearIndex = 0;
    let stride = 1;
    for (let i = 0; i < dims.length; i++) {
      if (indices[i] < 0 || indices[i] >= dims[i]) {
        throw new RangeError(
          `Index ${indices[i]} out of bounds for dimension ${i} (size ${dims[i]})`,
        );
      }
      linearIndex += indices[i] * stride;
      stride *= dims[i];
    }
    return linearIndex;
  }

  /**
   * Get data at the given linear index (column-major order).
   *
   * For multi-dimensional arrays, consider using `getAt(...indices)` for
   * more intuitive access.
   *
   * @param index The linear index (starting from 0) to be fetched.
   * @returns Julia data at the given index, wrapped in a `JuliaValue` object.
   */
  get(index: number): JuliaValue {
    if (index < 0 || index >= this.length) {
      throw new RangeError(`Index out of bounds: ${index}`);
    }

    const elementPtr = jlbun.symbols.jl_array_ptr_ref_wrapper(this.ptr, index);
    if (elementPtr === null) {
      throw new Error(`Failed to get element ${index} from Julia array`);
    }
    return Julia.wrapPtr(elementPtr);
  }

  /**
   * Get data at the given multi-dimensional indices.
   *
   * Indices are 0-based and follow Julia's column-major convention.
   * For a 2D matrix, use `getAt(row, col)`.
   *
   * @param indices The indices for each dimension (all 0-based).
   * @returns Julia data at the given position, wrapped in a `JuliaValue` object.
   *
   * @example
   * ```typescript
   * const matrix = JuliaArray.init(Julia.Float64, 3, 4); // 3 rows, 4 cols
   * const val = matrix.getAt(2, 3);  // Get element at row 2, col 3
   *
   * const tensor = JuliaArray.init(Julia.Float64, 2, 3, 4);
   * const val3d = tensor.getAt(1, 2, 3);  // 3D indexing
   * ```
   */
  getAt(...indices: number[]): JuliaValue {
    const linearIndex = this.indicesToLinear(...indices);
    return this.get(linearIndex);
  }

  /**
   * Set data at the given linear index (column-major order).
   *
   * For multi-dimensional arrays, consider using `setAt(...indices, value)` for
   * more intuitive access.
   *
   * @param index The linear index (starting from 0).
   * @param value Data to be set at the given index.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(index: number, value: any): void {
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

    jlbun.symbols.jl_array_ptr_set_wrapper(this.ptr, index, ptr);
  }

  /**
   * Set data at the given multi-dimensional indices.
   *
   * Indices are 0-based and follow Julia's column-major convention.
   * For a 2D matrix, use `setAt(row, col, value)`.
   *
   * @param args The indices for each dimension followed by the value to set.
   *             For an N-dimensional array, pass N indices then the value.
   *
   * @example
   * ```typescript
   * const matrix = JuliaArray.init(Julia.Float64, 3, 4); // 3 rows, 4 cols
   * matrix.setAt(2, 3, 42.0);  // Set element at row 2, col 3 to 42.0
   *
   * const tensor = JuliaArray.init(Julia.Float64, 2, 3, 4);
   * tensor.setAt(1, 2, 3, 99.0);  // 3D indexing
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAt(...args: any[]): void {
    if (args.length < 2) {
      throw new MethodError("setAt requires at least one index and a value");
    }
    const value = args[args.length - 1];
    const indices = args.slice(0, -1) as number[];
    const linearIndex = this.indicesToLinear(...indices);
    this.set(linearIndex, value);
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
