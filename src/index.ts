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
export { JuliaTuple, JuliaNamedTuple } from "./tuples.js";
export {
  JuliaAny,
  JuliaBool,
  JuliaFloat32,
  JuliaFloat64,
  JuliaInt16,
  JuliaInt32,
  JuliaInt64,
  JuliaInt8,
  JuliaNothing,
  JuliaString,
  JuliaSymbol,
  JuliaUInt16,
  JuliaUInt32,
  JuliaUInt64,
  JuliaUInt8,
} from "./values.js";
export { InexactError, MethodError, UnknownJuliaError } from "./errors.js";
