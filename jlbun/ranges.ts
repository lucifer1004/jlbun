import { Pointer } from "bun:ffi";
import { Julia, JuliaValue } from "./index.js";

/**
 * Wrapper for Julia Range types (UnitRange, StepRange, StepRangeLen, LinRange).
 *
 * Julia ranges are lazy sequences that don't allocate memory for all elements.
 * They only store start, stop, and step (if applicable).
 *
 * ## Supported Range Types
 *
 * - `UnitRange{T}` - step is 1, e.g., `1:10`
 * - `StepRange{T,S}` - with explicit step, e.g., `1:2:10`
 * - `StepRangeLen{T,R,S}` - floating point ranges, e.g., `range(0, 1, length=11)`
 * - `LinRange{T}` - linearly spaced, e.g., `LinRange(0, 1, 11)`
 *
 * @example
 * ```typescript
 * // Create ranges via Julia
 * const unitRange = Julia.eval("1:10") as JuliaRange;
 * const stepRange = Julia.eval("1:2:10") as JuliaRange;
 * const linRange = Julia.eval("LinRange(0.0, 1.0, 11)") as JuliaRange;
 *
 * // Properties
 * console.log(unitRange.first.value);  // 1
 * console.log(unitRange.last.value);   // 10
 * console.log(unitRange.length);       // 10
 * console.log(stepRange.step.value);   // 2
 *
 * // Indexing (0-based)
 * console.log(unitRange.get(0).value); // 1
 * console.log(unitRange.get(9).value); // 10
 *
 * // Convert to array
 * const arr = unitRange.value;  // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 * ```
 *
 * @example
 * ```typescript
 * // Create range using factory method
 * const range1 = JuliaRange.from(1, 10);        // 1:10
 * const range2 = JuliaRange.from(1, 10, 2);     // 1:2:9
 * const range3 = JuliaRange.linspace(0, 1, 5); // LinRange(0.0, 1.0, 5)
 * ```
 */
export class JuliaRange implements JuliaValue {
  ptr: Pointer;

  constructor(ptr: Pointer) {
    this.ptr = ptr;
  }

  /**
   * Create a range from start to stop with optional step.
   *
   * @param start Start value (inclusive).
   * @param stop Stop value (inclusive for UnitRange, may not be included for StepRange).
   * @param step Optional step value. If omitted, creates a UnitRange with step=1.
   * @returns A new JuliaRange.
   *
   * @example
   * ```typescript
   * const r1 = JuliaRange.from(1, 10);     // 1:10 (UnitRange)
   * const r2 = JuliaRange.from(1, 10, 2);  // 1:2:9 (StepRange)
   * ```
   */
  static from(
    start: number | bigint,
    stop: number | bigint,
    step?: number | bigint,
  ): JuliaRange {
    let rangeValue: JuliaValue;
    if (step === undefined) {
      // UnitRange: use UnitRange constructor
      rangeValue = Julia.Base.UnitRange(
        Julia.autoWrap(start),
        Julia.autoWrap(stop),
      );
    } else {
      // StepRange: use range() with step keyword
      rangeValue = Julia.callWithKwargs(
        Julia.Base.range,
        { stop: Julia.autoWrap(stop), step: Julia.autoWrap(step) },
        Julia.autoWrap(start),
      );
    }
    return new JuliaRange(rangeValue.ptr);
  }

  /**
   * Create a linearly spaced range (LinRange).
   *
   * @param start Start value.
   * @param stop Stop value.
   * @param length Number of elements.
   * @returns A new JuliaRange (LinRange type).
   *
   * @example
   * ```typescript
   * const r = JuliaRange.linspace(0, 1, 5);
   * // Values: [0.0, 0.25, 0.5, 0.75, 1.0]
   * ```
   */
  static linspace(start: number, stop: number, length: number): JuliaRange {
    const rangeValue = Julia.Base.LinRange(start, stop, length);
    return new JuliaRange(rangeValue.ptr);
  }

  /**
   * Create a range with specified length using Base.range().
   *
   * @param start Start value.
   * @param length Number of elements.
   * @param step Step value.
   * @returns A new JuliaRange.
   *
   * @example
   * ```typescript
   * const r = JuliaRange.withLength(0, 5, 0.1);
   * // Values: [0.0, 0.1, 0.2, 0.3, 0.4]
   * ```
   */
  static withLength(start: number, length: number, step: number): JuliaRange {
    const rangeValue = Julia.callWithKwargs(
      Julia.Base.range,
      { length, step },
      start,
    );
    return new JuliaRange(rangeValue.ptr);
  }

  /**
   * First element of the range.
   */
  get first(): JuliaValue {
    return Julia.Base.first(this);
  }

  /**
   * Last element of the range.
   */
  get last(): JuliaValue {
    return Julia.Base.last(this);
  }

  /**
   * Step size of the range.
   * For UnitRange, this returns 1.
   */
  get step(): JuliaValue {
    return Julia.Base.step(this);
  }

  /**
   * Number of elements in the range.
   */
  get length(): number {
    return Number(Julia.Base.length(this).value);
  }

  /**
   * Check if the range is empty.
   */
  get isEmpty(): boolean {
    return Julia.Base.isempty(this).value as boolean;
  }

  /**
   * Get the element type of the range.
   */
  get elType(): JuliaValue {
    return Julia.Base.eltype(this);
  }

  /**
   * Get element at the given index (0-based).
   *
   * @param index The index (0-based).
   * @returns The element at the given index.
   */
  get(index: number): JuliaValue {
    if (index < 0 || index >= this.length) {
      throw new RangeError(`Index out of bounds: ${index}`);
    }
    // Julia uses 1-based indexing
    return Julia.Base.getindex(this, index + 1);
  }

  /**
   * Check if the range contains a value.
   *
   * @param value Value to check.
   * @returns true if the range contains the value.
   */
  contains(value: number | bigint | JuliaValue): boolean {
    const wrapped = Julia.autoWrap(value);
    return Julia.Base.in(wrapped, this).value as boolean;
  }

  /**
   * Convert the range to an array.
   * Note: This allocates memory for all elements.
   *
   * @returns Array of values.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): any[] {
    const collected = Julia.Base.collect(this);
    return collected.value;
  }

  /**
   * Iterate over the range elements.
   *
   * @example
   * ```typescript
   * const range = JuliaRange.from(1, 5);
   * for (const val of range) {
   *   console.log(val.value);  // 1, 2, 3, 4, 5
   * }
   * ```
   */
  *[Symbol.iterator](): Iterator<JuliaValue> {
    const len = this.length;
    for (let i = 0; i < len; i++) {
      yield this.get(i);
    }
  }

  /**
   * Reverse the range.
   *
   * @returns A new JuliaRange with reversed order.
   */
  reverse(): JuliaRange {
    return new JuliaRange(Julia.Base.reverse(this).ptr);
  }

  /**
   * Map a function over the range.
   *
   * @param f Julia function to apply.
   * @returns Result of mapping (typically a collected array).
   */
  map(f: JuliaValue): JuliaValue {
    return Julia.Base.map(f, this);
  }

  toString(): string {
    return `[JuliaRange ${Julia.string(this)}]`;
  }
}
