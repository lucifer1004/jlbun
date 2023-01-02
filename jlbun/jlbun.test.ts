import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  Julia,
  JuliaArray,
  JuliaBool,
  JuliaChar,
  JuliaDict,
  JuliaFloat32,
  JuliaFloat64,
  JuliaFunction,
  JuliaInt8,
  JuliaInt16,
  JuliaInt32,
  JuliaInt64,
  JuliaNamedTuple,
  JuliaPair,
  JuliaSet,
  JuliaString,
  JuliaSymbol,
  JuliaTask,
  JuliaTuple,
  JuliaUInt8,
  JuliaUInt16,
  JuliaUInt32,
  JuliaUInt64,
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

  it("supports tag template strings", () => {
    const hello = "hello";
    const world = ["w", "o", "r", "l", "d"];
    expect(Julia.tagEval`" "`.value).toBe(" ");
    expect(Julia.tagEval`${hello} * " " * join(${world})`.value).toBe(
      "hello world",
    );

    expect(Julia.tagEval`${{ foo: 1, bar: 2 }}`.value).toEqual({
      foo: 1n,
      bar: 2n,
    });
  });
});

describe("JuliaInt8", () => {
  it("can be created from Julia", () => {
    const int8 = Julia.eval("Int8(10)");
    expect(int8.value).toBe(10);
    expect(int8.toString()).toBe("10");
  });

  it("can be created from JS", () => {
    const int8 = JuliaInt8.from(10);
    expect(int8.value).toBe(10);
    expect(int8.toString()).toBe("10");
  });
});

describe("JuliaUInt8", () => {
  it("can be created from Julia", () => {
    const uint8 = Julia.eval("UInt8(10)");
    expect(uint8.value).toBe(10);
    expect(uint8.toString()).toBe("10");
  });

  it("can be created from JS", () => {
    const uint8 = JuliaUInt8.from(10);
    expect(uint8.value).toBe(10);
    expect(uint8.toString()).toBe("10");
  });
});

describe("JuliaInt16", () => {
  it("can be created from Julia", () => {
    const int16 = Julia.eval("Int16(10)");
    expect(int16.value).toBe(10);
    expect(int16.toString()).toBe("10");
  });

  it("can be created from JS", () => {
    const int16 = JuliaInt16.from(10);
    expect(int16.value).toBe(10);
    expect(int16.toString()).toBe("10");
  });
});

describe("JuliaUInt16", () => {
  it("can be created from Julia", () => {
    const uint16 = Julia.eval("UInt16(10)");
    expect(uint16.value).toBe(10);
    expect(uint16.toString()).toBe("10");
  });

  it("can be created from JS", () => {
    const uint16 = JuliaUInt16.from(10);
    expect(uint16.value).toBe(10);
    expect(uint16.toString()).toBe("10");
  });
});

describe("JuliaInt32", () => {
  it("can be created from Julia", () => {
    const int32 = Julia.eval("Int32(10)");
    expect(int32.value).toBe(10);
    expect(int32.toString()).toBe("10");
  });

  it("can be created from JS", () => {
    const int32 = JuliaInt32.from(10);
    expect(int32.value).toBe(10);
    expect(int32.toString()).toBe("10");
  });
});

describe("JuliaUInt32", () => {
  it("can be created from Julia", () => {
    const uint32 = Julia.eval("UInt32(10)");
    expect(uint32.value).toBe(10);
    expect(uint32.toString()).toBe("10");
  });

  it("can be created from JS", () => {
    const uint32 = JuliaUInt32.from(10);
    expect(uint32.value).toBe(10);
    expect(uint32.toString()).toBe("10");
  });
});

describe("JuliaInt64", () => {
  it("can be created from Julia", () => {
    const int64 = Julia.eval("Int64(10)");
    expect(int64.value).toBe(10n);
    expect(int64.toString()).toBe("10");
  });

  it("can be created from JS", () => {
    const int64 = JuliaInt64.from(10);
    expect(int64.value).toBe(10n);
    expect(int64.toString()).toBe("10");
  });

  it("can be created from JS with BigInt", () => {
    const uint64 = JuliaInt64.from(10n);
    expect(uint64.value).toBe(10n);
    expect(uint64.toString()).toBe("10");
  });
});

describe("JuliaUInt64", () => {
  it("can be created from Julia", () => {
    const uint64 = Julia.eval("UInt64(10)");
    expect(uint64.value).toBe(10n);
    expect(uint64.toString()).toBe("10");
  });

  it("can be created from JS", () => {
    const uint64 = JuliaUInt64.from(10);
    expect(uint64.value).toBe(10n);
    expect(uint64.toString()).toBe("10");
  });

  it("can be created from JS with BigInt", () => {
    const uint64 = JuliaUInt64.from(10n);
    expect(uint64.value).toBe(10n);
    expect(uint64.toString()).toBe("10");
  });
});

describe("JuliaFloat32", () => {
  it("can be created from Julia", () => {
    const float32 = Julia.eval("Float32(10)");
    expect(float32.value).toBe(10);
    expect(float32.toString()).toBe("10.0");
  });

  it("can be created from JS", () => {
    const float32 = JuliaFloat32.from(10);
    expect(float32.value).toBe(10);
    expect(float32.toString()).toBe("10.0");
  });
});

describe("JuliaFloat64", () => {
  it("can be created from Julia", () => {
    const float64 = Julia.eval("Float64(10)");
    expect(float64.value).toBe(10);
    expect(float64.toString()).toBe("10.0");
  });

  it("can be created from JS", () => {
    const float64 = JuliaFloat64.from(10);
    expect(float64.value).toBe(10);
    expect(float64.toString()).toBe("10.0");
  });
});

describe("JuliaString", () => {
  it("can be created from Julia", () => {
    const str = Julia.eval('"hello"');
    expect(str.value).toBe("hello");
    expect(str.toString()).toBe("hello");
  });

  it("can be created from JS", () => {
    const str = JuliaString.from("hello");
    expect(str.value).toBe("hello");
    expect(str.toString()).toBe("hello");
  });
});

describe("JuliaBool", () => {
  it("can be created from Julia", () => {
    const t = Julia.eval("true");
    expect(t.value).toBe(true);
    expect(t.toString()).toBe("true");

    const f = Julia.eval("false");
    expect(f.value).toBe(false);
    expect(f.toString()).toBe("false");
  });

  it("can be created from JS", () => {
    const t = JuliaBool.from(true);
    expect(t.value).toBe(true);
    expect(t.toString()).toBe("true");

    const f = JuliaBool.from(false);
    expect(f.value).toBe(false);
    expect(f.toString()).toBe("false");
  });
});

describe("JuliaChar", () => {
  it("can be created from Julia", () => {
    const char = Julia.eval("'a'");
    expect(char.value).toBe("a");
    expect(char.toString()).toBe("a");

    const char2 = Julia.eval("'我'");
    expect(char2.value).toBe("我");
    expect(char2.toString()).toBe("我");
  });

  it("can be created from JS", () => {
    const char = JuliaChar.from("a");
    expect(char.value).toBe("a");
    expect(char.toString()).toBe("a");

    const char2 = JuliaChar.from("我");
    expect(char2.value).toBe("我");
    expect(char2.toString()).toBe("我");
  });
});

describe("JuliaSymbol", () => {
  it("can be created from Julia", () => {
    const symbol = Julia.eval(":hello");
    expect(symbol.value).toBe(Symbol.for("hello"));
    expect(symbol.toString()).toBe("hello");
  });

  it("can be created from JS", () => {
    const symbol = JuliaSymbol.from("hello");
    expect(symbol.value).toBe(Symbol.for("hello"));
    expect(symbol.toString()).toBe("hello");
  });

  it("can be created from JS symbols", () => {
    const symbol = JuliaSymbol.from(Symbol.for("hello"));
    expect(symbol.value).toBe(Symbol.for("hello"));
    expect(symbol.toString()).toBe("hello");
  });
});

describe("JuliaNothing", () => {
  it("can be created from Julia", () => {
    const nothing = Julia.eval("nothing");
    expect(nothing.value).toBe(null);
    expect(nothing.toString()).toBe("nothing");
  });
});

describe("JuliaFunction", () => {
  it("can be called with keyword arguments", () => {
    const arr = JuliaArray.from(new Int32Array([1, 5, 4, 2, 3]));
    Julia.Base["sort!"](arr);
    expect(arr.value).toEqual(new Int32Array([1, 2, 3, 4, 5]));

    Julia.callWithKwargs(Julia.Base["sort!"], { rev: true }, arr);
    expect(arr.value).toEqual(new Int32Array([5, 4, 3, 2, 1]));
  });

  it("can be called with multiple keyword arguments", () => {
    const arr = JuliaArray.from(new Int32Array([1, 10, 20, 30, 100]));
    Julia.Base["sort!"].callWithKwargs(
      { by: Julia.Base.string, rev: true },
      arr,
    );

    expect(arr.value).toEqual(new Int32Array([30, 20, 100, 10, 1]));
  });

  it("can have many positional and keyword arguments", () => {
    const f1_0 = Julia.eval("x -> 2x") as JuliaFunction;
    expect(f1_0(10).value).toBe(20n);

    const f0_1 = Julia.eval("(;a) -> 2a") as JuliaFunction;
    expect(f0_1.callWithKwargs({ a: 10 }).value).toBe(20n);

    const f1_1 = Julia.eval("(x; a) -> x * a") as JuliaFunction;
    expect(f1_1.callWithKwargs({ a: 10 }, 2).value).toBe(20n);

    const f2_0 = Julia.eval("(x, y) -> x + y") as JuliaFunction;
    expect(f2_0(10, 20).value).toBe(30n);

    const f2_1 = Julia.eval("(x, y; a) -> (x + y) * a") as JuliaFunction;
    expect(f2_1.callWithKwargs({ a: 10 }, 2, 3).value).toBe(50n);

    const f3_3 = Julia.eval(
      "(x, y, z; a, b, c) -> (x + y + z) * (a + b + c)",
    ) as JuliaFunction;
    expect(f3_3.callWithKwargs({ a: 1, b: 2, c: 3 }, 1, 2, 3).value).toBe(36n);
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
    expect(tuple.length).toBe(3);
    expect(tuple.toString()).toBe("(1, 2, 3)");
  });

  it("can be created from JS", () => {
    const tuple = JuliaTuple.from(1, 2, "hello");
    expect(tuple.get(0).value).toBe(1n);
    expect(tuple.get(1).value).toBe(2n);
    expect(tuple.get(2).value).toBe("hello");
    expect(tuple.length).toBe(3);
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
    expect(tuple.length).toBe(3);
    expect(tuple.toString()).toBe("(a = 1, b = 2, c = 3)");
  });

  it("can be created from JS", () => {
    const tuple = JuliaNamedTuple.from({ a: 1, b: 2, c: "hello" });
    expect(tuple.get(0).value).toBe(1n);
    expect(tuple.get(1).value).toBe(2n);
    expect(tuple.get(2).value).toBe("hello");
    expect(tuple.length).toBe(3);
    expect(tuple.toString()).toBe('(a = 1, b = 2, c = "hello")');
  });
});

describe("JuliaSet", () => {
  it("can be created from Julia", () => {
    const set = Julia.eval("Set([1, 2, 3])") as JuliaSet;
    expect(set.size).toBe(3);
    expect(set.has(1)).toBe(true);
    expect(set.has(2)).toBe(true);
    expect(set.has(3)).toBe(true);
    expect(set.has(4)).toBe(false);
    expect(set.value).toEqual(new Set([1n, 2n, 3n]));

    expect(set.delete(2)).toBe(true);
    expect(set.delete(4)).toBe(false);
    expect(set.size).toBe(2);
    expect(set.has(1)).toBe(true);
    expect(set.has(2)).toBe(false);
    expect(set.has(3)).toBe(true);
    expect(set.has(4)).toBe(false);
    expect(set.value).toEqual(new Set([1n, 3n]));

    set.add(4);
    expect(set.size).toBe(3);
    expect(set.has(1)).toBe(true);
    expect(set.has(2)).toBe(false);
    expect(set.has(3)).toBe(true);
    expect(set.has(4)).toBe(true);
    expect(set.value).toEqual(new Set([1n, 3n, 4n]));
  });

  it("can be created from JS", () => {
    const set = JuliaSet.from([1n, 2n, 3n]);
    expect(set.size).toBe(3);
    expect(set.has(1)).toBe(true);
    expect(set.has(2)).toBe(true);
    expect(set.has(3)).toBe(true);
    expect(set.has(4)).toBe(false);
    expect(set.value).toEqual(new Set([1n, 2n, 3n]));

    expect(set.delete(2)).toBe(true);
    expect(set.delete(4)).toBe(false);
    expect(set.size).toBe(2);
    expect(set.has(1)).toBe(true);
    expect(set.has(2)).toBe(false);
    expect(set.has(3)).toBe(true);
    expect(set.has(4)).toBe(false);
    expect(set.value).toEqual(new Set([1n, 3n]));

    set.add(4);
    expect(set.size).toBe(3);
    expect(set.has(1)).toBe(true);
    expect(set.has(2)).toBe(false);
    expect(set.has(3)).toBe(true);
    expect(set.has(4)).toBe(true);
    expect(set.value).toEqual(new Set([1n, 3n, 4n]));
  });
});

describe("JuliaDict", () => {
  it("can be created from Julia", () => {
    const dict = Julia.eval(
      'Dict{String, Any}("a" => 1, "b" => 2)',
    ) as JuliaDict;
    expect(dict.size).toBe(2);
    expect(dict.has("a")).toBe(true);
    expect(dict.has("b")).toBe(true);
    expect(dict.has("c")).toBe(false);
    expect(dict.get("a").value).toBe(1n);
    expect(dict.get("b").value).toBe(2n);
    expect(dict.get("c").value).toBe(null);
    expect(dict.value).toEqual(
      new Map([
        ["a", 1n],
        ["b", 2n],
      ]),
    );

    expect(dict.delete("a")).toBe(true);
    expect(dict.delete("c")).toBe(false);
    expect(dict.size).toBe(1);
    expect(dict.has("a")).toBe(false);
    expect(dict.has("b")).toBe(true);
    expect(dict.has("c")).toBe(false);
    expect(dict.get("a").value).toBe(null);
    expect(dict.get("b").value).toBe(2n);
    expect(dict.get("c").value).toBe(null);
    expect(dict.value).toEqual(new Map([["b", 2n]]));

    dict.set("b", 3);
    expect(dict.size).toBe(1);
    expect(dict.get("b").value).toBe(3n);
    expect(dict.value).toEqual(new Map([["b", 3n]]));

    dict.set("c", "hello");
    expect(dict.size).toBe(2);
    expect(dict.get("c").value).toBe("hello");
    expect(dict.value).toEqual(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new Map<string, any>([
        ["b", 3n],
        ["c", "hello"],
      ]),
    );
  });

  it("can be created from JS", () => {
    const dict = JuliaDict.from([
      ["a", 1n],
      ["b", 2n],
    ]);
    expect(dict.size).toBe(2);
    expect(dict.has("a")).toBe(true);
    expect(dict.has("b")).toBe(true);
    expect(dict.has("c")).toBe(false);
    expect(dict.get("a").value).toBe(1n);
    expect(dict.get("b").value).toBe(2n);
    expect(dict.get("c").value).toBe(null);
    expect(dict.value).toEqual(
      new Map([
        ["a", 1n],
        ["b", 2n],
      ]),
    );

    expect(dict.delete("a")).toBe(true);
    expect(dict.delete("c")).toBe(false);
    expect(dict.size).toBe(1);
    expect(dict.has("a")).toBe(false);
    expect(dict.has("b")).toBe(true);
    expect(dict.has("c")).toBe(false);
    expect(dict.get("a").value).toBe(null);
    expect(dict.get("b").value).toBe(2n);
    expect(dict.get("c").value).toBe(null);
    expect(dict.value).toEqual(new Map([["b", 2n]]));

    dict.set("b", 3);
    expect(dict.size).toBe(1);
    expect(dict.get("b").value).toBe(3n);
    expect(dict.value).toEqual(new Map([["b", 3n]]));

    dict.set("c", "hello");
    expect(dict.size).toBe(2);
    expect(dict.get("c").value).toBe("hello");
    expect(dict.value).toEqual(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new Map<string, any>([
        ["b", 3n],
        ["c", "hello"],
      ]),
    );
  });
});

describe("JuliaTask", () => {
  it("can be created from Julia", async () => {
    const task = Julia.eval("Task(() -> sum(i for i in 1:100))") as JuliaTask;
    const promise = task.value;
    expect((await promise).value).toBe(5050n);
  });

  it("can be created from JS", async () => {
    const func = Julia.wrapFunctionCall(
      Julia.Base.sum,
      {},
      new Int32Array([1, 2, 3]),
    );
    const task = JuliaTask.from(func);
    expect((await task.value).value).toBe(6n);

    const func2 = Julia.wrapFunctionCall(Julia.Base.sort, { rev: true }, [
      "foo",
      "bar",
      "hello",
    ]);
    const task2 = JuliaTask.from(func2);
    expect((await task2.value).value).toEqual(["hello", "foo", "bar"]);
  });

  it("can be scheduled to different threads", async () => {
    const func = Julia.eval("() -> sum(i for i in 1:100)") as JuliaFunction;
    const nthreads = Julia.nthreads;
    const promises = [];
    for (let i = 0; i < nthreads; i++) {
      promises.push(JuliaTask.from(func).schedule(i).value);
    }
    const results = (await Promise.all(promises)).map((x) => x.value);
    expect(results).toEqual(new Array(nthreads).fill(5050n));
  });
});
