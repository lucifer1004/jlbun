import { Pointer } from "bun:ffi";
import { jlbun, Julia, JuliaValue, MethodError, safeCString } from "./index.js";

abstract class JuliaPrimitive implements JuliaValue {
  ptr: Pointer;

  constructor(ptr: Pointer) {
    this.ptr = ptr;
  }

  abstract get value(): number | bigint | boolean | string | symbol | null;

  toString(): string {
    return Julia.string(this);
  }
}

/**
 * Wrapper for Julia `Int8`.
 */
export class JuliaInt8 extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: number): JuliaInt8 {
    return new JuliaInt8(jlbun.symbols.jl_box_int8(value)!);
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_int8(this.ptr);
  }
}

/**
 * Wrapper for Julia `UInt8`.
 */
export class JuliaUInt8 extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: number): JuliaUInt8 {
    return new JuliaUInt8(jlbun.symbols.jl_box_uint8(value)!);
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_uint8(this.ptr);
  }
}

/**
 * Wrapper for Julia `Int16`.
 */
export class JuliaInt16 extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: number): JuliaInt16 {
    return new JuliaInt16(jlbun.symbols.jl_box_int16(value)!);
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_int16(this.ptr);
  }
}

/**
 * Wrapper for Julia UInt16.
 */
export class JuliaUInt16 extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: number): JuliaUInt16 {
    return new JuliaUInt16(jlbun.symbols.jl_box_uint16(value)!);
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_uint16(this.ptr);
  }
}

/**
 * Wrapper for Julia `Int32`.
 */
export class JuliaInt32 extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: number): JuliaInt32 {
    return new JuliaInt32(jlbun.symbols.jl_box_int32(value)!);
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_int32(this.ptr);
  }
}

/**
 * Wrapper for Julia `UInt32`.
 */
export class JuliaUInt32 extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: number): JuliaUInt32 {
    return new JuliaUInt32(jlbun.symbols.jl_box_uint32(value)!);
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_uint32(this.ptr);
  }
}

/**
 * Wrapper for Julia `Int64`.
 */
export class JuliaInt64 extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: number | bigint): JuliaInt64 {
    return new JuliaInt64(jlbun.symbols.jl_box_int64(value)!);
  }

  get value(): bigint {
    return jlbun.symbols.jl_unbox_int64(this.ptr);
  }
}

/**
 * Wrapper for Julia `UInt64`.
 */
export class JuliaUInt64 extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: number | bigint): JuliaUInt64 {
    return new JuliaUInt64(jlbun.symbols.jl_box_uint64(value)!);
  }

  get value(): bigint {
    return jlbun.symbols.jl_unbox_uint64(this.ptr);
  }
}

/**
 * Wrapper for Julia `Float32`.
 */
export class JuliaFloat32 extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: number): JuliaFloat32 {
    return new JuliaFloat32(jlbun.symbols.jl_box_float32(value)!);
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_float32(this.ptr);
  }
}

/**
 * Wrapper for Julia `Float64`.
 */
export class JuliaFloat64 extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: number | bigint): JuliaFloat64 {
    return new JuliaFloat64(jlbun.symbols.jl_box_float64(Number(value))!);
  }

  get value(): number {
    return jlbun.symbols.jl_unbox_float64(this.ptr);
  }
}

/**
 * Wrapper for Julia `Bool`.
 */
export class JuliaBool extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: boolean): JuliaBool {
    return new JuliaBool(jlbun.symbols.jl_box_bool(value ? 1 : 0)!);
  }

  get value(): boolean {
    return jlbun.symbols.jl_unbox_bool(this.ptr) === 1;
  }
}

/**
 * Wrapper for Julia `Char`.
 */
export class JuliaChar extends JuliaPrimitive {
  name: string;

  constructor(ptr: Pointer) {
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

/**
 * Wrapper for Julia `String`.
 */
export class JuliaString extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  static from(value: string): JuliaString {
    return new JuliaString(
      jlbun.symbols.jl_cstr_to_string(safeCString(value))!,
    );
  }

  get value(): string {
    const strPtr = jlbun.symbols.jl_string_ptr(this.ptr);
    if (strPtr === null) {
      throw new Error("Failed to get string pointer from Julia string object");
    }
    return strPtr.toString();
  }
}

/**
 * Wrapper for Julia `Symbol`.
 */
export class JuliaSymbol extends JuliaPrimitive {
  name: string;

  constructor(ptr: Pointer, name: string) {
    super(ptr);
    this.name = name;
  }

  static from(value: string | symbol): JuliaSymbol {
    const name =
      typeof value === "string" ? value : (value.description as string);
    return new JuliaSymbol(jlbun.symbols.jl_symbol(safeCString(name))!, name);
  }

  get value(): symbol {
    return Symbol.for(this.name);
  }
}

/**
 * Singleton wrapper for Julia `Nothing`.
 */
export class JuliaNothing extends JuliaPrimitive {
  static instance: JuliaNothing;

  private constructor(ptr: Pointer) {
    super(ptr);
  }

  static getInstance(): JuliaNothing {
    if (!JuliaNothing.instance) {
      JuliaNothing.instance = new JuliaNothing(
        jlbun.symbols.jl_nothing_getter()!,
      );
    }
    return JuliaNothing.instance;
  }

  get value(): null {
    return null;
  }
}

/**
 * Wrapper for Julia `Ptr{T}` - typed pointer for FFI and memory operations.
 *
 * Julia's `Ptr{T}` is used for:
 * - C interoperability (ccall)
 * - Direct memory access
 * - Array data pointers
 *
 * ## Safety Warning
 *
 * Operations like `load()` and `store()` are **unsafe** - they can cause
 * segfaults or memory corruption if used incorrectly. The caller is responsible
 * for ensuring:
 * - The pointer is valid and properly aligned
 * - The pointed-to memory has not been freed
 * - The type matches the actual data in memory
 *
 * @example
 * ```typescript
 * // Get pointer to array data
 * const arr = JuliaArray.from(new Float64Array([1, 2, 3]));
 * const ptr = JuliaPtr.fromArray(arr);
 *
 * // Read values (unsafe_load)
 * const first = ptr.load();   // 1.0
 * const second = ptr.load(1); // 2.0 (offset by 1 element)
 *
 * // Write values (unsafe_store!)
 * ptr.store(99.0, 0);  // arr[0] = 99.0
 *
 * // Pointer arithmetic
 * const ptr2 = ptr.offset(2);  // Points to arr[2]
 * ```
 */
export class JuliaPtr extends JuliaPrimitive {
  constructor(ptr: Pointer) {
    super(ptr);
  }

  /**
   * Create a `Ptr{Cvoid}` from a raw address.
   *
   * @param address The memory address as a number or bigint.
   * @returns A new `JuliaPtr` pointing to the address.
   *
   * @example
   * ```typescript
   * const ptr = JuliaPtr.fromAddress(0x7fff12340000n);
   * ```
   */
  static fromAddress(address: number | bigint): JuliaPtr {
    // Use Julia's Ptr{Cvoid} constructor with UInt address
    const addr = typeof address === "bigint" ? address : BigInt(address);
    const ptrType = Julia.Core.apply_type(Julia.Base.Ptr, Julia.Base.Cvoid);
    const ptrValue = Julia.Base.convert(ptrType, Julia.autoWrap(addr));
    return new JuliaPtr(ptrValue.ptr);
  }

  /**
   * Get the data pointer from a `JuliaArray`.
   *
   * @param array The Julia array.
   * @returns A `JuliaPtr` pointing to the array's data.
   *
   * @example
   * ```typescript
   * const arr = JuliaArray.from(new Float64Array([1, 2, 3]));
   * const ptr = JuliaPtr.fromArray(arr);
   * ```
   */
  static fromArray(array: JuliaValue): JuliaPtr {
    const ptrValue = Julia.Base.pointer(array);
    return new JuliaPtr(ptrValue.ptr);
  }

  /**
   * Get the memory address of any Julia object.
   *
   * **WARNING**: The returned pointer is only valid while the object is
   * protected from garbage collection! Use with extreme caution.
   *
   * @param obj Any Julia value.
   * @returns A `JuliaPtr` pointing to the object's memory location.
   */
  static fromObject(obj: JuliaValue): JuliaPtr {
    const ptrValue = Julia.Base.pointer_from_objref(obj);
    return new JuliaPtr(ptrValue.ptr);
  }

  /**
   * Get the raw address value of this pointer.
   *
   * @returns The memory address as a bigint.
   */
  get address(): bigint {
    return Julia.Base.UInt(this).value as bigint;
  }

  /**
   * Get the raw pointer value (same as `address` but as Bun's Pointer type).
   */
  get value(): Pointer {
    const voidPtr = jlbun.symbols.jl_unbox_voidpointer(this.ptr);
    if (voidPtr === null) {
      throw new Error("Failed to unbox void pointer from Julia value");
    }
    return voidPtr;
  }

  /**
   * Get the element type `T` from `Ptr{T}`.
   *
   * @returns The Julia DataType of the pointed-to type.
   */
  get elType(): JuliaValue {
    const elTypePtr = jlbun.symbols.jl_ptr_eltype(this.ptr);
    if (elTypePtr === null) {
      throw new Error("Failed to get element type from Ptr");
    }
    return Julia.wrapPtr(elTypePtr);
  }

  /**
   * Check if this is a null pointer (C_NULL).
   */
  get isNull(): boolean {
    return this.address === 0n;
  }

  /**
   * Load a value from the pointer location.
   * Equivalent to Julia's `unsafe_load(ptr, i)`.
   *
   * **WARNING**: This is an unsafe operation!
   *
   * @param offset Element offset (0-based, default 0). Offset is in units of
   *               the element type size, not bytes.
   * @returns The value at the pointer location.
   */
  load(offset: number = 0): JuliaValue {
    // Julia's unsafe_load is 1-indexed
    return Julia.Base.unsafe_load(this, offset + 1);
  }

  /**
   * Store a value at the pointer location.
   * Equivalent to Julia's `unsafe_store!(ptr, value, i)`.
   *
   * **WARNING**: This is an unsafe operation!
   *
   * @param value The value to store.
   * @param offset Element offset (0-based, default 0). Offset is in units of
   *               the element type size, not bytes.
   */
  store(
    value: JuliaValue | number | bigint | boolean | string,
    offset: number = 0,
  ): void {
    // Julia's unsafe_store! is 1-indexed
    Julia.Base["unsafe_store!"](this, Julia.autoWrap(value), offset + 1);
  }

  /**
   * Create a new pointer offset by `n` elements.
   *
   * Note: Julia's `ptr + n` offsets by n *bytes*. This method offsets by
   * n *elements* (n * sizeof(T) bytes) for more intuitive usage.
   *
   * @param n Number of elements to offset (can be negative).
   * @returns A new `JuliaPtr` pointing to the offset location.
   */
  offset(n: number): JuliaPtr {
    // Julia's pointer arithmetic is byte-based, but we want element-based offset
    // Compute byte offset = n * sizeof(eltype(ptr))
    const elSize = Julia.Base.sizeof(this.elType);
    const byteOffset = Julia.Base["*"](Julia.autoWrap(n), elSize);
    const newPtr = Julia.Base["+"](this, byteOffset);
    return new JuliaPtr(newPtr.ptr);
  }

  /**
   * Reinterpret this pointer as a different type.
   * Equivalent to `reinterpret(Ptr{T}, ptr)` in Julia.
   *
   * @param newElType The new element type (e.g., `Julia.Float64`).
   * @returns A new `JuliaPtr` with the reinterpreted type.
   */
  reinterpret(newElType: JuliaValue): JuliaPtr {
    // Create Ptr{T} type using Julia's type application
    const ptrType = Julia.Core.apply_type(Julia.Base.Ptr, newElType);
    const newPtr = Julia.Base.reinterpret(ptrType, this);
    return new JuliaPtr(newPtr.ptr);
  }

  toString(): string {
    return `[JuliaPtr ${Julia.string(this)}]`;
  }
}

/**
 * Wrapper for Julia objects not handled yet.
 */
export class JuliaAny implements JuliaValue {
  ptr: Pointer;

  constructor(ptr: Pointer) {
    this.ptr = ptr;
  }

  get value(): string {
    return this.toString();
  }

  toString(): string {
    return `[JuliaValue ${Julia.string(this)}]`;
  }
}
