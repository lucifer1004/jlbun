import { FFIType } from "bun:ffi";
import { beforeAll, describe, expect, it } from "bun:test";
import {
  ArgumentError,
  BoundsError,
  createJuliaError,
  DimensionMismatch,
  DivideError,
  DomainError,
  InexactError,
  InterruptException,
  JuliaError,
  KeyError,
  LoadError,
  MethodError,
  OverflowError,
  StackOverflowError,
  StringIndexError,
  TaskFailedException,
  TypeError,
  UndefRefError,
  UndefVarError,
  UnknownJuliaError,
} from "../errors.js";
import { Julia, JuliaArray, JuliaDict } from "../index.js";
import { mapFFITypeToJulia } from "../utils.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

describe("mapFFITypeToJulia coverage", () => {
  it("maps void types", () => {
    expect(mapFFITypeToJulia(FFIType.void)).toBe("Cvoid");
    expect(mapFFITypeToJulia("void")).toBe("Cvoid");
  });

  it("maps i8/char types", () => {
    expect(mapFFITypeToJulia(FFIType.i8)).toBe("Int8");
    expect(mapFFITypeToJulia("i8")).toBe("Int8");
    expect(mapFFITypeToJulia("int8_t")).toBe("Int8");
    expect(mapFFITypeToJulia("char")).toBe("Int8");
  });

  it("maps u8 types", () => {
    expect(mapFFITypeToJulia(FFIType.u8)).toBe("UInt8");
    expect(mapFFITypeToJulia("u8")).toBe("UInt8");
    expect(mapFFITypeToJulia("uint8_t")).toBe("UInt8");
  });

  it("maps i16 types", () => {
    expect(mapFFITypeToJulia(FFIType.i16)).toBe("Int16");
    expect(mapFFITypeToJulia("i16")).toBe("Int16");
    expect(mapFFITypeToJulia("int16_t")).toBe("Int16");
  });

  it("maps u16 types", () => {
    expect(mapFFITypeToJulia(FFIType.u16)).toBe("UInt16");
    expect(mapFFITypeToJulia("u16")).toBe("UInt16");
    expect(mapFFITypeToJulia("uint16_t")).toBe("UInt16");
  });

  it("maps i32 types", () => {
    expect(mapFFITypeToJulia(FFIType.i32)).toBe("Int32");
    expect(mapFFITypeToJulia("i32")).toBe("Int32");
    expect(mapFFITypeToJulia("int32_t")).toBe("Int32");
  });

  it("maps u32 types", () => {
    expect(mapFFITypeToJulia(FFIType.u32)).toBe("UInt32");
    expect(mapFFITypeToJulia("u32")).toBe("UInt32");
    expect(mapFFITypeToJulia("uint32_t")).toBe("UInt32");
  });

  it("maps i64 types", () => {
    expect(mapFFITypeToJulia(FFIType.i64)).toBe("Int64");
    expect(mapFFITypeToJulia(FFIType.i64_fast)).toBe("Int64");
    expect(mapFFITypeToJulia("i64")).toBe("Int64");
    expect(mapFFITypeToJulia("int64_t")).toBe("Int64");
  });

  it("maps u64 types", () => {
    expect(mapFFITypeToJulia(FFIType.u64)).toBe("UInt64");
    expect(mapFFITypeToJulia(FFIType.u64_fast)).toBe("UInt64");
    expect(mapFFITypeToJulia("u64")).toBe("UInt64");
    expect(mapFFITypeToJulia("uint64_t")).toBe("UInt64");
    expect(mapFFITypeToJulia("usize")).toBe("UInt64");
  });

  it("maps f32 types", () => {
    expect(mapFFITypeToJulia(FFIType.f32)).toBe("Float32");
    expect(mapFFITypeToJulia("f32")).toBe("Float32");
    expect(mapFFITypeToJulia("float")).toBe("Float32");
  });

  it("maps f64 types", () => {
    expect(mapFFITypeToJulia(FFIType.f64)).toBe("Float64");
    expect(mapFFITypeToJulia("f64")).toBe("Float64");
    expect(mapFFITypeToJulia("double")).toBe("Float64");
  });

  it("maps bool types", () => {
    expect(mapFFITypeToJulia(FFIType.bool)).toBe("Bool");
    expect(mapFFITypeToJulia("bool")).toBe("Bool");
  });

  it("maps cstring types", () => {
    expect(mapFFITypeToJulia(FFIType.cstring)).toBe("Cstring");
    expect(mapFFITypeToJulia("cstring")).toBe("Cstring");
  });

  it("maps unknown types to Ptr{Nothing}", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(mapFFITypeToJulia("unknown_type" as any)).toBe("Ptr{Nothing}");
    expect(mapFFITypeToJulia(FFIType.ptr)).toBe("Ptr{Nothing}");
  });
});

describe("Error classes", () => {
  it("all error classes extend JuliaError", () => {
    const errors = [
      new InexactError("test"),
      new MethodError("test"),
      new BoundsError("test"),
      new ArgumentError("test"),
      new TypeError("test"),
      new DomainError("test"),
      new DivideError("test"),
      new OverflowError("test"),
      new KeyError("test"),
      new LoadError("test"),
      new StringIndexError("test"),
      new StackOverflowError("test"),
      new DimensionMismatch("test"),
      new UndefVarError("test"),
      new UndefRefError("test"),
      new TaskFailedException("test"),
      new InterruptException("test"),
      new UnknownJuliaError("test"),
    ];

    for (const err of errors) {
      expect(err).toBeInstanceOf(JuliaError);
      expect(err).toBeInstanceOf(Error);
      expect(err.juliaType).toBeDefined();
    }
  });

  it("InexactError has correct properties", () => {
    const err = new InexactError("test error");
    expect(err.name).toBe("InexactError");
    expect(err.juliaType).toBe("InexactError");
    expect(err.message).toBe("test error");
    expect(() => {
      throw err;
    }).toThrow(InexactError);
  });

  it("MethodError has correct properties", () => {
    const err = new MethodError("test error");
    expect(err.name).toBe("MethodError");
    expect(err.juliaType).toBe("MethodError");
    expect(() => {
      throw err;
    }).toThrow(MethodError);
  });

  it("BoundsError has correct properties", () => {
    const err = new BoundsError("index out of bounds");
    expect(err.name).toBe("BoundsError");
    expect(err.juliaType).toBe("BoundsError");
    expect(() => {
      throw err;
    }).toThrow(BoundsError);
  });

  it("UnknownJuliaError stores original Julia type", () => {
    const err = new UnknownJuliaError("message", "CustomJuliaError");
    expect(err.name).toBe("UnknownJuliaError");
    expect(err.juliaType).toBe("CustomJuliaError");
  });
});

describe("createJuliaError factory", () => {
  it("creates InexactError for InexactError type", () => {
    const err = createJuliaError("InexactError", "cannot convert");
    expect(err).toBeInstanceOf(InexactError);
    expect(err.message).toBe("cannot convert");
  });

  it("creates MethodError for MethodError type", () => {
    const err = createJuliaError("MethodError", "no method");
    expect(err).toBeInstanceOf(MethodError);
  });

  it("creates BoundsError for BoundsError type", () => {
    const err = createJuliaError("BoundsError", "index out of bounds");
    expect(err).toBeInstanceOf(BoundsError);
  });

  it("creates ArgumentError for ArgumentError type", () => {
    const err = createJuliaError("ArgumentError", "invalid argument");
    expect(err).toBeInstanceOf(ArgumentError);
  });

  it("creates DomainError for DomainError type", () => {
    const err = createJuliaError("DomainError", "domain error");
    expect(err).toBeInstanceOf(DomainError);
  });

  it("creates DivideError for DivideError type", () => {
    const err = createJuliaError("DivideError", "divide by zero");
    expect(err).toBeInstanceOf(DivideError);
  });

  it("creates KeyError for KeyError type", () => {
    const err = createJuliaError("KeyError", "key not found");
    expect(err).toBeInstanceOf(KeyError);
  });

  it("creates DimensionMismatch for DimensionMismatch type", () => {
    const err = createJuliaError("DimensionMismatch", "dimensions mismatch");
    expect(err).toBeInstanceOf(DimensionMismatch);
  });

  it("creates UndefVarError for UndefVarError type", () => {
    const err = createJuliaError("UndefVarError", "undefined variable");
    expect(err).toBeInstanceOf(UndefVarError);
  });

  it("creates UnknownJuliaError for unknown types", () => {
    const err = createJuliaError("SomeRandomError", "random error");
    expect(err).toBeInstanceOf(UnknownJuliaError);
    expect(err.juliaType).toBe("SomeRandomError");
  });

  it("creates all other error types correctly", () => {
    expect(createJuliaError("TypeError", "msg")).toBeInstanceOf(TypeError);
    expect(createJuliaError("OverflowError", "msg")).toBeInstanceOf(
      OverflowError,
    );
    expect(createJuliaError("LoadError", "msg")).toBeInstanceOf(LoadError);
    expect(createJuliaError("StringIndexError", "msg")).toBeInstanceOf(
      StringIndexError,
    );
    expect(createJuliaError("StackOverflowError", "msg")).toBeInstanceOf(
      StackOverflowError,
    );
    expect(createJuliaError("UndefRefError", "msg")).toBeInstanceOf(
      UndefRefError,
    );
    expect(createJuliaError("TaskFailedException", "msg")).toBeInstanceOf(
      TaskFailedException,
    );
    expect(createJuliaError("InterruptException", "msg")).toBeInstanceOf(
      InterruptException,
    );
  });
});

describe("Julia errors thrown from actual Julia calls", () => {
  it("throws BoundsError for out-of-bounds array access", () => {
    const arr = JuliaArray.from(new Float64Array([1, 2, 3]));
    expect(() => Julia.Base.getindex(arr, 10)).toThrow(BoundsError);
  });

  it("throws DomainError for sqrt of negative number", () => {
    expect(() => Julia.Base.sqrt(-1)).toThrow(DomainError);
  });

  it("throws DivideError for integer division by zero", () => {
    expect(() => Julia.Base.div(1, 0)).toThrow(DivideError);
  });

  it("throws KeyError for missing dictionary key", () => {
    const dict = JuliaDict.from([["a", 1]]);
    expect(() => Julia.Base.getindex(dict, "nonexistent")).toThrow(KeyError);
  });

  it("throws UndefVarError for undefined variable", () => {
    expect(() => Julia.eval("__nonexistent_variable_12345__")).toThrow(
      UndefVarError,
    );
  });

  it("throws ArgumentError for invalid argument", () => {
    expect(() => Julia.Base.zeros(-1)).toThrow(ArgumentError);
  });

  it("throws MethodError for wrong argument type", () => {
    expect(() => Julia.Base.sqrt("not a number")).toThrow(MethodError);
  });
});
