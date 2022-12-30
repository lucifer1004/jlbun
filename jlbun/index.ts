export interface IJuliaValue {
  ptr: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): any;
  toString(): string;
}

export { JuliaArray } from "./arrays.js";
export { JuliaDict } from "./dicts.js";
export { InexactError, MethodError, UnknownJuliaError } from "./errors.js";
export { JuliaFunction } from "./functions.js";
export { Julia } from "./julia.js";
export { JuliaValue } from "./mixins.js";
export { JuliaModule } from "./module.js";
export { JuliaSet } from "./sets.js";
export { JuliaNamedTuple, JuliaPair, JuliaTuple } from "./tuples.js";
export { JuliaDataType } from "./types.js";
export { safeCString } from "./utils.js";
export {
  JuliaAny,
  JuliaBool,
  JuliaFloat32,
  JuliaFloat64,
  JuliaInt8,
  JuliaInt16,
  JuliaInt32,
  JuliaInt64,
  JuliaNothing,
  JuliaString,
  JuliaSymbol,
  JuliaUInt8,
  JuliaUInt16,
  JuliaUInt32,
  JuliaUInt64,
} from "./values.js";
export { jlbun } from "./wrapper.js";
