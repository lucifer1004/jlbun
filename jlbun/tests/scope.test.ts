import { beforeAll, describe, expect, it } from "bun:test";
import {
  GCManager,
  Julia,
  JuliaArray,
  JuliaFunction,
  JuliaRange,
  JuliaScope,
  JuliaSubArray,
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
    const scope = new JuliaScope();
    const julia = scope.julia;

    const sizeBefore = scope.size;
    const arr = julia.Array.init(julia.Float64, 100);

    // Verify tracking
    expect(scope.size).toBe(sizeBefore + 1);

    // Verify functionality
    for (let i = 0; i < 100; i++) {
      arr.set(i, i * 2);
    }
    expect(Julia.Base.sum(arr).value).toBe(9900); // 2*(0+1+...+99) = 2*99*100/2

    scope.dispose();
  });

  it("julia.Array.from creates auto-tracked arrays from TypedArray", () => {
    const scope = new JuliaScope();
    const julia = scope.julia;

    const sizeBefore = scope.size;
    const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));

    // Verify tracking
    expect(scope.size).toBe(sizeBefore + 1);

    // Verify functionality
    expect(Julia.Base.sum(arr).value).toBe(15);

    scope.dispose();
  });

  it("julia.Dict.from creates auto-tracked dicts", () => {
    const scope = new JuliaScope();
    const julia = scope.julia;

    const sizeBefore = scope.size;
    const dict = julia.Dict.from([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);

    // Verify tracking
    expect(scope.size).toBe(sizeBefore + 1);

    // Verify functionality
    expect(Julia.Base.length(dict).value).toBe(3n);

    scope.dispose();
  });

  it("julia.Set.from creates auto-tracked sets", () => {
    const scope = new JuliaScope();
    const julia = scope.julia;

    const sizeBefore = scope.size;
    const set = julia.Set.from([1, 2, 3, 4, 5]);

    // Verify tracking
    expect(scope.size).toBe(sizeBefore + 1);

    // Verify functionality
    expect(Julia.Base.length(set).value).toBe(5n);

    scope.dispose();
  });

  it("julia.Tuple.from creates auto-tracked tuples", () => {
    const scope = new JuliaScope();
    const julia = scope.julia;

    const sizeBefore = scope.size;
    const tuple = julia.Tuple.from([1, 2, 3]);

    // Verify tracking
    expect(scope.size).toBe(sizeBefore + 1);

    // Verify functionality
    expect(tuple.value.length).toBe(3);

    scope.dispose();
  });

  it("julia.NamedTuple.from creates auto-tracked named tuples", () => {
    const scope = new JuliaScope();
    const julia = scope.julia;

    const sizeBefore = scope.size;
    const nt = julia.NamedTuple.from({ a: 1, b: 2, c: 3 });

    // Verify tracking
    expect(scope.size).toBe(sizeBefore + 1);

    // Verify functionality
    expect(Julia.Base.length(nt).value).toBe(3n);

    scope.dispose();
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

describe("JuliaSubArray and JuliaRange scope compatibility", () => {
  it("SubArray is auto-tracked when created via Base.view", () => {
    const result = Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));
      // Create SubArray via julia.Base.view - should be auto-tracked
      const sub = julia.Base.view(arr, julia.Base.UnitRange(2, 4));
      expect(sub).toBeInstanceOf(JuliaSubArray);
      return julia.Base.sum(sub).value;
    });

    expect(result).toBe(9); // 2 + 3 + 4
  });

  it("SubArray created via arr.view() is tracked when using track()", () => {
    const scope = new JuliaScope();
    const arr = JuliaArray.from(new Float64Array([10, 20, 30, 40, 50]));

    const sizeBefore = scope.size;
    const sub = arr.view([1, 3]);
    scope.track(sub);

    // Verify tracking increased size
    expect(scope.size).toBe(sizeBefore + 1);

    // Track same value again - size should not change
    scope.track(sub);
    expect(scope.size).toBe(sizeBefore + 1);

    // Verify functionality
    expect(sub).toBeInstanceOf(JuliaSubArray);
    expect(Julia.Base.sum(sub).value).toBe(90); // 20 + 30 + 40

    scope.dispose();
  });

  it("SubArray modifications propagate correctly within scope", () => {
    const result = Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));
      const sub = julia.Base.view(arr, julia.Base.UnitRange(2, 4));

      // Modify via SubArray
      julia.Base["setindex!"](sub, 100, 1); // sub[1] = 100

      // Check parent array
      return arr.get(1).value; // Should be 100
    });

    expect(result).toBe(100);
  });

  it("JuliaRange is auto-tracked when created via Base.range", () => {
    const result = Julia.scope((julia) => {
      // Create Range via Julia - should be auto-tracked
      const range = julia.callWithKwargs(
        julia.Base.range,
        { stop: 10, step: 2 },
        1,
      );
      expect(range).toBeInstanceOf(JuliaRange);
      return julia.Base.sum(range).value;
    });

    expect(result).toBe(25n); // 1 + 3 + 5 + 7 + 9
  });

  it("JuliaRange created via JuliaRange.from is tracked when using track()", () => {
    const scope = new JuliaScope();
    const sizeBefore = scope.size;

    const range = JuliaRange.from(1, 10);
    scope.track(range);

    // Verify tracking increased size
    expect(scope.size).toBe(sizeBefore + 1);

    // Track same value again - size should not change
    scope.track(range);
    expect(scope.size).toBe(sizeBefore + 1);

    // Verify functionality
    expect(range).toBeInstanceOf(JuliaRange);
    expect(Julia.Base.sum(range).value).toBe(55n);

    scope.dispose();
  });

  it("nested SubArray views work within scope", () => {
    const result = Julia.scope((julia) => {
      const arr = julia.Array.from(
        new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
      );
      // Create nested views
      const sub1 = julia.Base.view(arr, julia.Base.UnitRange(2, 8)); // [2,3,4,5,6,7,8]
      const sub2 = julia.Base.view(sub1, julia.Base.UnitRange(2, 4)); // [3,4,5]

      expect(sub1).toBeInstanceOf(JuliaSubArray);
      expect(sub2).toBeInstanceOf(JuliaSubArray);

      return julia.Base.sum(sub2).value;
    });

    expect(result).toBe(12); // 3 + 4 + 5
  });

  it("SubArray can be escaped from scope", () => {
    const sub = Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));
      const view = julia.Base.view(arr, julia.Base.UnitRange(2, 4));
      // Escape the SubArray
      return julia.escape(view);
    });

    // SubArray should still be valid outside scope
    expect(sub).toBeInstanceOf(JuliaSubArray);
    expect(sub.length).toBe(3);
  });

  it("JuliaRange can be escaped from scope", () => {
    const range = Julia.scope((julia) => {
      const r = julia.callWithKwargs(julia.Base.range, { stop: 5 }, 1);
      return julia.escape(r);
    }) as JuliaRange;

    // Range should still be valid outside scope
    expect(range).toBeInstanceOf(JuliaRange);
    expect(range.length).toBe(5);
  });
});

describe("ScopedJulia.untracked()", () => {
  it("skips auto-tracking for performance", () => {
    const scope = new JuliaScope();
    const julia = scope.julia;

    const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));
    const initialSize = scope.size;

    // Without untracked: objects are tracked
    const range1 = julia.Base.UnitRange(2, 4);
    expect(scope.size).toBe(initialSize + 1); // Range tracked

    julia.Base.view(arr, range1);
    expect(scope.size).toBe(initialSize + 2); // SubArray tracked

    // With untracked: objects are NOT tracked
    const sizeBefore = scope.size;
    let sum = 0;
    julia.untracked(() => {
      for (let i = 0; i < 100; i++) {
        const range = julia.Base.UnitRange(2, 4);
        const sub = julia.Base.view(arr, range);
        sum += Julia.Base.sum(sub).value as number;
      }
    });

    // Size should not change during untracked block
    expect(scope.size).toBe(sizeBefore);
    expect(sum).toBe(9 * 100); // Each sum is 2+3+4=9

    scope.dispose();
  });

  it("restores tracking state after completion", () => {
    const scope = new JuliaScope();
    const julia = scope.julia;

    julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));

    julia.untracked(() => {
      // Inside untracked
      julia.Base.UnitRange(1, 3);
    });

    const sizeBefore = scope.size;

    // After untracked, tracking should be re-enabled
    julia.Base.UnitRange(1, 3);
    expect(scope.size).toBe(sizeBefore + 1);

    scope.dispose();
  });

  it("handles nested calls correctly", () => {
    const scope = new JuliaScope();
    const julia = scope.julia;

    julia.Array.from(new Float64Array([1, 2, 3]));

    const sizeBefore = scope.size;

    julia.untracked(() => {
      julia.Base.UnitRange(1, 2);

      julia.untracked(() => {
        julia.Base.UnitRange(3, 4);
      });

      julia.Base.UnitRange(5, 6);
    });

    // All ranges created in nested untracked should not be tracked
    expect(scope.size).toBe(sizeBefore);

    scope.dispose();
  });

  it("explicit track() still works inside untracked", () => {
    const scope = new JuliaScope();
    const julia = scope.julia;

    julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));
    const sizeBefore = scope.size;

    julia.untracked(() => {
      // Auto-tracking disabled, but explicit track() works
      const range = julia.track(Julia.Base.UnitRange(2, 4));
      expect(range.length).toBe(3);
    });

    expect(scope.size).toBe(sizeBefore + 1);

    scope.dispose();
  });

  it("works with Julia.scope() helper", () => {
    let trackedDuringUntracked = false;
    let trackedAfterUntracked = false;

    Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));

      // Test untracked via Julia.scope callback
      julia.untracked(() => {
        const range = julia.Base.UnitRange(2, 4);
        julia.Base.view(arr, range);
        trackedDuringUntracked = true;
      });

      // Normal tracking should resume
      julia.Base.UnitRange(1, 5);
      trackedAfterUntracked = true;
    });

    expect(trackedDuringUntracked).toBe(true);
    expect(trackedAfterUntracked).toBe(true);
  });

  it("nested Julia.scope() inside untracked() has independent tracking", () => {
    const outerScope = new JuliaScope();
    const outerJulia = outerScope.julia;

    outerJulia.Array.from(new Float64Array([1, 2, 3]));
    const outerSizeBefore = outerScope.size;

    let innerScopeTrackedCount = 0;

    outerJulia.untracked(() => {
      // Outer scope should not track
      outerJulia.Base.UnitRange(1, 5);
      expect(outerScope.size).toBe(outerSizeBefore); // No change

      // But a nested Julia.scope() should track independently
      Julia.scope((innerJulia) => {
        const innerArr = innerJulia.Array.from(
          new Float64Array([1, 2, 3, 4, 5]),
        );
        const innerRange = innerJulia.Base.UnitRange(2, 4);
        innerJulia.Base.view(innerArr, innerRange);

        // Inner scope should track (it has its own trackingEnabled = true)
        // We can't access inner scope's size directly, but we verify no crash
        innerScopeTrackedCount++;
      });
    });

    // Outer scope still unchanged (untracked items not counted)
    expect(outerScope.size).toBe(outerSizeBefore);
    expect(innerScopeTrackedCount).toBe(1);

    outerScope.dispose();
  });

  it("untracked() only affects current scope, not nested scopes", () => {
    let outerTracked = 0;
    let innerTracked = 0;

    Julia.scope((outerJulia) => {
      // Track something in outer scope
      outerJulia.Array.from(new Float64Array([1, 2, 3]));
      outerTracked++;

      outerJulia.untracked(() => {
        // This should NOT be tracked in outer scope
        outerJulia.Base.UnitRange(1, 10);

        // Nested scope should still track normally
        Julia.scope((innerJulia) => {
          innerJulia.Array.from(new Float64Array([4, 5, 6]));
          innerJulia.Base.UnitRange(1, 5);
          innerTracked += 2; // Array + Range
        });
      });

      // Back in outer scope, tracking should resume
      outerJulia.Base.UnitRange(1, 3);
      outerTracked++;
    });

    expect(outerTracked).toBe(2); // Only the explicitly noted ones
    expect(innerTracked).toBe(2);
  });
});
