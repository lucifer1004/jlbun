import { Pointer, toArrayBuffer } from "bun:ffi";
import {
  BunArray,
  jlbun,
  Julia,
  JuliaArray,
  JuliaDataType,
  JuliaValue,
} from "./index.js";

/**
 * Wrapper for Julia `SubArray` - a view into an existing array.
 *
 * SubArray provides zero-copy access to a portion of an array.
 * Changes to a SubArray are reflected in the parent array and vice versa.
 *
 * ## Key Characteristics
 *
 * - **Zero-copy**: SubArray shares memory with the parent array
 * - **Mutable**: Changes propagate to the parent
 * - **Flexible indexing**: Supports slices, stepped ranges, and scattered indices
 *
 * @example
 * ```typescript
 * // Create a SubArray via view() on JuliaArray
 * const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
 * const subArr = arr.view([1, 3]); // indices 1..3 (0-based)
 *
 * // SubArray reflects parent data
 * console.log(subArr.value); // [2, 3, 4]
 *
 * // Modifications propagate to parent
 * subArr.set(0, 100);
 * console.log(arr.value[1]); // 100
 *
 * // Get parent array
 * const parent = subArr.parent;
 * ```
 *
 * @example
 * ```typescript
 * // Multi-dimensional views
 * const matrix = Julia.eval("reshape(Float64.(1:12), 3, 4)") as JuliaArray;
 * const col1 = matrix.view(":", 0); // First column
 * const row2 = matrix.view(1, ":"); // Second row
 * ```
 *
 * @example
 * ```typescript
 * // Nested views (view of view)
 * const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
 * const sub1 = arr.view([2, 8]);     // [3, 4, 5, 6, 7, 8, 9]
 * const sub2 = sub1.view([1, 3]);    // [4, 5, 6]
 * ```
 */
export class JuliaSubArray implements JuliaValue {
  ptr: Pointer;
  elType: JuliaDataType;

  constructor(ptr: Pointer, elType: JuliaDataType) {
    this.ptr = ptr;
    this.elType = elType;
  }

  /**
   * Create a view (SubArray) of an array with specified indices.
   *
   * @param array The source array.
   * @param indices Index specifications. Can be:
   *   - `number`: Single index (0-based, converted to 1-based for Julia)
   *   - `":"`: All elements in that dimension (equivalent to Julia's `:`)
   *   - `[start, stop]`: Range (0-based, inclusive)
   *   - `[start, step, stop]`: Stepped range (0-based)
   * @returns A new JuliaSubArray.
   *
   * @example
   * ```typescript
   * const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
   *
   * // View elements 1..3 (0-based indices)
   * const sub1 = JuliaSubArray.view(arr, [1, 3]);
   *
   * // View every other element
   * const sub2 = JuliaSubArray.view(arr, [0, 2, 4]); // step=2
   *
   * // For multi-dimensional arrays
   * const matrix = Julia.eval("reshape(1:12, 3, 4)");
   * const sub3 = JuliaSubArray.view(matrix, ":", 0); // All rows, first column
   * ```
   */
  static view(
    array: JuliaValue,
    ...indices: (number | ":" | [number, number] | [number, number, number])[]
  ): JuliaSubArray {
    // Convert indices to Julia-compatible format
    const juliaIndices: JuliaValue[] = indices.map((idx) => {
      if (idx === ":") {
        // All elements: use Julia's Colon singleton
        return Julia.Base.Colon();
      } else if (typeof idx === "number") {
        // Single index: convert to 1-based
        return Julia.autoWrap(idx + 1);
      } else if (Array.isArray(idx)) {
        if (idx.length === 2) {
          // Range [start, stop]: convert to Julia range (1-based)
          const [start, stop] = idx;
          return Julia.Base.UnitRange(start + 1, stop + 1);
        } else if (idx.length === 3) {
          // Stepped range [start, step, stop]
          const [start, step, stop] = idx;
          return Julia.callWithKwargs(
            Julia.Base.range,
            { stop: stop + 1, step },
            start + 1,
          );
        }
      }
      throw new Error(`Invalid index specification: ${idx}`);
    });

    // Call Julia's view() function
    const subArray = Julia.Base.view(array, ...juliaIndices);

    // Get element type
    const elTypePtr = jlbun.symbols.jl_array_eltype(subArray.ptr);
    if (elTypePtr === null) {
      throw new Error("Failed to get element type from SubArray");
    }
    const elType = new JuliaDataType(elTypePtr, Julia.getTypeStr(elTypePtr));

    return new JuliaSubArray(subArray.ptr, elType);
  }

  /**
   * Create a contiguous view of elements from `start` to `stop` (0-based, inclusive).
   *
   * This is a convenience method for 1D array views.
   *
   * @param array The source 1D array.
   * @param start Start index (0-based, inclusive).
   * @param stop Stop index (0-based, inclusive).
   * @returns A new JuliaSubArray.
   */
  static slice(array: JuliaValue, start: number, stop: number): JuliaSubArray {
    return JuliaSubArray.view(array, [start, stop]);
  }

  /**
   * Get the parent array of this SubArray.
   */
  get parent(): JuliaValue {
    return Julia.Base.parent(this);
  }

  /**
   * Get the parent indices (how this SubArray maps to the parent).
   */
  get parentindices(): JuliaValue {
    return Julia.Base.parentindices(this);
  }

  /**
   * Total number of elements in the SubArray.
   */
  get length(): number {
    return Number(Julia.Base.length(this).value);
  }

  /**
   * Number of dimensions.
   */
  get ndims(): number {
    return Number(Julia.Base.ndims(this).value);
  }

  /**
   * Size (shape) of the SubArray.
   */
  get size(): number[] {
    const sizeValue = Julia.Base.size(this);
    const ndims = this.ndims;
    const result: number[] = [];
    for (let i = 0; i < ndims; i++) {
      result.push(
        Number((Julia.Base.getindex(sizeValue, i + 1) as JuliaValue).value),
      );
    }
    return result;
  }

  /**
   * Check if the SubArray's memory layout is contiguous.
   *
   * Contiguous SubArrays can be more efficiently converted to TypedArrays.
   */
  get isContiguous(): boolean {
    // Julia's DenseArray includes contiguous SubArrays
    // We check via Base.iscontiguous if available, or infer from type
    try {
      return Julia.Base.iscontiguous(this).value as boolean;
    } catch {
      // Fallback: check if stride is 1 for 1D arrays
      if (this.ndims === 1) {
        const strides = Julia.Base.strides(this);
        return (
          Number((Julia.Base.getindex(strides, 1) as JuliaValue).value) === 1
        );
      }
      return false;
    }
  }

  /**
   * Convert multi-dimensional indices to linear index (column-major order).
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
   * Get element at the given linear index (0-based).
   *
   * @param index Linear index (column-major order).
   */
  get(index: number): JuliaValue {
    if (index < 0 || index >= this.length) {
      throw new RangeError(`Index out of bounds: ${index}`);
    }
    // Julia uses 1-based indexing
    return Julia.Base.getindex(this, index + 1);
  }

  /**
   * Get element at the given multi-dimensional indices (0-based).
   *
   * @param indices Indices for each dimension.
   */
  getAt(...indices: number[]): JuliaValue {
    const linearIndex = this.indicesToLinear(...indices);
    return this.get(linearIndex);
  }

  /**
   * Set element at the given linear index (0-based).
   *
   * Changes propagate to the parent array.
   *
   * @param index Linear index.
   * @param value Value to set.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(index: number, value: any): void {
    if (index < 0 || index >= this.length) {
      throw new RangeError(`Index out of bounds: ${index}`);
    }
    const wrapped = Julia.autoWrap(value);
    // Julia uses 1-based indexing
    Julia.Base["setindex!"](this, wrapped, index + 1);
  }

  /**
   * Set element at the given multi-dimensional indices (0-based).
   *
   * @param args Indices followed by the value.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAt(...args: any[]): void {
    if (args.length < 2) {
      throw new Error("setAt requires at least one index and a value");
    }
    const value = args[args.length - 1];
    const indices = args.slice(0, -1) as number[];
    const linearIndex = this.indicesToLinear(...indices);
    this.set(linearIndex, value);
  }

  /**
   * Fill the SubArray with a value.
   *
   * @param value Value to fill with.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fill(value: any): void {
    Julia.Base["fill!"](this, Julia.autoWrap(value));
  }

  /**
   * Copy SubArray data to a new Array.
   *
   * Unlike `value`, this creates a Julia Array rather than a JS array.
   */
  copy(): JuliaArray {
    const copied = Julia.Base.copy(this);
    return new JuliaArray(copied.ptr, this.elType);
  }

  /**
   * Collect the SubArray into a contiguous Julia Array.
   *
   * This is similar to `copy()` but ensures the result is a standard Array.
   */
  collect(): JuliaArray {
    const collected = Julia.Base.collect(this);
    return new JuliaArray(collected.ptr, this.elType);
  }

  /**
   * Get the SubArray data as a JavaScript array or TypedArray.
   *
   * Note: For non-contiguous SubArrays, this collects the data first.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): BunArray | any[] {
    // SubArray may not have contiguous memory, so we collect it first
    const collected = Julia.Base.collect(this);
    return collected.value;
  }

  /**
   * Iterate over the SubArray elements.
   */
  *[Symbol.iterator](): Iterator<JuliaValue> {
    const len = this.length;
    for (let i = 0; i < len; i++) {
      yield this.get(i);
    }
  }

  /**
   * Map a function over the SubArray and get a new array.
   *
   * @param f Julia function to apply.
   * @returns A new JuliaArray with the mapped values.
   */
  map(f: JuliaValue): JuliaArray {
    const arr = Julia.Base.map(f, this);
    const elType = jlbun.symbols.jl_array_eltype(arr.ptr)!;
    const typeStr = Julia.getTypeStr(elType);
    return new JuliaArray(arr.ptr, new JuliaDataType(elType, typeStr));
  }

  /**
   * Create a view (SubArray) of this SubArray with specified indices.
   *
   * Views can be nested - a view of a view is still a valid SubArray.
   *
   * @param indices Index specifications (same as static `view()` method).
   * @returns A new JuliaSubArray.
   *
   * @example
   * ```typescript
   * const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
   * const sub1 = arr.view([2, 8]);     // [3, 4, 5, 6, 7, 8, 9]
   * const sub2 = sub1.view([1, 3]);    // [4, 5, 6]
   * ```
   */
  view(
    ...indices: (number | ":" | [number, number] | [number, number, number])[]
  ): JuliaSubArray {
    return JuliaSubArray.view(this, ...indices);
  }

  /**
   * Create a contiguous view (slice) of elements from `start` to `stop` (0-based, inclusive).
   *
   * @param start Start index (0-based, inclusive).
   * @param stop Stop index (0-based, inclusive).
   * @returns A new JuliaSubArray.
   */
  slice(start: number, stop: number): JuliaSubArray {
    return JuliaSubArray.view(this, [start, stop]);
  }

  /**
   * Get pointer to SubArray data if contiguous.
   *
   * **Warning**: Only valid for contiguous SubArrays. The pointer becomes
   * invalid if the parent array is garbage collected.
   */
  get rawPtr(): Pointer | null {
    if (!this.isContiguous) {
      return null;
    }
    const ptrValue = Julia.Base.pointer(this);
    return jlbun.symbols.jl_unbox_voidpointer(ptrValue.ptr);
  }

  /**
   * Get value directly from memory for contiguous numeric SubArrays.
   *
   * This is faster than `value` for contiguous SubArrays but only works
   * for primitive numeric types.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get fastValue(): any[] | null {
    const ptr = this.rawPtr;
    if (ptr === null) {
      return null;
    }

    const len = this.length;

    if (this.elType.isEqual(Julia.Int8)) {
      return Array.from(new Int8Array(toArrayBuffer(ptr, 0, len)));
    } else if (this.elType.isEqual(Julia.UInt8)) {
      return Array.from(new Uint8Array(toArrayBuffer(ptr, 0, len)));
    } else if (this.elType.isEqual(Julia.Int16)) {
      return Array.from(new Int16Array(toArrayBuffer(ptr, 0, 2 * len)));
    } else if (this.elType.isEqual(Julia.UInt16)) {
      return Array.from(new Uint16Array(toArrayBuffer(ptr, 0, 2 * len)));
    } else if (this.elType.isEqual(Julia.Int32)) {
      return Array.from(new Int32Array(toArrayBuffer(ptr, 0, 4 * len)));
    } else if (this.elType.isEqual(Julia.UInt32)) {
      return Array.from(new Uint32Array(toArrayBuffer(ptr, 0, 4 * len)));
    } else if (this.elType.isEqual(Julia.Float32)) {
      return Array.from(new Float32Array(toArrayBuffer(ptr, 0, 4 * len)));
    } else if (this.elType.isEqual(Julia.Float64)) {
      return Array.from(new Float64Array(toArrayBuffer(ptr, 0, 8 * len)));
    } else if (this.elType.isEqual(Julia.Int64)) {
      return Array.from(new BigInt64Array(toArrayBuffer(ptr, 0, 8 * len)));
    } else if (this.elType.isEqual(Julia.UInt64)) {
      return Array.from(new BigUint64Array(toArrayBuffer(ptr, 0, 8 * len)));
    }

    return null;
  }

  toString(): string {
    return `[JuliaSubArray ${Julia.string(this)}]`;
  }
}
