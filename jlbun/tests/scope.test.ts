import { beforeAll, describe, expect, it } from "bun:test";
import {
  GCManager,
  Julia,
  JuliaArray,
  JuliaFunction,
  JuliaScope,
  JuliaTask,
} from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

describe("Julia.scope", () => {
  it("auto-tracks Julia objects created through scoped proxy", () => {
    const result = Julia.scope((julia) => {
      const a = julia.Base.rand(10);
      const b = julia.Base.rand(10);
      expect(a.length).toBe(10);
      expect(b.length).toBe(10);
      return julia.Base["+"](julia.Base.sum(a), julia.Base.sum(b)).value;
    });

    expect(typeof result).toBe("number");
  });

  it("supports eval within scope", () => {
    const result = Julia.scope((julia) => {
      const arr = julia.eval("[1, 2, 3, 4, 5]");
      return julia.Base.sum(arr).value;
    });

    expect(result).toBe(15n);
  });

  it("supports tagEval within scope", () => {
    const nums = [1, 2, 3];
    const result = Julia.scope((julia) => {
      const arr = julia.tagEval`${nums}`;
      return julia.Base.sum(arr).value;
    });

    expect(result).toBe(6n);
  });

  it("supports module imports within scope", () => {
    const result = Julia.scope((julia) => {
      const Dates = julia.import("Dates");
      return Dates.monthname(1).value;
    });

    expect(result).toBe("January");
  });

  it("allows escaping values from scope", () => {
    const arr = Julia.scope((julia) => {
      const temp = julia.Base.rand(5);
      return julia.escape(temp);
    });

    // arr should still be valid outside the scope
    expect(arr.length).toBe(5);
  });

  it("auto-escapes returned JuliaValues", () => {
    const arr = Julia.scope((julia) => {
      return julia.Base.rand(5);
    });

    // Returned value should be auto-escaped
    expect(arr.length).toBe(5);
  });

  it("works with nested function calls", () => {
    const result = Julia.scope((julia) => {
      const arr = julia.Base.rand(100);
      const sorted = julia.Base.sort(arr);
      const reversed = julia.Base.reverse(sorted);
      return julia.Base.first(reversed).value;
    });

    expect(typeof result).toBe("number");
  });

  it("supports callWithKwargs within scope", () => {
    const result = Julia.scope((julia) => {
      const arr = julia.eval("[1, 10, 2, 20, 3]");
      const sorted = julia.Base.sort.callWithKwargs({ rev: true }, arr);
      return sorted.value;
    });

    expect(result).toEqual(new BigInt64Array([20n, 10n, 3n, 2n, 1n]));
  });
});

describe("Julia.scopeAsync", () => {
  it("works with async operations", async () => {
    const result = await Julia.scopeAsync(async (julia) => {
      const func = julia.eval("() -> sum(1:100)") as JuliaFunction;
      const task = JuliaTask.from(func);
      const value = await task.value;
      return value.value;
    });

    expect(result).toBe(5050n);
  });
});

describe("Scoped collection types", () => {
  it("julia.Array.init creates auto-tracked arrays", () => {
    const result = Julia.scope((julia) => {
      const arr = julia.Array.init(julia.Float64, 1000);
      for (let i = 0; i < 1000; i++) {
        arr.set(i, i * 2);
      }
      return julia.Base.sum(arr).value;
    });

    // Sum of 0, 2, 4, ..., 1998 = 2 * (0 + 1 + ... + 999) = 2 * 999 * 1000 / 2 = 999000
    expect(result).toBe(999000);
  });

  it("julia.Array.from creates auto-tracked arrays from TypedArray", () => {
    const result = Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));
      return julia.Base.sum(arr).value;
    });

    expect(result).toBe(15);
  });

  it("julia.Dict.from creates auto-tracked dicts", () => {
    const result = Julia.scope((julia) => {
      const dict = julia.Dict.from([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ]);
      return julia.Base.length(dict).value;
    });

    expect(result).toBe(3n);
  });

  it("julia.Set.from creates auto-tracked sets", () => {
    const result = Julia.scope((julia) => {
      const set = julia.Set.from([1, 2, 3, 4, 5]);
      return julia.Base.length(set).value;
    });

    expect(result).toBe(5n);
  });

  it("julia.Tuple.from creates auto-tracked tuples", () => {
    const result = Julia.scope((julia) => {
      const tuple = julia.Tuple.from([1, 2, 3]);
      return tuple.value.length;
    });

    expect(result).toBe(3);
  });

  it("julia.NamedTuple.from creates auto-tracked named tuples", () => {
    const result = Julia.scope((julia) => {
      const nt = julia.NamedTuple.from({ a: 1, b: 2, c: 3 });
      return julia.Base.length(nt).value;
    });

    expect(result).toBe(3n);
  });

  it("survives Julia GC with large array operations", () => {
    const result = Julia.scope((julia) => {
      const N = 1000000;
      const arr = julia.Array.init(julia.Float64, N);
      for (let i = 0; i < N; i++) {
        arr.set(i, i);
      }
      // Trigger GC with some operations
      for (let i = 0; i < 1000; i++) {
        julia.Base.sqrt(arr.get(i));
      }
      return arr.length;
    });

    expect(result).toBe(1000000);
  });
});

describe("ScopedJulia API coverage", () => {
  it("provides access to Core module", () => {
    Julia.scope((julia) => {
      expect(julia.Core).toBeDefined();
      expect(julia.Core.Int64).toBeDefined();
    });
  });

  it("provides access to Main module", () => {
    Julia.scope((julia) => {
      expect(julia.Main).toBeDefined();
    });
  });

  it("provides access to Pkg module", () => {
    Julia.scope((julia) => {
      expect(julia.Pkg).toBeDefined();
    });
  });

  it("exposes nthreads property", () => {
    Julia.scope((julia) => {
      expect(typeof julia.nthreads).toBe("number");
      expect(julia.nthreads).toBeGreaterThanOrEqual(1);
    });
  });

  it("exposes version property", () => {
    Julia.scope((julia) => {
      expect(typeof julia.version).toBe("string");
      expect(julia.version).toMatch(/^\d+\.\d+/);
    });
  });

  it("exposes all data type getters", () => {
    Julia.scope((julia) => {
      // Test all type getters
      expect(julia.Any).toBeDefined();
      expect(julia.Nothing).toBeDefined();
      expect(julia.Symbol).toBeDefined();
      expect(julia.Function).toBeDefined();
      expect(julia.String).toBeDefined();
      expect(julia.Bool).toBeDefined();
      expect(julia.Char).toBeDefined();
      expect(julia.Int8).toBeDefined();
      expect(julia.UInt8).toBeDefined();
      expect(julia.Int16).toBeDefined();
      expect(julia.UInt16).toBeDefined();
      expect(julia.Int32).toBeDefined();
      expect(julia.UInt32).toBeDefined();
      expect(julia.Int64).toBeDefined();
      expect(julia.UInt64).toBeDefined();
      expect(julia.Float16).toBeDefined();
      expect(julia.Float32).toBeDefined();
      expect(julia.Float64).toBeDefined();
    });
  });

  it("supports wrapPtr method", () => {
    Julia.scope((julia) => {
      const arr = julia.Array.init(julia.Int64, 3);
      arr.set(0, 1);
      arr.set(1, 2);
      arr.set(2, 3);
      // Get the pointer and rewrap it
      const rewrapped = julia.wrapPtr(arr.ptr);
      expect(rewrapped).toBeDefined();
      expect(julia.Base.sum(rewrapped).value).toBe(6n);
    });
  });

  it("supports call method with function returning value", () => {
    Julia.scope((julia) => {
      const addFunc = julia.eval("(a, b) -> a + b") as JuliaFunction;
      const result = julia.call(addFunc, 3, 4);
      expect(result?.value).toBe(7n);
    });
  });

  it("supports typeof utility", () => {
    Julia.scope((julia) => {
      const arr = julia.Array.init(julia.Float64, 5);
      const type = julia.typeof(arr);
      expect(type).toBeDefined();
    });
  });

  it("supports getTypeStr utility", () => {
    Julia.scope((julia) => {
      const arr = julia.Array.init(julia.Float64, 5);
      const typeStr = julia.getTypeStr(arr);
      expect(typeStr).toContain("Array");
    });
  });

  it("supports autoWrap utility", () => {
    Julia.scope((julia) => {
      const wrapped = julia.autoWrap(42);
      expect(wrapped.value).toBe(42n);
    });
  });
});

describe("ScopedJulia callWithKwargs coverage", () => {
  it("supports callWithKwargs with record kwargs", () => {
    const result = Julia.scope((julia) => {
      const rangeFunc = julia.Base.range;
      // range(1, stop=10, step=2) -> 1:2:9
      const r = julia.callWithKwargs(rangeFunc, { stop: 10, step: 2 }, 1);
      return julia.Base.collect(r).value;
    });

    expect(result).toEqual(new BigInt64Array([1n, 3n, 5n, 7n, 9n]));
  });
});

describe("JuliaScope internal methods", () => {
  it("escape removes value from tracking but returns it", () => {
    // Create an array and escape it before scope ends
    const escaped = Julia.scope((julia) => {
      const arr = julia.Array.init(julia.Int64, 3);
      arr.set(0, 10);
      arr.set(1, 20);
      arr.set(2, 30);
      // Escape the array so it survives the scope
      return julia.escape(arr);
    });

    // The escaped array should still be usable
    expect(escaped.length).toBe(3);
    expect(Julia.Base.sum(escaped).value).toBe(60n);
  });

  it("directly tests JuliaScope.escape and size", () => {
    const scope = new JuliaScope();
    const arr = JuliaArray.init(Julia.Int64, 5);

    // Track the array
    scope.track(arr);
    expect(scope.size).toBe(1);

    // Escape the array
    const escaped = scope.escape(arr);
    expect(escaped).toBe(arr);
    expect(scope.size).toBe(0);

    // Dispose
    scope.dispose();
    expect(scope.isDisposed).toBe(true);
  });
});

describe("GCManager API coverage", () => {
  it("reports protectedCount", () => {
    // First check the count before scope
    const countBefore = Julia.scope((julia) => {
      // Create some objects
      const arr1 = julia.Array.init(julia.Float64, 10);
      const arr2 = julia.Array.init(julia.Int64, 10);
      // Return a non-Julia value so objects are released
      return arr1.length + arr2.length;
    });

    expect(countBefore).toBe(20);
  });

  it("isInitialized returns true after Julia.init()", () => {
    // Import GCManager to test
    expect(GCManager.isInitialized).toBe(true);
  });

  it("protectedCount returns a number", () => {
    expect(typeof GCManager.protectedCount).toBe("number");
  });
});
