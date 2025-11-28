import { CString, FFIType, Pointer, ptr, toArrayBuffer } from "bun:ffi";
import { beforeAll, describe, expect, it } from "bun:test";
import { Julia, JuliaArray, JuliaFunction, safeCString } from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

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

  it("can be created from a JS function", () => {
    const jsFunc = (x: number, y: Pointer) => {
      const str = `${new CString(y).toString()} ${x}`;
      return safeCString(str);
    };

    const cb = JuliaFunction.from(jsFunc, {
      returns: "cstring",
      args: ["i32", "cstring"],
    });

    expect(cb(42, "Hello").value).toBe("Hello 42");
    cb.close();

    const cb2 = JuliaFunction.from((x: number, y: number) => x + y, {
      returns: "i32",
      args: ["i32", "i32"],
    });
    expect(cb2(1, 2).value).toBe(3);
    cb2.close();

    const cb3 = JuliaFunction.from((x: number) => -x, {
      returns: "i32",
      args: ["i32"],
    });
    const arr3 = JuliaArray.from(new Int32Array([1, 10, 20, 30, 100]));
    const neg = arr3.map(cb3);
    expect(neg.value).toEqual(new Int32Array([-1, -10, -20, -30, -100]));
    cb3.close();

    const jsFunc4 = (ptr: Pointer) =>
      safeCString(Julia.wrapPtr(ptr).value.join(", "));
    const cb4 = JuliaFunction.from(jsFunc4, {
      returns: "cstring",
      args: ["ptr"],
    });
    const arr4 = JuliaArray.from(new Int32Array([1, 10, 20, 30, 100]));
    expect(cb4(arr4).value).toBe("1, 10, 20, 30, 100");
    cb4.close();

    const jsFunc5 = (length: number) => {
      const arr = new Int32Array(length);
      arr.fill(100);
      return ptr(arr);
    };
    const cb5 = JuliaFunction.from(jsFunc5, {
      returns: "ptr",
      args: ["i32"],
    });
    expect(new Int32Array(toArrayBuffer(cb5(5).value, 0, 5 * 4))).toEqual(
      new Int32Array([100, 100, 100, 100, 100]),
    );
    cb5.close();
  });

  it("can be created from a JS function and then used as a function parameter", () => {
    const jsFunc = (x: number) => {
      return safeCString(x.toString());
    };

    const cb = JuliaFunction.from(jsFunc, {
      returns: "cstring",
      args: ["i32"],
    });

    const arr = JuliaArray.from(new Int32Array([1, 10, 20, 30, 100]));
    Julia.Base["sort!"].callWithKwargs({ by: cb, rev: true }, arr);
    expect(arr.value).toEqual(new Int32Array([30, 20, 100, 10, 1]));
    cb.close();
  });
});

describe("JuliaFunction FinalizationRegistry coverage", () => {
  it("cleans up JSCallback when JuliaFunction is garbage collected", async () => {
    // Create a function that will be garbage collected
    let func: JuliaFunction | null = JuliaFunction.from((x: number) => x * 3, {
      args: [FFIType.f64],
      returns: FFIType.f64,
    });

    // Use the function to make sure it works
    const result = Julia.call(func, 10);
    expect(result?.value).toBe(30);

    // Remove reference and trigger GC
    func = null;
    Bun.gc(true);

    // Give FinalizationRegistry time to process
    await new Promise((resolve) => setTimeout(resolve, 100));
    Bun.gc(true);
  });
});
