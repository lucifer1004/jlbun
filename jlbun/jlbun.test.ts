import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  Julia,
  JuliaArray,
  JuliaNamedTuple,
  JuliaPair,
  JuliaTuple,
} from "./index.js";

beforeAll(() => Julia.init({ project: null }));
afterAll(() => Julia.close());

describe("Julia", () => {
  it("can import modules", () => {
    Julia.import("Printf");
    expect(Julia.eval('Printf.@sprintf "%d %.2f" 10 2').value).toBe("10 2.00");
  });

  it("can call functions of imported modules", () => {
    const Dates = Julia.import("Dates");
    expect(Dates.monthname(1).value).toBe("January");
  });
});

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
    expect(arr.toString()).toBe(
      "[JuliaArray [10, 10, 10, 10, 20, 10, 10, 10, 10, 10]]",
    );

    const reshapedArr = arr.reshape(2, 5);
    expect(reshapedArr.length).toBe(10);
    expect(reshapedArr.ndims).toBe(2);
    expect(reshapedArr.size).toEqual([2, 5]);

    const bunArr = reshapedArr.value;
    expect(bunArr).toEqual(
      new BigInt64Array([10n, 10n, 10n, 10n, 20n, 10n, 10n, 10n, 10n, 10n]),
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

    const reshapedArr = arr.reshape(2, 5);
    expect(reshapedArr.length).toBe(10);
    expect(reshapedArr.ndims).toBe(2);
    expect(reshapedArr.size).toEqual([2, 5]);

    expect(rawArr).toEqual(
      new Int32Array([10, 10, 10, 10, 20, 10, 10, 10, 10, 10]),
    );
  });

  it("can be a general Julia array", () => {
    const arr = Julia.eval('[1, 2, "hello"]');
    const bunArr = arr.value;
    expect(bunArr).toEqual([1n, 2n, "hello"]);
  });
});

describe("JuliaPair", () => {
  it("can be created from Julia", () => {
    const pair = Julia.eval('2 => "hello"') as JuliaPair;
    expect(pair.first.value).toBe(2n);
    expect(pair.second.value).toBe("hello");
    expect(pair.toString()).toBe('2 => "hello"');
  });

  it("can be created from JS", () => {
    const pair = JuliaPair.from(10n, 20n);
    expect(pair.first.value).toBe(10n);
    expect(pair.second.value).toBe(20n);
    expect(pair.toString()).toBe("10 => 20");
  });
});

describe("JuliaTuple", () => {
  it("can be created from Julia", () => {
    const tuple = Julia.eval("(1, 2, 3)") as JuliaTuple;
    expect(tuple.get(0).value).toBe(1n);
    expect(tuple.get(1).value).toBe(2n);
    expect(tuple.get(2).value).toBe(3n);
    expect(tuple.toString()).toBe("(1, 2, 3)");
  });

  it("can be created from JS", () => {
    const tuple = JuliaTuple.from(1, 2, "hello");
    expect(tuple.get(0).value).toBe(1n);
    expect(tuple.get(1).value).toBe(2n);
    expect(tuple.get(2).value).toBe("hello");
    expect(tuple.toString()).toBe('(1, 2, "hello")');
  });
});

describe("JuliaNamedTuple", () => {
  it("can be created from Julia", () => {
    const tuple = Julia.eval("(a = 1, b = 2, c = 3)") as JuliaNamedTuple;
    expect(tuple.fieldNames).toEqual(["a", "b", "c"]);
    expect(tuple.get(0).value).toBe(1n);
    expect(tuple.get(1).value).toBe(2n);
    expect(tuple.get(2).value).toBe(3n);
    expect(tuple.toString()).toBe("(a = 1, b = 2, c = 3)");
  });

  it("can be created from JS", () => {
    const tuple = JuliaNamedTuple.from({ a: 1, b: 2, c: "hello" });
    expect(tuple.get(0).value).toBe(1n);
    expect(tuple.get(1).value).toBe(2n);
    expect(tuple.get(2).value).toBe("hello");
    expect(tuple.toString()).toBe('(a = 1, b = 2, c = "hello")');
  });
});