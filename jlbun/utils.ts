import { FFIType, FFITypeOrString, ptr } from "bun:ffi";

export function safeCString(s: string): number {
  return ptr(Buffer.from(s + "\x00"));
}

export function mapFFITypeToJulia(type: FFITypeOrString): string {
  if (type === FFIType.void || type === "void") {
    return "Cvoid";
  } else if (
    type === FFIType.i8 ||
    type === "i8" ||
    type === "int8_t" ||
    type === "char"
  ) {
    return "Int8";
  } else if (type === FFIType.u8 || type === "u8" || type === "uint8_t") {
    return "UInt8";
  } else if (type === FFIType.i16 || type === "i16" || type === "int16_t") {
    return "Int16";
  } else if (type === FFIType.u16 || type === "u16" || type === "uint16_t") {
    return "UInt16";
  } else if (type === FFIType.i32 || type === "i32" || type === "int32_t") {
    return "Int32";
  } else if (type === FFIType.u32 || type === "u32" || type === "uint32_t") {
    return "UInt32";
  } else if (
    type === FFIType.i64 ||
    type === FFIType.i64_fast ||
    type === "i64" ||
    type === "int64_t"
  ) {
    return "Int64";
  } else if (
    type === FFIType.u64 ||
    type === FFIType.u64_fast ||
    type === "u64" ||
    type === "uint64_t"
    // || type === "usize" // TODO: add this after Bun upgrades
  ) {
    return "UInt64";
  } else if (type === FFIType.f32 || type === "f32" || type === "float") {
    return "Float32";
  } else if (type === FFIType.f64 || type === "f64" || type === "double") {
    return "Float64";
  } else if (type === FFIType.bool || type === "bool") {
    return "Bool";
  } else if (type === FFIType.cstring || type === "cstring") {
    return "Cstring";
  } else {
    return "Ptr{Nothing}";
  }
}
