import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
  Julia,
  JuliaArray,
  JuliaBool,
  JuliaChar,
  JuliaFloat32,
  JuliaFloat64,
  JuliaInt8,
  JuliaInt16,
  JuliaInt32,
  JuliaInt64,
  JuliaNamedTuple,
  JuliaPair,
  JuliaString,
  JuliaSymbol,
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
