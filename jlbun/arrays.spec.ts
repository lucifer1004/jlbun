import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Julia, JuliaArray } from "./index.js";

beforeAll(() => Julia.init());
afterAll(() => Julia.close());

describe("JuliaArray", () => {
  it("can be created from Julia", () => {
    const arr = JuliaArray.init(Julia.Int64, 10);
    expect(arr.length).toBe(10);
    expect(arr.ndims).toBe(1);
    expect(arr.size).toEqual([10]);

    arr.fill(10);
    expect(arr.get(0).value).toBe(10n);

    arr.set(5, 20n);
    expect(arr.get(5).value).toBe(20n);

    arr.reverse();
    expect(arr.get(4).value).toBe(20n);
    expect(arr.get(9).value).toBe(10n);
    expect(arr.toString()).toBe("[10, 10, 10, 10, 20, 10, 10, 10, 10, 10]");

    const reshapedArr = arr.reshape(2, 5);
    expect(reshapedArr.length).toBe(10);
    expect(reshapedArr.ndims).toBe(2);
    expect(reshapedArr.size).toEqual([2, 5]);

    const bunArr = reshapedArr.rawValue;
    expect(bunArr).toEqual(
      new BigInt64Array([10n, 10n, 10n, 10n, 20n, 10n, 10n, 10n, 10n, 10n]),
    );
  });
});
