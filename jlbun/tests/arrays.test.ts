import { beforeAll, describe, expect, it } from "bun:test";
import { Julia, JuliaArray, MethodError, UnknownJuliaError } from "../index.js";
import { canResizeSharedBuffers, ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

describe("JuliaArray", () => {
  it("can be created from Julia", () => {
    const arr = JuliaArray.init(Julia.Int64, 10);
    expect(arr.length).toBe(10);
    expect(arr.ndims).toBe(1);
    expect(arr.size).toEqual([10]);

    arr.fill(10);
    expect(arr.get(0).value).toBe(10n);
    expect(() => arr.get(10)).toThrow(RangeError);

    arr.set(5, 20n);
    expect(arr.get(5).value).toBe(20n);

    arr.reverse();
    expect(arr.get(4).value).toBe(20n);
    expect(arr.get(9).value).toBe(10n);
    expect(arr.toString()).toBe(
      "[JuliaArray [10, 10, 10, 10, 20, 10, 10, 10, 10, 10]]",
    );

    expect(arr.pop()?.value).toBe(10n);
    expect(arr.pop()?.value).toBe(10n);
    expect(arr.pop()?.value).toBe(10n);
    expect(arr.pop()?.value).toBe(10n);
    expect(arr.pop()?.value).toBe(10n);
    expect(arr.pop()?.value).toBe(20n);

    expect(arr.push(2, 3, 4, 5)).toBe(4);
    expect(arr.length).toBe(8);
    expect(arr.value).toEqual(
      new BigInt64Array([10n, 10n, 10n, 10n, 2n, 3n, 4n, 5n]),
    );

    const reshapedArr = arr.reshape(2, 4);
    expect(reshapedArr.length).toBe(8);
    expect(reshapedArr.ndims).toBe(2);
    expect(reshapedArr.size).toEqual([2, 4]);

    const bunArr = reshapedArr.value;
    expect(bunArr).toEqual(
      new BigInt64Array([10n, 10n, 10n, 10n, 2n, 3n, 4n, 5n]),
    );
  });

  it("can be created from JS", () => {
    const rawArr = new Int32Array(10);
    const arr = JuliaArray.from(rawArr);
    expect(arr.length).toBe(10);
    expect(arr.ndims).toBe(1);
    expect(arr.size).toEqual([10]);

    arr.fill(10);
    expect(arr.get(0).value).toBe(10);

    arr.set(5, 20);
    expect(arr.get(5).value).toBe(20);

    arr.reverse();
    expect(arr.get(4).value).toBe(20);
    expect(arr.get(9).value).toBe(10);
    expect(arr.toString()).toBe(
      "[JuliaArray Int32[10, 10, 10, 10, 20, 10, 10, 10, 10, 10]]",
    );

    // Pop/Push behaviour depends on Julia version (>=1.11 allows resizing shared buffers)
    if (canResizeSharedBuffers()) {
      expect(arr.pop()?.value).toBe(10);
      arr.push(30);
      expect(arr.pop()?.value).toBe(30);

      const reshapedArr = arr.reshape(3, 3);
      expect(reshapedArr.length).toBe(9);
      expect(reshapedArr.ndims).toBe(2);
      expect(reshapedArr.size).toEqual([3, 3]);
      expect(reshapedArr.value).toEqual(
        new Int32Array([10, 10, 10, 10, 20, 10, 10, 10, 10]),
      );

      expect(rawArr).toEqual(
        new Int32Array([10, 10, 10, 10, 20, 10, 10, 10, 10, 30]),
      );
    } else {
      expect(() => arr.pop()).toThrow(UnknownJuliaError);
      expect(() => arr.push(10)).toThrow(UnknownJuliaError);

      const reshapedArr = arr.reshape(2, 5);
      expect(reshapedArr.length).toBe(10);
      expect(reshapedArr.ndims).toBe(2);
      expect(reshapedArr.size).toEqual([2, 5]);
      expect(reshapedArr.value).toEqual(
        new Int32Array([10, 10, 10, 10, 20, 10, 10, 10, 10, 10]),
      );

      expect(rawArr).toEqual(
        new Int32Array([10, 10, 10, 10, 20, 10, 10, 10, 10, 10]),
      );
    }
  });

  it("can be a general Julia array", () => {
    const arr = Julia.eval('[1, 2, "hello"]');
    const bunArr = arr.value;
    expect(bunArr).toEqual([1n, 2n, "hello"]);
  });
});

describe("JuliaArray multi-dimensional", () => {
  it("can create 2D arrays directly", () => {
    const matrix = JuliaArray.init(Julia.Float64, 3, 4);
    expect(matrix.ndims).toBe(2);
    expect(matrix.size).toEqual([3, 4]);
    expect(matrix.length).toBe(12);

    // Fill and verify
    Julia.Base["fill!"](matrix, 1.5);
    expect(matrix.get(0).value).toBe(1.5);
    expect(matrix.get(11).value).toBe(1.5);
  });

  it("can create 3D arrays directly", () => {
    const tensor = JuliaArray.init(Julia.Int32, 2, 3, 4);
    expect(tensor.ndims).toBe(3);
    expect(tensor.size).toEqual([2, 3, 4]);
    expect(tensor.length).toBe(24);

    // Fill and verify
    Julia.Base["fill!"](tensor, 42);
    expect(tensor.get(0).value).toBe(42);
    expect(tensor.get(23).value).toBe(42);
  });

  it("can create 4D+ arrays using jl_alloc_array_nd", () => {
    const arr4d = JuliaArray.init(Julia.Float32, 2, 3, 4, 5);
    expect(arr4d.ndims).toBe(4);
    expect(arr4d.size).toEqual([2, 3, 4, 5]);
    expect(arr4d.length).toBe(120);

    // Fill and verify
    Julia.Base["fill!"](arr4d, 3.14);
    expect(arr4d.get(0).value).toBeCloseTo(3.14, 2);
    expect(arr4d.get(119).value).toBeCloseTo(3.14, 2);
  });

  it("throws error when no dimensions provided", () => {
    expect(() => JuliaArray.init(Julia.Float64)).toThrow(MethodError);
  });

  it("works with scoped arrays", () => {
    const result = Julia.scope((julia) => {
      // Create 2D array in scope
      const matrix = julia.Array.init(julia.Float64, 5, 5);
      // Use rand() to generate random values and fill
      const randMatrix = julia.Base.rand(5, 5);
      julia.Base["copyto!"](matrix, randMatrix);

      // Matrix multiplication
      const product = julia.Base["*"](matrix, matrix);
      return julia.Base.sum(product).value;
    });

    // Result should be a number (sum of matrix multiplication result)
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThan(0);
  });

  it("supports common matrix operations", () => {
    // Import LinearAlgebra first
    const LinearAlgebra = Julia.import("LinearAlgebra");

    const matrix = JuliaArray.init(Julia.Float64, 3, 3);

    // Fill with identity-like pattern using Julia
    Julia.Base["fill!"](matrix, 0.0);
    matrix.set(0, 1.0); // [0,0]
    matrix.set(4, 1.0); // [1,1]
    matrix.set(8, 1.0); // [2,2]

    // Compute trace
    const trace = LinearAlgebra.tr(matrix);
    expect(trace.value).toBe(3.0);

    // Compute determinant
    const det = LinearAlgebra.det(matrix);
    expect(det.value).toBe(1.0);
  });

  it("supports getAt and setAt for multi-dimensional indexing", () => {
    // Test 2D array (matrix)
    const matrix = JuliaArray.init(Julia.Float64, 3, 4); // 3 rows, 4 cols
    Julia.Base["fill!"](matrix, 0.0);

    // Set using multi-dimensional indices
    matrix.setAt(0, 0, 1.0); // row 0, col 0
    matrix.setAt(1, 0, 2.0); // row 1, col 0
    matrix.setAt(2, 0, 3.0); // row 2, col 0
    matrix.setAt(0, 1, 4.0); // row 0, col 1
    matrix.setAt(2, 3, 12.0); // row 2, col 3 (last element)

    // Verify with getAt
    expect(matrix.getAt(0, 0).value).toBe(1.0);
    expect(matrix.getAt(1, 0).value).toBe(2.0);
    expect(matrix.getAt(2, 0).value).toBe(3.0);
    expect(matrix.getAt(0, 1).value).toBe(4.0);
    expect(matrix.getAt(2, 3).value).toBe(12.0);

    // Verify column-major order: first column should be [1, 2, 3]
    expect(matrix.get(0).value).toBe(1.0); // (0,0)
    expect(matrix.get(1).value).toBe(2.0); // (1,0)
    expect(matrix.get(2).value).toBe(3.0); // (2,0)
    expect(matrix.get(3).value).toBe(4.0); // (0,1) - next column starts
  });

  it("supports getAt and setAt for 3D arrays", () => {
    const tensor = JuliaArray.init(Julia.Int32, 2, 3, 4); // 2x3x4 tensor
    Julia.Base["fill!"](tensor, 0);

    // Set corners
    tensor.setAt(0, 0, 0, 1);
    tensor.setAt(1, 2, 3, 24); // Last element

    expect(tensor.getAt(0, 0, 0).value).toBe(1);
    expect(tensor.getAt(1, 2, 3).value).toBe(24);

    // Verify linear indexing matches column-major order
    expect(tensor.get(0).value).toBe(1); // (0,0,0)
    expect(tensor.get(23).value).toBe(24); // (1,2,3) = 1 + 2*2 + 3*2*3 = 1 + 4 + 18 = 23
  });

  it("throws RangeError for invalid indices in getAt/setAt", () => {
    const matrix = JuliaArray.init(Julia.Float64, 3, 4);

    // Wrong number of indices
    expect(() => matrix.getAt(0)).toThrow(RangeError);
    expect(() => matrix.getAt(0, 0, 0)).toThrow(RangeError);

    // Out of bounds
    expect(() => matrix.getAt(3, 0)).toThrow(RangeError); // row 3 doesn't exist
    expect(() => matrix.getAt(0, 4)).toThrow(RangeError); // col 4 doesn't exist
    expect(() => matrix.getAt(-1, 0)).toThrow(RangeError); // negative index

    // setAt with wrong args
    expect(() => matrix.setAt(0)).toThrow(MethodError); // no value
  });
});
