/**
 * Stress tests for JuliaScope memory safety.
 *
 * These tests verify that scope correctly handles large numbers of
 * tracked objects without memory corruption or segfaults.
 */

import { beforeAll, describe, expect, it } from "bun:test";
import {
  GCManager,
  Julia,
  JuliaArray,
  JuliaRange,
  JuliaScope,
  JuliaSubArray,
} from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

describe("Scope stress tests", () => {
  it("handles many tracked SubArrays via julia.Base.view", () => {
    const ITERATIONS = 1000;
    let finalSum = 0;

    Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));
      const range = julia.track(Julia.Base.UnitRange(2, 4));

      for (let i = 0; i < ITERATIONS; i++) {
        const sub = julia.Base.view(arr, range);
        expect(sub).toBeInstanceOf(JuliaSubArray);
        finalSum += Julia.Base.sum(sub).value as number;
      }
    });

    // Each SubArray sums to 2+3+4=9
    expect(finalSum).toBe(9 * ITERATIONS);
  });

  it("handles many tracked Ranges via julia.Base.UnitRange", () => {
    const ITERATIONS = 1000;

    Julia.scope((julia) => {
      for (let i = 0; i < ITERATIONS; i++) {
        const range = julia.Base.UnitRange(1, 100);
        expect(range).toBeInstanceOf(JuliaRange);
        expect(range.length).toBe(100);
      }
    });
  });

  it("handles mixed tracked objects", () => {
    const ITERATIONS = 500;

    Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5, 6, 7, 8]));

      for (let i = 0; i < ITERATIONS; i++) {
        // Create Range
        const range = julia.Base.UnitRange(2, 6);
        expect(range).toBeInstanceOf(JuliaRange);

        // Create SubArray
        const sub = julia.Base.view(arr, range);
        expect(sub).toBeInstanceOf(JuliaSubArray);
        expect(sub.length).toBe(5);
      }
    });
  });

  it("scope size grows correctly with tracked objects", () => {
    const scope = new JuliaScope();
    const julia = scope.julia;

    const initialSize = scope.size;
    const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));
    expect(scope.size).toBe(initialSize + 1);

    // Track 100 SubArrays
    for (let i = 0; i < 100; i++) {
      const sub = julia.Base.view(arr, julia.Base.UnitRange(1, 3));
      expect(sub).toBeInstanceOf(JuliaSubArray);
    }

    // Each view call tracks: 1 UnitRange + 1 SubArray = 2 objects
    // So we should have: 1 (arr) + 100 * 2 = 201 tracked objects
    expect(scope.size).toBe(initialSize + 1 + 100 * 2);

    scope.dispose();
    expect(scope.size).toBe(0);
  });

  it("GCManager.size reflects scope tracking", () => {
    const countBefore = GCManager.size;

    Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));

      // Track 50 SubArrays
      for (let i = 0; i < 50; i++) {
        julia.Base.view(arr, julia.Base.UnitRange(1, 3));
      }

      // Size should have increased
      const countDuring = GCManager.size;
      expect(countDuring).toBeGreaterThan(countBefore);
    });

    // After scope ends, count should return close to original
    // (might not be exact due to other global objects)
  });

  it("survives Julia GC during heavy tracking", () => {
    const ITERATIONS = 500;

    Julia.scope((julia) => {
      const arr = julia.Array.from(
        new Float64Array(Array.from({ length: 1000 }, (_, i) => i)),
      );

      for (let i = 0; i < ITERATIONS; i++) {
        // Create objects that will trigger GC pressure
        const range = julia.Base.UnitRange(1, 500);
        const sub = julia.Base.view(arr, range);

        // Force some computation
        const sum = Julia.Base.sum(sub).value as number;
        expect(sum).toBe(((1 + 500) * 500) / 2 - 500); // Sum of 0..499

        // Every 100 iterations, explicitly trigger Julia GC
        if (i % 100 === 0) {
          Julia.eval("GC.gc()");
        }
      }
    });
  });

  it("handles rapid scope creation and disposal", () => {
    for (let i = 0; i < 100; i++) {
      const result = Julia.scope((julia) => {
        const arr = julia.Array.from(new Float64Array([1, 2, 3]));
        const sub = julia.Base.view(arr, julia.Base.UnitRange(1, 2));
        return Julia.Base.sum(sub).value;
      });
      expect(result).toBe(3); // 1 + 2
    }
  });

  it("JuliaSubArray.view static method handles stress", () => {
    const ITERATIONS = 1000;

    Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));

      for (let i = 0; i < ITERATIONS; i++) {
        // Use static method (not through scope proxy)
        const sub = JuliaSubArray.view(arr, [1, 3]);
        expect(sub).toBeInstanceOf(JuliaSubArray);
        expect(sub.length).toBe(3);
      }
    });
  });

  it("arr.view instance method handles stress", () => {
    const ITERATIONS = 1000;

    Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3, 4, 5]));

      for (let i = 0; i < ITERATIONS; i++) {
        const sub = arr.view([1, 3]);
        expect(sub).toBeInstanceOf(JuliaSubArray);
        expect(sub.length).toBe(3);
      }
    });
  });

  it("direct Julia.Base calls (no scope tracking) handle stress", () => {
    const ITERATIONS = 2000;
    const arr = JuliaArray.from(new Float64Array([1, 2, 3, 4, 5]));

    for (let i = 0; i < ITERATIONS; i++) {
      // Direct calls without scope tracking
      const range = Julia.Base.UnitRange(2, 4);
      const sub = Julia.Base.view(arr, range);
      expect(Julia.Base.sum(sub).value).toBe(9);
    }
  });

  it("extreme stress: 10000 iterations with multiple array sizes", () => {
    const ITERATIONS = 10000;

    for (const size of [100, 1000, 10000]) {
      Julia.scope((julia) => {
        const testData = new Float64Array(size);
        for (let i = 0; i < size; i++) {
          testData[i] = i * 1.5;
        }
        const arr = julia.Array.from(testData);

        const start = Math.floor(size * 0.25);
        const stop = Math.floor(size * 0.75) - 1;

        // Test with pre-created range (the failing case in benchmark)
        const range = julia.track(Julia.Base.UnitRange(start + 1, stop + 1));

        for (let i = 0; i < ITERATIONS; i++) {
          const sub = julia.Base.view(arr, range);
          expect(sub).toBeInstanceOf(JuliaSubArray);
        }
      });
    }
  });

  it("benchmark scenario: continuous scope with all tests", () => {
    // This reproduces the exact benchmark scenario that caused segfault
    const ITERATIONS = 5000;

    Julia.scope((julia) => {
      for (const size of [100, 1000, 10000]) {
        const testData = new Float64Array(size);
        for (let i = 0; i < size; i++) {
          testData[i] = i * 1.5;
        }
        const arr = julia.Array.from(testData);

        const start = Math.floor(size * 0.25);
        const stop = Math.floor(size * 0.75) - 1;

        // Warm up
        for (let i = 0; i < 100; i++) {
          arr.view([start, stop]);
          arr.slice(start, stop);
          JuliaSubArray.view(arr, [start, stop]);
          Julia.Base.view(arr, Julia.Base.UnitRange(start + 1, stop + 1));
        }

        // Test 1: arr.view()
        for (let i = 0; i < ITERATIONS; i++) {
          arr.view([start, stop]);
        }

        // Test 2: arr.slice()
        for (let i = 0; i < ITERATIONS; i++) {
          arr.slice(start, stop);
        }

        // Test 3: JuliaSubArray.view()
        for (let i = 0; i < ITERATIONS; i++) {
          JuliaSubArray.view(arr, [start, stop]);
        }

        // Test 4: julia.Base.view with pre-created range
        const range = julia.track(Julia.Base.UnitRange(start + 1, stop + 1));
        for (let i = 0; i < ITERATIONS; i++) {
          julia.Base.view(arr, range);
        }

        // Test 5: Julia.Base.view (not through scope)
        for (let i = 0; i < ITERATIONS; i++) {
          Julia.Base.view(arr, Julia.Base.UnitRange(start + 1, stop + 1));
        }
      }
    });
  });
});
