import { beforeAll, describe, expect, it } from "bun:test";
import { Julia, JuliaArray, UnknownJuliaError } from "../index.js";
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
