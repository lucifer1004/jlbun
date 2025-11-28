import { beforeAll, describe, expect, it } from "bun:test";
import {
  Julia,
  JuliaAny,
  JuliaBool,
  JuliaChar,
  JuliaFloat32,
  JuliaFloat64,
  JuliaInt8,
  JuliaInt16,
  JuliaInt32,
  JuliaInt64,
  JuliaString,
  JuliaSymbol,
  JuliaUInt8,
  JuliaUInt16,
  JuliaUInt32,
  JuliaUInt64,
} from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

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

describe("JuliaAny", () => {
  it("is a fallback for unknown types", () => {
    const one = JuliaInt32.from(1);
    const myAny = new JuliaAny(one.ptr);
    expect(myAny.value).toBe("[JuliaValue 1]");
  });
});

describe("JuliaDataType methods", () => {
  it("isEqual compares data types correctly", () => {
    expect(Julia.Int64.isEqual(Julia.Int64)).toBe(true);
    expect(Julia.Int64.isEqual(Julia.Float64)).toBe(false);
  });

  it("toString returns formatted string", () => {
    expect(Julia.Int64.toString()).toBe("[JuliaDataType Int64]");
    expect(Julia.Float64.toString()).toBe("[JuliaDataType Float64]");
  });

  it("value getter returns the type name", () => {
    expect(Julia.Int64.value).toBe("Int64");
    expect(Julia.String.value).toBe("String");
  });
});
