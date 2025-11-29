import { Pointer } from "bun:ffi";
import { jlbun, JuliaDataType, JuliaValue } from "./index.js";

// Float16 conversion utilities (reuse from values.ts)
function float32ToFloat16Bits(value: number): number {
  const f32 = new Float32Array(1);
  const u32 = new Uint32Array(f32.buffer);
  f32[0] = value;
  const bits = u32[0];

  const sign = (bits >> 31) & 0x1;
  const exp = (bits >> 23) & 0xff;
  const frac = bits & 0x7fffff;

  if (exp === 0xff) {
    if (frac === 0) {
      return (sign << 15) | 0x7c00;
    } else {
      return (sign << 15) | 0x7c00 | (frac >> 13);
    }
  }

  const newExp = exp - 127 + 15;

  if (newExp >= 31) {
    return (sign << 15) | 0x7c00;
  } else if (newExp <= 0) {
    if (newExp < -10) {
      return sign << 15;
    }
    const m = frac | 0x800000;
    const shift = 14 - newExp;
    return (sign << 15) | (m >> shift);
  } else {
    return (sign << 15) | (newExp << 10) | (frac >> 13);
  }
}

function float16BitsToFloat32(bits: number): number {
  const sign = (bits >> 15) & 0x1;
  const exp = (bits >> 10) & 0x1f;
  const frac = bits & 0x3ff;

  let result: number;

  if (exp === 0) {
    if (frac === 0) {
      result = 0;
    } else {
      result = frac * Math.pow(2, -24);
    }
  } else if (exp === 31) {
    if (frac === 0) {
      result = Infinity;
    } else {
      result = NaN;
    }
  } else {
    result = (1 + frac / 1024) * Math.pow(2, exp - 15);
  }

  return sign ? -result : result;
}

/**
 * Complex element type enumeration.
 */
export enum ComplexElementType {
  Float16 = "Float16",
  Float32 = "Float32",
  Float64 = "Float64",
}

/**
 * Wrapper for Julia Complex{T} types.
 *
 * Supports ComplexF64, ComplexF32, and ComplexF16.
 *
 * @example
 * ```typescript
 * // Create complex numbers
 * const c1 = JuliaComplex.from(3, 4);  // 3 + 4im (ComplexF64)
 * const c2 = JuliaComplex.fromF32(1, 2);  // ComplexF32
 *
 * // Access components
 * console.log(c1.re);   // 3
 * console.log(c1.im);   // 4
 * console.log(c1.abs);  // 5
 * console.log(c1.arg);  // 0.9272... (radians)
 *
 * // Get as JS object
 * console.log(c1.value);  // { re: 3, im: 4 }
 * ```
 */
export class JuliaComplex implements JuliaValue {
  readonly ptr: Pointer;
  private readonly _elType: ComplexElementType;

  // Cached type pointers (set by Julia.init)
  static ComplexF64Type: JuliaDataType;
  static ComplexF32Type: JuliaDataType;
  static ComplexF16Type: JuliaDataType;

  constructor(ptr: Pointer, elType: ComplexElementType) {
    this.ptr = ptr;
    this._elType = elType;
  }

  /**
   * Get the element type (Float16, Float32, or Float64).
   */
  get elType(): ComplexElementType {
    return this._elType;
  }

  /**
   * Get the real part.
   */
  get re(): number {
    switch (this._elType) {
      case ComplexElementType.Float64:
        return jlbun.symbols.jl_unbox_complex64_re(this.ptr);
      case ComplexElementType.Float32:
        return jlbun.symbols.jl_unbox_complex32_re(this.ptr);
      case ComplexElementType.Float16:
        return float16BitsToFloat32(
          jlbun.symbols.jl_unbox_complex16_re(this.ptr),
        );
      default:
        throw new Error(`Unsupported complex element type: ${this._elType}`);
    }
  }

  /**
   * Get the imaginary part.
   */
  get im(): number {
    switch (this._elType) {
      case ComplexElementType.Float64:
        return jlbun.symbols.jl_unbox_complex64_im(this.ptr);
      case ComplexElementType.Float32:
        return jlbun.symbols.jl_unbox_complex32_im(this.ptr);
      case ComplexElementType.Float16:
        return float16BitsToFloat32(
          jlbun.symbols.jl_unbox_complex16_im(this.ptr),
        );
      default:
        throw new Error(`Unsupported complex element type: ${this._elType}`);
    }
  }

  /**
   * Get the absolute value (magnitude).
   */
  get abs(): number {
    return Math.sqrt(this.re ** 2 + this.im ** 2);
  }

  /**
   * Get the argument (phase angle in radians).
   */
  get arg(): number {
    return Math.atan2(this.im, this.re);
  }

  /**
   * Get as JavaScript object.
   */
  get value(): { re: number; im: number } {
    return { re: this.re, im: this.im };
  }

  /**
   * String representation.
   */
  toString(): string {
    const im = this.im;
    if (im >= 0) {
      return `${this.re} + ${im}im`;
    } else {
      return `${this.re} - ${-im}im`;
    }
  }

  // ===== Factory Methods =====

  /**
   * Create a ComplexF64 from real and imaginary parts.
   *
   * @param re Real part
   * @param im Imaginary part (default: 0)
   */
  static from(re: number, im: number = 0): JuliaComplex {
    const ptr = jlbun.symbols.jl_box_complex64(re, im)!;
    return new JuliaComplex(ptr, ComplexElementType.Float64);
  }

  /**
   * Create a ComplexF32 from real and imaginary parts.
   *
   * @param re Real part
   * @param im Imaginary part (default: 0)
   */
  static fromF32(re: number, im: number = 0): JuliaComplex {
    const ptr = jlbun.symbols.jl_box_complex32(re, im)!;
    return new JuliaComplex(ptr, ComplexElementType.Float32);
  }

  /**
   * Create a ComplexF16 from real and imaginary parts.
   *
   * @param re Real part
   * @param im Imaginary part (default: 0)
   */
  static fromF16(re: number, im: number = 0): JuliaComplex {
    const reBits = float32ToFloat16Bits(re);
    const imBits = float32ToFloat16Bits(im);
    const ptr = jlbun.symbols.jl_box_complex16(reBits, imBits)!;
    return new JuliaComplex(ptr, ComplexElementType.Float16);
  }

  /**
   * Create a complex number from polar form.
   *
   * @param r Magnitude
   * @param theta Phase angle in radians
   * @param elType Element type (default: Float64)
   */
  static fromPolar(
    r: number,
    theta: number,
    elType: ComplexElementType = ComplexElementType.Float64,
  ): JuliaComplex {
    const re = r * Math.cos(theta);
    const im = r * Math.sin(theta);
    switch (elType) {
      case ComplexElementType.Float64:
        return JuliaComplex.from(re, im);
      case ComplexElementType.Float32:
        return JuliaComplex.fromF32(re, im);
      case ComplexElementType.Float16:
        return JuliaComplex.fromF16(re, im);
    }
  }

  /**
   * Wrap an existing Julia Complex pointer.
   * @internal
   */
  static wrap(ptr: Pointer, typeStr: string): JuliaComplex {
    let elType: ComplexElementType;

    // Handle both "ComplexF64" and "Complex{Float64}" formats
    if (typeStr === "ComplexF64" || typeStr === "Complex{Float64}") {
      elType = ComplexElementType.Float64;
    } else if (typeStr === "ComplexF32" || typeStr === "Complex{Float32}") {
      elType = ComplexElementType.Float32;
    } else if (typeStr === "ComplexF16" || typeStr === "Complex{Float16}") {
      elType = ComplexElementType.Float16;
    } else {
      // Try to extract from Complex{T} format
      const match = typeStr.match(/Complex\{(\w+)\}/);
      if (match) {
        const elTypeStr = match[1];
        switch (elTypeStr) {
          case "Float64":
            elType = ComplexElementType.Float64;
            break;
          case "Float32":
            elType = ComplexElementType.Float32;
            break;
          case "Float16":
            elType = ComplexElementType.Float16;
            break;
          default:
            throw new Error(`Unsupported complex element type: ${elTypeStr}`);
        }
      } else {
        throw new Error(`Invalid complex type string: ${typeStr}`);
      }
    }

    return new JuliaComplex(ptr, elType);
  }
}
