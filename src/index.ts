export interface IJuliaValue {
  ptr: number;
  get value(): any;
  toString(): string;
}

export { jlbun } from "./wrapper.js";
export { safeCString } from "./utils.js";
export { Julia } from "./julia.js";
export { JuliaDataType } from "./types.js";
export { JuliaArray } from "./arrays.js";
export { JuliaFunction } from "./functions.js";
export { JuliaModule } from "./module.js";
export {
  JuliaBool,
  JuliaFloat32,
  JuliaFloat64,
  JuliaInt16,
  JuliaInt32,
  JuliaInt64,
  JuliaInt8,
  JuliaString,
  JuliaUInt16,
  JuliaUInt32,
  JuliaUInt64,
  JuliaUInt8,
  JuliaAny,
} from "./values.js";
export { InexactError, MethodError, UnknownJuliaError } from "./errors.js";
