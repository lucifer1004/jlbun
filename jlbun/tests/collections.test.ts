import { beforeAll, describe, expect, it } from "bun:test";
import {
  Julia,
  JuliaDict,
  JuliaIdDict,
  JuliaNamedTuple,
  JuliaPair,
  JuliaSet,
  JuliaTuple,
} from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

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
    expect(() => tuple.get(3)).toThrow(RangeError);
    expect(tuple.length).toBe(3);
    expect(tuple.value).toEqual([1n, 2n, 3n]);
    expect(tuple.toString()).toBe("(1, 2, 3)");
  });

  it("can be created from JS", () => {
    const tuple = JuliaTuple.from(1, 2, "hello");
    expect(tuple.get(0).value).toBe(1n);
    expect(tuple.get(1).value).toBe(2n);
    expect(tuple.get(2).value).toBe("hello");
    expect(tuple.length).toBe(3);
    expect(tuple.value).toEqual([1n, 2n, "hello"]);
    expect(tuple.toString()).toBe('(1, 2, "hello")');
  });
});

describe("JuliaNamedTuple", () => {
  // TODO: find a proper way to keep the tuples alive
  it("can be created from Julia", () => {
    const tuple = () => Julia.eval("(a = 1, b = 2, c = 3)") as JuliaNamedTuple;
    expect(tuple().fieldNames).toEqual(["a", "b", "c"]);
    expect(tuple().get(0).value).toBe(1n);
    expect(tuple().get(1).value).toBe(2n);
    expect(tuple().get(2).value).toBe(3n);
    expect(() => tuple().get(3)).toThrow(RangeError);
    expect(tuple().length).toBe(3);
    expect(tuple().toString()).toBe("(a = 1, b = 2, c = 3)");
  });

  it("can be created from JS", () => {
    const tuple = () => JuliaNamedTuple.from({ a: 1, b: 2, c: "hello" });
    expect(tuple().fieldNames).toEqual(["a", "b", "c"]);
    expect(tuple().get(0).value).toBe(1n);
    expect(tuple().get(1).value).toBe(2n);
    expect(tuple().get(2).value).toBe("hello");
    expect(tuple().length).toBe(3);
    expect(tuple().toString()).toBe('(a = 1, b = 2, c = "hello")');
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

describe("JuliaSet additional coverage", () => {
  it("delete returns false when element not in set", () => {
    const set = JuliaSet.from([1, 2, 3]);
    expect(set.delete(999)).toBe(false);
    expect(set.size).toBe(3);
  });

  it("delete returns true and removes element when in set", () => {
    const set = JuliaSet.from([1, 2, 3]);
    expect(set.delete(2)).toBe(true);
    expect(set.size).toBe(2);
    expect(set.has(2)).toBe(false);
  });

  it("toString returns formatted string", () => {
    const set = JuliaSet.from([1]);
    expect(set.toString()).toContain("JuliaSet");
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

  it("supports toString() method", () => {
    const dict = JuliaDict.from([["a", 1n]]);
    expect(typeof dict.toString()).toBe("string");
    expect(dict.toString()).toContain("JuliaDict");
  });

  it("supports keys(), values(), and entries() methods", () => {
    const dict = JuliaDict.from([
      ["a", 1n],
      ["b", 2n],
    ]);

    const keys = dict.keys();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys).toContain("a");
    expect(keys).toContain("b");

    const values = dict.values();
    expect(Array.isArray(values)).toBe(true);
    expect(values).toContain(1n);
    expect(values).toContain(2n);

    const entries = dict.entries();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBe(2);
    // entries() returns a Map converted to array, so check that it contains our entries
    const entryMap = new Map(entries.map(([k, v]) => [k, v]));
    expect(entryMap.get("a")).toBe(1n);
    expect(entryMap.get("b")).toBe(2n);
  });
});

describe("JuliaIdDict", () => {
  it("can be created from JS", () => {
    const dict = JuliaIdDict.from([
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
  });

  it("supports toString() method", () => {
    const dict = JuliaIdDict.from([["a", 1n]]);
    expect(typeof dict.toString()).toBe("string");
    expect(dict.toString()).toContain("JuliaIdDict");
  });
});
