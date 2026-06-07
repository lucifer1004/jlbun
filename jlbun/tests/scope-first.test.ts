import { beforeAll, describe, expect, it } from "bun:test";
import {
  GCManager,
  jlbun,
  Julia,
  JuliaArray,
  JuliaDataType,
  JuliaFunction,
  JuliaInt64,
  JuliaModule,
  JuliaNothing,
  JuliaScope,
  JuliaString,
  JuliaValue,
  ScopeOwnershipError,
  ScopeRequiredError,
} from "../index.js";
import { getJuliaOwnership, setJuliaExternalOwner } from "../ownership.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

describe("v0.3 scope-first lifecycle", () => {
  it("rejects static object-producing APIs without an active scope", () => {
    expect(() => Julia.eval("1 + 1")).toThrowError(ScopeRequiredError);
    expect(() => Julia.import("Dates")).toThrowError(ScopeRequiredError);
    const basePtr = Julia.scope(() => Julia.Base.ptr);
    expect(() => Julia.wrapPtr(basePtr)).toThrowError(ScopeRequiredError);
    expect(() => Julia.Base.sum([1, 2, 3])).toThrowError(ScopeRequiredError);
    expect(() => JuliaArray.from(new Float64Array([1, 2, 3]))).toThrowError(
      ScopeRequiredError,
    );
    expect(() => JuliaInt64.from(1)).toThrowError(ScopeRequiredError);
    expect(() => JuliaString.from("x")).toThrowError(ScopeRequiredError);
  });

  it("allows the same operations through Julia.scope", () => {
    const result = Julia.scope((julia) => {
      const arr = julia.eval("[1, 2, 3]");
      const Dates = julia.import("Dates");

      expect(Dates).toBeInstanceOf(JuliaModule);
      expect(Dates.monthname(1).value).toBe("January");

      return julia.Base.sum(arr).value;
    });

    expect(result).toBe(6n);
  });

  it("keeps returned JuliaValues rooted after JS and Julia GC", () => {
    const arr = Julia.scope((julia) => {
      const value = julia.Base.collect(julia.Base.UnitRange(1, 3));
      return value;
    }) as JuliaArray;

    for (let i = 0; i < 3; i++) {
      Julia.unsafe.eval("GC.gc()");
      Bun.gc(true);
    }

    expect(arr.value).toEqual(new BigInt64Array([1n, 2n, 3n]));
  });

  it("rejects JuliaValues returned from untracked callbacks", () => {
    expect(() =>
      Julia.scope((julia) => {
        const arr = julia.Array.from(new Float64Array([1, 2, 3]));
        return julia.untracked(() =>
          julia.Base.view(arr, julia.Base.UnitRange(1, 2)),
        );
      }),
    ).toThrowError(ScopeOwnershipError);
  });

  it("rejects promises returned from untracked callbacks", () => {
    expect(() =>
      Julia.scope((julia) => {
        return julia.untracked(() => Promise.resolve(1));
      }),
    ).toThrowError(ScopeOwnershipError);
  });

  it("wraps module globals by their actual Julia type", () => {
    Julia.scope((julia) => {
      expect(julia.Base.Ptr).toBeInstanceOf(JuliaDataType);
      expect(julia.Base.Cvoid).toBeInstanceOf(JuliaDataType);
      expect(julia.Base.sum).toBeInstanceOf(JuliaFunction);
    });
  });

  it("does not shadow JuliaModule methods with module globals", () => {
    Julia.scope((julia) => {
      expect(typeof julia.Base.lookup).toBe("function");
      expect(julia.Base.lookup("sum")).toBeInstanceOf(JuliaFunction);
    });
  });

  it("allows module globals named like implementation fields", () => {
    Julia.scope((julia) => {
      julia.eval("module JLBunShadowTest; cache = 42; end");
      const module = julia.Main.JLBunShadowTest as JuliaModule;

      expect(module.cache.value).toBe(42n);
      expect(module.lookup("cache").value).toBe(42n);
    });
  });

  it("reuses scoped proxies for cached runtime module globals", () => {
    Julia.scope((julia) => {
      const base1 = julia.Base;
      const base2 = julia.Base;
      const identity1 = base1.identity as JuliaFunction;
      const identity2 = base2.identity as JuliaFunction;
      const int1 = base1.Int64 as JuliaDataType;
      const int2 = base2.Int64 as JuliaDataType;

      expect(base1).toBe(base2);
      expect(identity1).toBe(identity2);
      expect(identity1(41).value).toBe(41n);
      expect(int1).toBe(int2);
      expect(int1(7).value).toBe(7n);
    });
  });

  it("shares raw module global cache without sharing scoped proxies", () => {
    let firstRaw!: JuliaValue;
    let firstScopedProxy!: JuliaFunction;

    Julia.scope((julia) => {
      const identity = julia.Base.identity as JuliaFunction;
      firstRaw = Julia.Base.lookup("identity");
      firstScopedProxy = identity;

      expect(firstRaw).toBeInstanceOf(JuliaFunction);
      expect(getJuliaOwnership(firstRaw)?.kind).toBe("runtime");
    });

    Julia.scope((julia) => {
      const identity = julia.Base.identity as JuliaFunction;

      expect(Julia.Base.lookup("identity")).toBe(firstRaw);
      expect(getJuliaOwnership(firstRaw)?.kind).toBe("runtime");
      expect(identity).not.toBe(firstScopedProxy);
      expect(identity("x").value).toBe("x");
    });

    expect(() => Julia.Base.identity(1)).toThrowError(ScopeRequiredError);
  });

  it("keeps zero-copy TypedArray owners alive for escaped arrays", () => {
    const arr = Julia.scope((julia) => {
      const makeArray = () => new Float64Array([10, 20, 30]);
      return julia.Array.from(makeArray());
    });

    for (let i = 0; i < 5; i++) {
      Julia.unsafe.eval("GC.gc()");
      Bun.gc(true);
    }

    expect(arr.value).toEqual(new Float64Array([10, 20, 30]));
    arr.set(1, 99);
    expect(arr.value).toEqual(new Float64Array([10, 99, 30]));
  });

  it("roots Array{Any} before populating it from JS arrays", () => {
    Julia.scope(() => {
      const arr = JuliaArray.fromAny([1, "two", true]);

      expect(arr.length).toBe(3);
      expect(getJuliaOwnership(arr)?.kind).toBe("scoped");
      expect(arr.get(1).value).toBe("two");
    });
  });

  it("supports unsafe call helpers for low-level internal paths", () => {
    Julia.scope((julia) => {
      const increment = julia.eval("x -> x + 1") as JuliaFunction;
      expect(Julia.unsafe.call(increment, 41)?.value).toBe(42n);

      const parseInt = julia.eval(
        "(x; base = 10) -> parse(Int, x; base)",
      ) as JuliaFunction;
      expect(
        Julia.unsafe.callWithKwargs(parseInt, { base: 16 }, "ff").value,
      ).toBe(255n);

      expect(() =>
        Julia.unsafe.callWithKwargs(parseInt, 1 as unknown as never, "ff"),
      ).toThrow("Keyword arguments must wrap to a NamedTuple");
    });
  });

  it("unsafe call helpers wrap JS collections without an active scope", () => {
    const sum = Julia.unsafe.eval("xs -> sum(xs)") as JuliaFunction;
    expect(Julia.unsafe.call(sum, new Int32Array([1, 2, 3]))?.value).toBe(6n);

    const length = Julia.unsafe.eval("xs -> length(xs)") as JuliaFunction;
    expect(Julia.unsafe.call(length, [1, "two", true])?.value).toBe(3n);

    const parseInt = Julia.unsafe.eval(
      "(x; base = 10) -> parse(Int, x; base)",
    ) as JuliaFunction;
    expect(
      Julia.unsafe.callWithKwargs(parseInt, { base: 16 }, "ff").value,
    ).toBe(255n);

    const kwCount = Julia.unsafe.eval(
      "(; kwargs...) -> length(kwargs)",
    ) as JuliaFunction;
    expect(Julia.unsafe.callWithKwargs(kwCount, {}).value).toBe(0n);
  });

  it("does not retag scoped wrappers from another active scope", () => {
    const ownerScope = new JuliaScope();
    const otherScope = new JuliaScope();

    try {
      const arr = ownerScope.run(() =>
        JuliaArray.from(new Float64Array([1, 2, 3])),
      );

      expect(ownerScope.run(() => Julia.autoWrap(arr))).toBe(arr);
      expect(() => otherScope.run(() => Julia.autoWrap(arr))).toThrow(
        ScopeOwnershipError,
      );
    } finally {
      otherScope.dispose();
      ownerScope.dispose();
    }
  });

  it("does not bind runtime singletons to the first scope that uses them", () => {
    for (const mode of ["default", "safe", "perf"] as const) {
      for (let i = 0; i < 2; i++) {
        Julia.scope(
          (julia) => {
            const dict = julia.Dict.from([["a", 1]]);
            expect(dict.get("missing").value).toBe(null);
          },
          { mode },
        );
      }
    }
  });

  it("marks runtime roots separately from escaped values", () => {
    type JuliaInternals = {
      globals: JuliaValue;
    };

    const runtimeValues = [
      Julia.Any,
      Julia.Nothing,
      Julia.Symbol,
      Julia.Function,
      Julia.String,
      Julia.Bool,
      Julia.Char,
      Julia.Int8,
      Julia.UInt8,
      Julia.Int16,
      Julia.UInt16,
      Julia.Int32,
      Julia.UInt32,
      Julia.Int64,
      Julia.UInt64,
      Julia.Float16,
      Julia.Float32,
      Julia.Float64,
      Julia.DataType,
      Julia.Module,
      Julia.Task,
      Julia.Core,
      Julia.Base,
      Julia.Main,
      Julia.Pkg,
      (Julia as unknown as JuliaInternals).globals,
      JuliaNothing.getInstance(),
      Julia.unsafe.eval("Int64"),
    ];

    for (const value of runtimeValues) {
      expect(getJuliaOwnership(value)?.kind).toBe("runtime");
    }
  });

  it("does not leak temporary roots when wrapping runtime pointers", () => {
    Julia.scope((julia) => {
      const sizeBefore = GCManager.size;

      for (let i = 0; i < 5; i++) {
        expect(Julia.wrapPtr(Julia.Base.ptr)).toBeInstanceOf(JuliaModule);
        expect(Julia.wrapPtr(Julia.Int64.ptr)).toBeInstanceOf(JuliaDataType);
        expect(julia.escape(Julia.Base)).toBe(Julia.Base);
      }

      expect(GCManager.size).toBe(sizeBefore);
      expect(getJuliaOwnership(Julia.Base)?.kind).toBe("runtime");
    });
  });

  it("maps perf stack push failures to -1", () => {
    type PerfPushSymbols = {
      jlbun_gc_perf_push: (ptr: unknown) => bigint;
    };
    const perfPushSymbols = jlbun.symbols as unknown as PerfPushSymbols;
    const originalPerfPush = perfPushSymbols.jlbun_gc_perf_push;

    try {
      perfPushSymbols.jlbun_gc_perf_push = () => 0xffffffffffffffffn;
      expect(GCManager.perfPush(Julia.Base)).toBe(-1);
    } finally {
      perfPushSymbols.jlbun_gc_perf_push = originalPerfPush;
    }
  });

  it("reuses unsafe runtime wrappers across scopes without retagging", () => {
    const dataType = Julia.unsafe.eval("Int64") as JuliaDataType;
    expect(getJuliaOwnership(dataType)?.kind).toBe("runtime");

    for (let i = 0; i < 2; i++) {
      Julia.scope(() => {
        expect(Julia.autoWrap(dataType)).toBe(dataType);
        expect(getJuliaOwnership(dataType)?.kind).toBe("runtime");
      });
    }
  });

  it("reuses the internal globals table across scopes", () => {
    for (let i = 0; i < 2; i++) {
      Julia.scope(
        () => {
          const name = `scopeFirstGlobal${i}`;
          const value = Julia.eval(`${i}`);
          Julia.setGlobal(name, value);
          expect(Julia.getGlobal(name).value).toBe(value.value);
          expect(Julia.deleteGlobal(name)).toBe(true);
        },
        { mode: "safe" },
      );
    }
  });

  it("keeps external owner metadata off the public wrapper surface", () => {
    Julia.scope((julia) => {
      const arr = julia.Array.from(new Float64Array([1, 2, 3]));
      const owner = { label: "typed-array-owner" };

      expect(setJuliaExternalOwner(arr, owner)).toBe(arr);
      expect(getJuliaOwnership(arr)?.owner).toBe(owner);
      expect(Object.keys(arr)).not.toContain("jlbun.ownership");
    });

    const fallbackOwner = { label: "fallback-owner" };
    const fakeValue: JuliaValue = {
      ptr: Julia.Base.ptr,
      get value() {
        return undefined;
      },
      toString() {
        return "fake";
      },
    };

    setJuliaExternalOwner(fakeValue, fallbackOwner);
    expect(getJuliaOwnership(fakeValue)).toMatchObject({
      kind: "borrowed",
      owner: fallbackOwner,
    });
  });

  it("prefetches module exports and reports verbose failures", () => {
    type JuliaInternals = {
      getModuleExports(module: JuliaValue): string[];
      prefetch(module: { name: string; [key: string]: unknown }): void;
      options: { verbosity?: "quiet" | "normal" | "verbose" };
    };

    const JuliaInternal = Julia as unknown as JuliaInternals;
    const names = Julia.scope(() => JuliaInternal.getModuleExports(Julia.Base));
    expect(names).toContain("sum");

    const originalGetModuleExports = JuliaInternal.getModuleExports;
    const originalVerbosity = JuliaInternal.options.verbosity;
    const originalWarn = console.warn;
    const warnings: string[] = [];
    const fakeModule = {
      name: "FakeModule",
      ok: 1,
      get bad1() {
        throw new Error("bad1");
      },
      get bad2() {
        throw new Error("bad2");
      },
      get bad3() {
        throw new Error("bad3");
      },
      get bad4() {
        throw new Error("bad4");
      },
      get bad5() {
        throw new Error("bad5");
      },
      get bad6() {
        throw new Error("bad6");
      },
    };

    try {
      JuliaInternal.getModuleExports = () => [
        "ok",
        "bad1",
        "bad2",
        "bad3",
        "bad4",
        "bad5",
        "bad6",
      ];
      JuliaInternal.options.verbosity = "verbose";
      console.warn = (...args: Parameters<typeof console.warn>) => {
        warnings.push(args.join(" "));
      };

      JuliaInternal.prefetch(fakeModule);
    } finally {
      JuliaInternal.getModuleExports = originalGetModuleExports;
      JuliaInternal.options.verbosity = originalVerbosity;
      console.warn = originalWarn;
    }

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("Failed to prefetch 6 properties");
    expect(warnings[0]).toContain("(+1 more)");
  });

  it("delegates close to GCManager and the native library", () => {
    type CloseBindings = {
      symbols: {
        jl_atexit_hook: (status: number) => void;
      };
      close: () => void;
    };

    const closeBindings = jlbun as unknown as CloseBindings;
    const originalGcClose = GCManager.close;
    const originalAtexitHook = closeBindings.symbols.jl_atexit_hook;
    const originalLibraryClose = closeBindings.close;
    const calls: string[] = [];

    try {
      GCManager.close = () => {
        calls.push("gc");
      };
      closeBindings.symbols.jl_atexit_hook = (status: number) => {
        calls.push(`atexit:${status}`);
      };
      closeBindings.close = () => {
        calls.push("library");
      };

      Julia.close(7);
    } finally {
      GCManager.close = originalGcClose;
      closeBindings.symbols.jl_atexit_hook = originalAtexitHook;
      closeBindings.close = originalLibraryClose;
    }

    expect(calls).toEqual(["gc", "atexit:7", "library"]);
  });
});
