import { beforeAll, describe, expect, it } from "bun:test";
import { Julia, JuliaFunction, JuliaString, JuliaTuple } from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

describe("Julia", () => {
  it("can import modules", () => {
    const Printf = Julia.import("Printf");
    expect(Julia.typeof(Printf).value).toBe("Module");
    expect(Printf.value).toBe("[JuliaModule Main.Printf]");
    expect(Julia.eval('Printf.@sprintf "%d %.2f" 10 2').value).toBe("10 2.00");
  });

  it("can call functions of imported modules", () => {
    const Dates = Julia.import("Dates");
    expect(Dates.monthname(1).value).toBe("January");
    expect(Dates.monthname.value).toBe("[JuliaFunction monthname]");
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

  it("exposes the Julia version", () => {
    const runtimeVersion = (Julia.eval("string(VERSION)") as JuliaString).value;
    expect(Julia.version).toBe(runtimeVersion);
  });

  it("supports global variable management", () => {
    const testValue = Julia.eval("42");
    Julia.setGlobal("testGlobal", testValue);
    expect(Julia.getGlobal("testGlobal").value).toBe(testValue.value);
    expect(Julia.deleteGlobal("testGlobal")).toBe(true);
    expect(Julia.deleteGlobal("nonexistent")).toBe(false);
  });

  it("supports getFunction method", () => {
    const func = Julia.getFunction(Julia.Base, "println");
    expect(func).toBeInstanceOf(JuliaFunction);
    expect(func.name).toBe("println");
  });

  it("supports repr method", () => {
    const value = Julia.eval("42");
    const reprStr = Julia.repr(value);
    expect(typeof reprStr).toBe("string");
    expect(reprStr).toContain("42");
  });

  it("supports print method", () => {
    const value = Julia.eval("42");
    // Just test that it doesn't throw
    expect(() => Julia.print(value)).not.toThrow();
  });

  it("supports println method", () => {
    const value = Julia.eval("42");
    // Just test that it doesn't throw
    expect(() => Julia.println(value)).not.toThrow();
  });
});

describe("Julia.include and includeString", () => {
  it("includeString executes Julia code in Main module", () => {
    const result = Julia.includeString("1 + 2 + 3");
    expect(result.value).toBe(6n);
  });

  it("includeString with mapFn transforms expressions", () => {
    // Create a simple identity mapFn
    const mapFn = Julia.eval("x -> x") as JuliaFunction;
    const result = Julia.includeString("10 * 10", Julia.Main, mapFn);
    expect(result.value).toBe(100n);
  });

  it("include executes Julia file", () => {
    // Use Julia's mktemp to create a temp file
    const tmpFile = (Julia.Base.mktemp() as JuliaTuple).get(0).value + ".jl";
    Julia.Base.write(tmpFile, "1 + 2 + 3 + 4");

    const result = Julia.include(tmpFile);
    expect(result.value).toBe(10n);

    // Cleanup
    Julia.Base.rm(tmpFile);
  });

  it("include with mapFn transforms expressions", () => {
    // Use Julia's mktemp to create a temp file
    const tmpFile = (Julia.Base.mktemp() as JuliaTuple).get(0).value + ".jl";
    Julia.Base.write(tmpFile, "5 * 5");

    const mapFn = Julia.eval("x -> x") as JuliaFunction;
    const result = Julia.include(tmpFile, Julia.Main, mapFn);
    expect(result.value).toBe(25n);

    // Cleanup
    Julia.Base.rm(tmpFile);
  });
});
