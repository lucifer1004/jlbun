import { beforeAll, describe, expect, test } from "bun:test";
import { Julia, JuliaArray, JuliaFunction, JuliaSubArray } from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => {
  ensureJuliaInitialized();
});

describe("JuliaSubArray", () => {
  describe("Instance method view()", () => {
    test("view with range indices", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.view([1, 3]);
      expect(sub).toBeInstanceOf(JuliaSubArray);
      expect(sub.length).toBe(3);
      expect(sub.value).toEqual(new Float64Array([2, 3, 4]));
    });

    test("view with colon (all elements)", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.view(":");
      expect(sub.length).toBe(5);
      expect(sub.value).toEqual(new Float64Array([1, 2, 3, 4, 5]));
    });

    test("view with single index (extracts single element as 0D view)", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      // Single index creates a scalar view, get value directly
      const element = Julia.Base.getindex(arr, 3);
      expect(element.value).toBe(3);
    });

    test("view with stepped range", () => {
      const arr = JuliaArray.from(
        new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      );
      const sub = arr.view([0, 2, 8]); // 0, 2, 4, 6, 8 (step=2)
      expect(sub.length).toBe(5);
      expect(sub.value).toEqual(new Float64Array([1, 3, 5, 7, 9]));
    });
  });

  describe("Instance method slice()", () => {
    test("slice creates contiguous view", () => {
      const arr = JuliaArray.from(new Float64Array([10, 20, 30, 40, 50]));
      const sub = arr.slice(1, 3);
      expect(sub.length).toBe(3);
      expect(sub.value).toEqual(new Float64Array([20, 30, 40]));
    });
  });

  describe("Nested views (view of view)", () => {
    test("SubArray.view creates nested view", () => {
      const arr = JuliaArray.from(
        new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      );
      const sub1 = arr.view([2, 8]); // [3, 4, 5, 6, 7, 8, 9]
      const sub2 = sub1.view([1, 3]); // [4, 5, 6]
      expect(sub2.length).toBe(3);
      expect(sub2.value).toEqual(new Float64Array([4, 5, 6]));
    });

    test("SubArray.slice creates nested view", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]));
      const sub1 = arr.slice(1, 6); // [2, 3, 4, 5, 6, 7]
      const sub2 = sub1.slice(1, 3); // [3, 4, 5]
      expect(sub2.length).toBe(3);
      expect(sub2.value).toEqual(new Float64Array([3, 4, 5]));
    });

    test("modifications propagate through nested views", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]));
      const sub1 = arr.slice(1, 5); // [2, 3, 4, 5, 6]
      const sub2 = sub1.slice(1, 2); // [3, 4]

      sub2.set(0, 100);

      expect(sub2.get(0).value).toBe(100);
      expect(sub1.get(1).value).toBe(100);
      expect(arr.get(2).value).toBe(100);
    });
  });

  describe("Static methods (still supported)", () => {
    test("JuliaSubArray.view static method works", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = JuliaSubArray.view(arr, [1, 3]);
      expect(sub.length).toBe(3);
    });

    test("JuliaSubArray.slice static method works", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = JuliaSubArray.slice(arr, 1, 3);
      expect(sub.length).toBe(3);
    });
  });

  describe("Type detection in wrapPtr", () => {
    test("Julia @view macro returns JuliaSubArray", () => {
      Julia.eval("test_arr = [1.0, 2.0, 3.0, 4.0, 5.0]");
      const sub = Julia.eval("@view test_arr[2:4]");
      expect(sub).toBeInstanceOf(JuliaSubArray);
    });

    test("Julia view() function returns JuliaSubArray", () => {
      Julia.eval("test_arr2 = [1.0, 2.0, 3.0, 4.0, 5.0]");
      const sub = Julia.eval("view(test_arr2, 2:4)");
      expect(sub).toBeInstanceOf(JuliaSubArray);
    });
  });

  describe("Properties", () => {
    test("parent returns original array", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const parent = sub.parent;
      expect(parent.value).toEqual(new Float64Array([1, 2, 3, 4, 5]));
    });

    test("parentindices returns index mapping", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3); // indices 1..3 (0-based) = Julia 2:4
      const indices = sub.parentindices;
      // parentindices returns a tuple of ranges
      expect(indices).toBeDefined();
    });

    test("ndims", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(0, 2);
      expect(sub.ndims).toBe(1);
    });

    test("size", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      expect(sub.size).toEqual([3]);
    });
  });

  describe("Element access", () => {
    test("get with valid index", () => {
      const arr = JuliaArray.from(new Float64Array([10, 20, 30, 40, 50]));
      const sub = arr.slice(1, 3);
      expect(sub.get(0).value).toBe(20);
      expect(sub.get(1).value).toBe(30);
      expect(sub.get(2).value).toBe(40);
    });

    test("get with invalid index throws", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      expect(() => sub.get(-1)).toThrow(RangeError);
      expect(() => sub.get(3)).toThrow(RangeError);
    });
  });

  describe("Modification propagation", () => {
    test("set propagates to parent", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);

      sub.set(0, 100);

      // Check SubArray
      expect(sub.get(0).value).toBe(100);
      // Check parent
      expect(arr.get(1).value).toBe(100);
    });

    test("fill fills SubArray and propagates to parent", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);

      sub.fill(99);

      expect(sub.value).toEqual(new Float64Array([99, 99, 99]));
      expect(arr.value).toEqual(new Float64Array([1, 99, 99, 99, 5]));
    });
  });

  describe("Copy operations", () => {
    test("copy creates independent array", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const copied = sub.copy();

      expect(copied).toBeInstanceOf(JuliaArray);
      expect(copied.value).toEqual(new Float64Array([2, 3, 4]));

      // Modify copy should not affect original
      copied.set(0, 999);
      expect(arr.get(1).value).toBe(2); // Original unchanged
    });

    test("collect creates contiguous array", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const collected = sub.collect();

      expect(collected).toBeInstanceOf(JuliaArray);
      expect(collected.length).toBe(3);
    });
  });

  describe("Iteration", () => {
    test("iterator", () => {
      const arr = JuliaArray.from(new Float64Array([10, 20, 30, 40, 50]));
      const sub = arr.slice(1, 3);
      const values: number[] = [];
      for (const val of sub) {
        values.push(val.value as number);
      }
      expect(values).toEqual([20, 30, 40]);
    });
  });

  describe("Map operation", () => {
    test("map over SubArray returns JuliaArray", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(0, 2);
      const doubled = sub.map(Julia.eval("x -> 2x"));

      // Verify return type is JuliaArray
      expect(doubled).toBeInstanceOf(JuliaArray);
      expect(doubled.value).toEqual(new Float64Array([2, 4, 6]));

      // Verify it's independent from the original
      doubled.set(0, 100);
      expect(sub.get(0).value).toBe(1); // Original unchanged
    });
  });

  describe("Multi-dimensional SubArrays", () => {
    test("2D array column view", () => {
      // Create 3x4 matrix via Julia
      const matrix = Julia.eval("reshape(Float64.(1:12), 3, 4)") as JuliaArray;
      // Julia stores column-major: [1,2,3,4,5,6,7,8,9,10,11,12]
      // As 3x4 matrix:
      // 1  4  7  10
      // 2  5  8  11
      // 3  6  9  12

      // Get first column (all rows, column 0)
      const col = matrix.view(":", 0);
      expect(col.length).toBe(3);
      expect(col.value).toEqual(new Float64Array([1, 2, 3]));
    });

    test("2D array row view", () => {
      const matrix = Julia.eval("reshape(Float64.(1:12), 3, 4)") as JuliaArray;
      // Get first row (row 0, all columns)
      const row = matrix.view(0, ":");
      expect(row.length).toBe(4);
      expect(row.value).toEqual(new Float64Array([1, 4, 7, 10]));
    });

    test("2D array sub-matrix view", () => {
      const matrix = Julia.eval("reshape(Float64.(1:12), 3, 4)") as JuliaArray;
      // Get 2x2 sub-matrix (rows 0-1, cols 1-2)
      const subMatrix = matrix.view([0, 1], [1, 2]);
      expect(subMatrix.length).toBe(4);
      expect(subMatrix.size).toEqual([2, 2]);
      // Values: [4,5,7,8] (column-major order)
      expect(subMatrix.value).toEqual(new Float64Array([4, 5, 7, 8]));
    });

    test("getAt for 2D SubArray", () => {
      const matrix = Julia.eval("reshape(Float64.(1:12), 3, 4)") as JuliaArray;
      // Get 2x2 sub-matrix (rows 0-1, cols 1-2)
      // Original matrix (column-major):
      // 1  4  7  10
      // 2  5  8  11
      // 3  6  9  12
      // Sub-matrix [0:1, 1:2]:
      // 4  7
      // 5  8
      const subMatrix = matrix.view([0, 1], [1, 2]);
      expect(subMatrix.getAt(0, 0).value).toBe(4);
      expect(subMatrix.getAt(1, 0).value).toBe(5);
      expect(subMatrix.getAt(0, 1).value).toBe(7);
      expect(subMatrix.getAt(1, 1).value).toBe(8);
    });

    test("setAt for 2D SubArray", () => {
      const matrix = Julia.eval("reshape(Float64.(1:12), 3, 4)") as JuliaArray;
      const subMatrix = matrix.view([0, 1], [1, 2]);

      subMatrix.setAt(0, 0, 100);
      subMatrix.setAt(1, 1, 200);

      expect(subMatrix.getAt(0, 0).value).toBe(100);
      expect(subMatrix.getAt(1, 1).value).toBe(200);
      // Changes propagate to parent
      expect(matrix.getAt(0, 1).value).toBe(100);
      expect(matrix.getAt(1, 2).value).toBe(200);
    });

    test("getAt with wrong number of indices throws", () => {
      const matrix = Julia.eval("reshape(Float64.(1:12), 3, 4)") as JuliaArray;
      const subMatrix = matrix.view([0, 1], [1, 2]); // 2D
      expect(() => subMatrix.getAt(0)).toThrow(RangeError);
      expect(() => subMatrix.getAt(0, 0, 0)).toThrow(RangeError);
    });

    test("getAt with out of bounds index throws", () => {
      const matrix = Julia.eval("reshape(Float64.(1:12), 3, 4)") as JuliaArray;
      const subMatrix = matrix.view([0, 1], [1, 2]); // 2x2
      expect(() => subMatrix.getAt(2, 0)).toThrow(RangeError);
      expect(() => subMatrix.getAt(0, 2)).toThrow(RangeError);
      expect(() => subMatrix.getAt(-1, 0)).toThrow(RangeError);
    });

    test("setAt with insufficient arguments throws", () => {
      const matrix = Julia.eval("reshape(Float64.(1:12), 3, 4)") as JuliaArray;
      const subMatrix = matrix.view([0, 1], [1, 2]);
      expect(() => subMatrix.setAt(0)).toThrow(Error);
    });
  });

  describe("toString", () => {
    test("toString returns readable format", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const str = sub.toString();
      expect(str).toContain("JuliaSubArray");
    });
  });

  describe("Element type", () => {
    test("elType preserved from parent", () => {
      const arr = JuliaArray.from(new Int32Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(0, 2);
      expect(sub.elType.isEqual(Julia.Int32)).toBe(true);
    });
  });

  describe("Contiguity", () => {
    test("contiguous slice", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      // Contiguous 1D slice should be contiguous
      expect(sub.isContiguous).toBe(true);
    });

    test("non-contiguous view (stepped)", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]));
      const sub = arr.view([0, 2, 6]); // step=2, non-contiguous
      expect(sub.isContiguous).toBe(false);
    });
  });

  describe("rawPtr", () => {
    test("rawPtr returns pointer for contiguous SubArray", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      expect(sub.isContiguous).toBe(true);
      const ptr = sub.rawPtr;
      expect(ptr).not.toBeNull();
    });

    test("rawPtr returns null for non-contiguous SubArray", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]));
      const sub = arr.view([0, 2, 6]); // step=2, non-contiguous
      expect(sub.isContiguous).toBe(false);
      expect(sub.rawPtr).toBeNull();
    });
  });

  describe("fastValue", () => {
    test("fastValue returns array for contiguous Float64 SubArray", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const fast = sub.fastValue;
      expect(fast).not.toBeNull();
      expect(fast).toEqual([2, 3, 4]);
    });

    test("fastValue returns null for non-contiguous SubArray", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]));
      const sub = arr.view([0, 2, 6]); // step=2, non-contiguous
      expect(sub.fastValue).toBeNull();
    });

    test("fastValue for Int8 SubArray", () => {
      const arr = JuliaArray.from(new Int8Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const fast = sub.fastValue;
      expect(fast).toEqual([2, 3, 4]);
    });

    test("fastValue for UInt8 SubArray", () => {
      const arr = JuliaArray.from(new Uint8Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const fast = sub.fastValue;
      expect(fast).toEqual([2, 3, 4]);
    });

    test("fastValue for Int16 SubArray", () => {
      const arr = JuliaArray.from(new Int16Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const fast = sub.fastValue;
      expect(fast).toEqual([2, 3, 4]);
    });

    test("fastValue for UInt16 SubArray", () => {
      const arr = JuliaArray.from(new Uint16Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const fast = sub.fastValue;
      expect(fast).toEqual([2, 3, 4]);
    });

    test("fastValue for Int32 SubArray", () => {
      const arr = JuliaArray.from(new Int32Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const fast = sub.fastValue;
      expect(fast).toEqual([2, 3, 4]);
    });

    test("fastValue for UInt32 SubArray", () => {
      const arr = JuliaArray.from(new Uint32Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const fast = sub.fastValue;
      expect(fast).toEqual([2, 3, 4]);
    });

    test("fastValue for Float32 SubArray", () => {
      const arr = JuliaArray.from(new Float32Array([1, 2, 3, 4, 5]));
      const sub = arr.slice(1, 3);
      const fast = sub.fastValue;
      expect(fast).toEqual([2, 3, 4]);
    });

    test("fastValue for Int64 SubArray", () => {
      const arr = JuliaArray.from(new BigInt64Array([1n, 2n, 3n, 4n, 5n]));
      const sub = arr.slice(1, 3);
      const fast = sub.fastValue;
      expect(fast).toEqual([2n, 3n, 4n]);
    });

    test("fastValue for UInt64 SubArray", () => {
      const arr = JuliaArray.from(new BigUint64Array([1n, 2n, 3n, 4n, 5n]));
      const sub = arr.slice(1, 3);
      const fast = sub.fastValue;
      expect(fast).toEqual([2n, 3n, 4n]);
    });

    test("fastValue returns null for non-primitive type", () => {
      // Create array of strings (non-primitive)
      Julia.eval('test_str_arr = ["a", "b", "c", "d", "e"]');
      const sub = Julia.eval("@view test_str_arr[2:4]") as JuliaSubArray;
      expect(sub.fastValue).toBeNull();
    });
  });

  describe("Type detection in wrapPtr", () => {
    test("Julia function returning SubArray is correctly wrapped", () => {
      const getSubArray = Julia.eval(`
        function get_subarray_test(arr)
          return @view arr[2:4]
        end
      `) as JuliaFunction;
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));
      const result = Julia.call(getSubArray, arr);

      expect(result).toBeInstanceOf(JuliaSubArray);
      expect((result as JuliaSubArray).length).toBe(3);
      expect(Julia.Base.sum(result!).value).toBe(9);
    });

    test("Julia.Base.view returns JuliaSubArray", () => {
      const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]));
      const range = Julia.Base.UnitRange(3, 6);
      const sub = Julia.Base.view(arr, range);

      expect(sub).toBeInstanceOf(JuliaSubArray);
      expect((sub as JuliaSubArray).length).toBe(4);
    });
  });
});
