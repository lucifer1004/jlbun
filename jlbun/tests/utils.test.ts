import { FFIType } from "bun:ffi";
import { beforeAll, describe, expect, it } from "bun:test";
import { InexactError, MethodError, UnknownJuliaError } from "../errors.js";
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
  it("InexactError can be thrown and caught", () => {
    expect(() => {
      throw new InexactError("test error");
    }).toThrow(InexactError);
  });

  it("MethodError can be thrown and caught", () => {
    expect(() => {
      throw new MethodError("test error");
    }).toThrow(MethodError);
  });

  it("UnknownJuliaError can be thrown and caught", () => {
    expect(() => {
      throw new UnknownJuliaError("test error");
    }).toThrow(UnknownJuliaError);
  });
});
