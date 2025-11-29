import { beforeAll, describe, expect, test } from "bun:test";
import { Julia, JuliaFunction, JuliaRange } from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => {
  ensureJuliaInitialized();
});

describe("JuliaRange", () => {
  describe("Creation via Julia.eval", () => {
    test("UnitRange from eval", () => {
      const range = Julia.eval("1:10") as JuliaRange;
      expect(range).toBeInstanceOf(JuliaRange);
      expect(range.length).toBe(10);
      expect(range.first.value).toBe(1n);
      expect(range.last.value).toBe(10n);
    });

    test("StepRange from eval", () => {
      const range = Julia.eval("1:2:10") as JuliaRange;
      expect(range).toBeInstanceOf(JuliaRange);
      expect(range.length).toBe(5);
      expect(range.first.value).toBe(1n);
      expect(range.last.value).toBe(9n);
      expect(range.step.value).toBe(2n);
    });

    test("LinRange from eval", () => {
      const range = Julia.eval("LinRange(0.0, 1.0, 5)") as JuliaRange;
      expect(range).toBeInstanceOf(JuliaRange);
      expect(range.length).toBe(5);
      expect(range.first.value).toBeCloseTo(0.0);
      expect(range.last.value).toBeCloseTo(1.0);
    });

    test("Float StepRangeLen from eval", () => {
      const range = Julia.eval("0.0:0.1:1.0") as JuliaRange;
      expect(range).toBeInstanceOf(JuliaRange);
      expect(range.first.value).toBeCloseTo(0.0);
      expect(range.step.value).toBeCloseTo(0.1);
    });
  });

  describe("Factory methods", () => {
    test("JuliaRange.from with start and stop", () => {
      const range = JuliaRange.from(1, 10);
      expect(range.length).toBe(10);
      expect(range.first.value).toBe(1n);
      expect(range.last.value).toBe(10n);
    });

    test("JuliaRange.from with step", () => {
      const range = JuliaRange.from(1, 10, 2);
      expect(range.length).toBe(5);
      expect(range.first.value).toBe(1n);
      expect(range.last.value).toBe(9n);
      expect(range.step.value).toBe(2n);
    });

    test("JuliaRange.from with bigint", () => {
      const range = JuliaRange.from(1n, 100n);
      expect(range.length).toBe(100);
    });

    test("JuliaRange.linspace", () => {
      const range = JuliaRange.linspace(0, 1, 11);
      expect(range.length).toBe(11);
      expect(range.first.value).toBeCloseTo(0.0);
      expect(range.last.value).toBeCloseTo(1.0);
      // Check middle value
      expect(range.get(5).value).toBeCloseTo(0.5);
    });

    test("JuliaRange.withLength", () => {
      const range = JuliaRange.withLength(0.0, 5, 0.5);
      expect(range.length).toBe(5);
      expect(range.first.value).toBeCloseTo(0);
      expect(range.get(1).value).toBeCloseTo(0.5);
      expect(range.get(4).value).toBeCloseTo(2.0);
    });
  });

  describe("Properties", () => {
    test("isEmpty", () => {
      const nonEmpty = JuliaRange.from(1, 10);
      const empty = JuliaRange.from(10, 1);
      expect(nonEmpty.isEmpty).toBe(false);
      expect(empty.isEmpty).toBe(true);
    });

    test("elType", () => {
      const intRange = JuliaRange.from(1, 10);
      const floatRange = JuliaRange.linspace(0, 1, 5);
      expect(Julia.string(intRange.elType)).toBe("Int64");
      expect(Julia.string(floatRange.elType)).toBe("Float64");
    });
  });

  describe("Element access", () => {
    test("get with valid index", () => {
      const range = JuliaRange.from(10, 20);
      expect(range.get(0).value).toBe(10n);
      expect(range.get(5).value).toBe(15n);
      expect(range.get(10).value).toBe(20n);
    });

    test("get with invalid index throws", () => {
      const range = JuliaRange.from(1, 10);
      expect(() => range.get(-1)).toThrow(RangeError);
      expect(() => range.get(10)).toThrow(RangeError);
    });

    test("contains", () => {
      const range = JuliaRange.from(1, 10);
      expect(range.contains(5)).toBe(true);
      expect(range.contains(1)).toBe(true);
      expect(range.contains(10)).toBe(true);
      expect(range.contains(0)).toBe(false);
      expect(range.contains(11)).toBe(false);

      const stepRange = JuliaRange.from(1, 10, 2);
      expect(stepRange.contains(3)).toBe(true);
      expect(stepRange.contains(4)).toBe(false);
    });
  });

  describe("Value conversion", () => {
    test("value returns collected array", () => {
      const range = JuliaRange.from(1, 5);
      const values = range.value;
      // JuliaArray.value returns BigInt64Array for Int64 elements
      expect(Array.from(values)).toEqual([1n, 2n, 3n, 4n, 5n]);
    });

    test("value for float range", () => {
      const range = JuliaRange.linspace(0, 1, 3);
      const values = range.value;
      expect(values.length).toBe(3);
      expect(values[0]).toBeCloseTo(0.0);
      expect(values[1]).toBeCloseTo(0.5);
      expect(values[2]).toBeCloseTo(1.0);
    });
  });

  describe("Iteration", () => {
    test("iterator", () => {
      const range = JuliaRange.from(1, 5);
      const values: bigint[] = [];
      for (const val of range) {
        values.push(val.value as bigint);
      }
      expect(values).toEqual([1n, 2n, 3n, 4n, 5n]);
    });

    test("spread operator", () => {
      const range = JuliaRange.from(1, 3);
      const values = [...range].map((v) => v.value);
      expect(values).toEqual([1n, 2n, 3n]);
    });
  });

  describe("Operations", () => {
    test("reverse", () => {
      const range = JuliaRange.from(1, 5);
      const reversed = range.reverse();
      expect(reversed.first.value).toBe(5n);
      expect(reversed.last.value).toBe(1n);
      expect(reversed.length).toBe(5);
    });

    test("map", () => {
      const range = JuliaRange.from(1, 5);
      const doubled = range.map(Julia.eval("x -> 2x"));
      const values = doubled.value;
      // JuliaArray.value returns BigInt64Array for Int64 elements
      expect(Array.from(values)).toEqual([2n, 4n, 6n, 8n, 10n]);
    });
  });

  describe("toString", () => {
    test("toString returns readable format", () => {
      const range = JuliaRange.from(1, 10);
      expect(range.toString()).toContain("JuliaRange");
      expect(range.toString()).toContain("1:10");
    });
  });

  describe("Type detection in wrapPtr", () => {
    test("Julia.Base.range returns JuliaRange", () => {
      const range = Julia.callWithKwargs(Julia.Base.range, { length: 5 }, 1);
      expect(range).toBeInstanceOf(JuliaRange);
    });

    test("UnitRange constructor returns JuliaRange", () => {
      const range = Julia.Base.UnitRange(1, 10);
      expect(range).toBeInstanceOf(JuliaRange);
    });

    test("Julia function returning UnitRange is correctly wrapped", () => {
      const getRange = Julia.eval(`
        function get_range_test(start, stop)
          return start:stop
        end
      `) as JuliaFunction;
      const result = Julia.call(getRange, 1, 10);
      expect(result).toBeInstanceOf(JuliaRange);
      expect((result as JuliaRange).length).toBe(10);
      expect(Julia.Base.sum(result!).value).toBe(55n);
    });

    test("Julia function returning StepRange is correctly wrapped", () => {
      const getStepRange = Julia.eval(`
        function get_step_range_test(start, step, stop)
          return start:step:stop
        end
      `) as JuliaFunction;
      const result = Julia.call(getStepRange, 1, 2, 9);
      expect(result).toBeInstanceOf(JuliaRange);
      expect((result as JuliaRange).length).toBe(5);
      expect(Julia.Base.sum(result!).value).toBe(25n);
    });

    test("Julia.callWithKwargs returns StepRangeLen as JuliaRange", () => {
      const stepRange = Julia.callWithKwargs(
        Julia.Base.range,
        { stop: 10, length: 5 },
        1,
      );
      expect(stepRange).toBeInstanceOf(JuliaRange);
      expect((stepRange as JuliaRange).length).toBe(5);
    });
  });
});
