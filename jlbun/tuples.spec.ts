import { describe, expect, it } from "bun:test";
import { Julia, JuliaPair, JuliaTuple } from "./index.js";

describe("JuliaPair", () => {
  it("can be created from Julia", () => {
    const pair = Julia.eval('2 => "hello"') as JuliaPair;
    expect(pair.first.value).toBe(2n);
    expect(pair.second.value).toBe("hello");
    expect(pair.toString()).toBe("2 => hello");
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
    expect(tuple.toString()).toBe("(1, 2, hello)");
  });
});
