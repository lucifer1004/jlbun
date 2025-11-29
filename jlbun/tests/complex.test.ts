import { beforeAll, describe, expect, it } from "bun:test";
import {
  ComplexElementType,
  Julia,
  JuliaComplex,
  JuliaFunction,
} from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

describe("JuliaComplex", () => {
  describe("ComplexF64 creation", () => {
    it("can be created from JS with from()", () => {
      const c = JuliaComplex.from(3, 4);
      expect(c.re).toBe(3);
      expect(c.im).toBe(4);
      expect(c.elType).toBe(ComplexElementType.Float64);
    });

    it("can be created with only real part", () => {
      const c = JuliaComplex.from(5);
      expect(c.re).toBe(5);
      expect(c.im).toBe(0);
    });

    it("can be created from Julia", () => {
      const c = Julia.eval("3.0 + 4.0im");
      expect(c).toBeInstanceOf(JuliaComplex);
      expect((c as JuliaComplex).re).toBe(3);
      expect((c as JuliaComplex).im).toBe(4);
    });
  });

  describe("ComplexF32 creation", () => {
    it("can be created with fromF32()", () => {
      const c = JuliaComplex.fromF32(1, 2);
      expect(c.re).toBeCloseTo(1, 5);
      expect(c.im).toBeCloseTo(2, 5);
      expect(c.elType).toBe(ComplexElementType.Float32);
    });

    it("can be created from Julia", () => {
      const c = Julia.eval("ComplexF32(1, 2)");
      expect(c).toBeInstanceOf(JuliaComplex);
      expect((c as JuliaComplex).elType).toBe(ComplexElementType.Float32);
    });
  });

  describe("ComplexF16 creation", () => {
    it("can be created with fromF16()", () => {
      const c = JuliaComplex.fromF16(1, 2);
      expect(c.re).toBeCloseTo(1, 2);
      expect(c.im).toBeCloseTo(2, 2);
      expect(c.elType).toBe(ComplexElementType.Float16);
    });

    it("can be created from Julia", () => {
      const c = Julia.eval("ComplexF16(1, 2)");
      expect(c).toBeInstanceOf(JuliaComplex);
      expect((c as JuliaComplex).elType).toBe(ComplexElementType.Float16);
    });
  });

  describe("properties", () => {
    it("computes abs correctly", () => {
      const c = JuliaComplex.from(3, 4);
      expect(c.abs).toBe(5);
    });

    it("computes arg correctly", () => {
      const c = JuliaComplex.from(1, 1);
      expect(c.arg).toBeCloseTo(Math.PI / 4, 10);
    });

    it("computes arg for negative real", () => {
      const c = JuliaComplex.from(-1, 0);
      expect(c.arg).toBeCloseTo(Math.PI, 10);
    });

    it("value returns {re, im} object", () => {
      const c = JuliaComplex.from(3, 4);
      expect(c.value).toEqual({ re: 3, im: 4 });
    });
  });

  describe("toString", () => {
    it("formats positive imaginary part", () => {
      const c = JuliaComplex.from(3, 4);
      expect(c.toString()).toBe("3 + 4im");
    });

    it("formats negative imaginary part", () => {
      const c = JuliaComplex.from(3, -4);
      expect(c.toString()).toBe("3 - 4im");
    });

    it("formats zero imaginary part", () => {
      const c = JuliaComplex.from(5, 0);
      expect(c.toString()).toBe("5 + 0im");
    });
  });

  describe("fromPolar", () => {
    it("creates from magnitude and angle", () => {
      const c = JuliaComplex.fromPolar(5, Math.PI / 2);
      expect(c.re).toBeCloseTo(0, 10);
      expect(c.im).toBeCloseTo(5, 10);
    });

    it("creates ComplexF32 from polar", () => {
      const c = JuliaComplex.fromPolar(1, Math.PI, ComplexElementType.Float32);
      expect(c.elType).toBe(ComplexElementType.Float32);
      expect(c.re).toBeCloseTo(-1, 5);
      expect(c.im).toBeCloseTo(0, 5);
    });

    it("creates ComplexF16 from polar", () => {
      const c = JuliaComplex.fromPolar(1, 0, ComplexElementType.Float16);
      expect(c.elType).toBe(ComplexElementType.Float16);
      expect(c.re).toBeCloseTo(1, 2);
      expect(c.im).toBeCloseTo(0, 2);
    });
  });

  describe("Julia interop", () => {
    it("can be passed to Julia functions", () => {
      const c = JuliaComplex.from(3, 4);
      const absVal = Julia.Base.abs(c);
      expect(absVal.value).toBe(5);
    });

    it("can use Julia conj()", () => {
      const c = JuliaComplex.from(3, 4);
      const conj = Julia.Base.conj(c);
      expect(conj).toBeInstanceOf(JuliaComplex);
      expect((conj as JuliaComplex).re).toBe(3);
      expect((conj as JuliaComplex).im).toBe(-4);
    });

    it("can perform arithmetic in Julia", () => {
      const a = JuliaComplex.from(1, 2);
      const b = JuliaComplex.from(3, 4);
      const sum = Julia.Base["+"](a, b);
      expect(sum).toBeInstanceOf(JuliaComplex);
      expect((sum as JuliaComplex).re).toBe(4);
      expect((sum as JuliaComplex).im).toBe(6);
    });

    it("can multiply complex numbers", () => {
      // (1 + 2im) * (3 + 4im) = 3 + 4im + 6im + 8i² = 3 + 10im - 8 = -5 + 10im
      const a = JuliaComplex.from(1, 2);
      const b = JuliaComplex.from(3, 4);
      const prod = Julia.Base["*"](a, b);
      expect(prod).toBeInstanceOf(JuliaComplex);
      expect((prod as JuliaComplex).re).toBe(-5);
      expect((prod as JuliaComplex).im).toBe(10);
    });
  });

  describe("special values", () => {
    it("handles zero", () => {
      const c = JuliaComplex.from(0, 0);
      expect(c.abs).toBe(0);
    });

    it("handles pure imaginary", () => {
      const c = JuliaComplex.from(0, 5);
      expect(c.abs).toBe(5);
      expect(c.arg).toBeCloseTo(Math.PI / 2, 10);
    });

    it("handles negative imaginary", () => {
      const c = JuliaComplex.from(0, -5);
      expect(c.arg).toBeCloseTo(-Math.PI / 2, 10);
    });
  });

  describe("type detection in wrapPtr", () => {
    it("Julia function returning Complex is wrapped correctly", () => {
      // Use floats (1.0 + 2.0im) to get ComplexF64
      const func = Julia.eval("() -> 1.0 + 2.0im") as JuliaFunction;
      const result = Julia.call(func);
      expect(result).toBeInstanceOf(JuliaComplex);
      expect((result as JuliaComplex).re).toBe(1);
      expect((result as JuliaComplex).im).toBe(2);
    });

    it("Julia.Base.complex creates Complex", () => {
      // Use non-integer floats to ensure Float64 (3.0 in JS is treated as integer)
      const c = Julia.Base.complex(3.5, 4.5);
      expect(c).toBeInstanceOf(JuliaComplex);
      expect((c as JuliaComplex).value).toEqual({ re: 3.5, im: 4.5 });
    });
  });

  describe("scope compatibility", () => {
    it("Complex is tracked in scope", () => {
      const result = Julia.scope((julia) => {
        // Use non-integer to ensure Float64
        const c = julia.Base.complex(3.5, 4.5);
        return (c as JuliaComplex).abs;
      });
      // sqrt(3.5^2 + 4.5^2) = sqrt(12.25 + 20.25) = sqrt(32.5) ≈ 5.7
      expect(result).toBeCloseTo(Math.sqrt(32.5), 10);
    });
  });
});
