import { Pointer } from "bun:ffi";

export interface JuliaValue {
  ptr: Pointer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): any;
  toString(): string;
}

/**
 * Options for Julia initialization.
 *
 * - `bindir` and `sysimage`: these two can be combined to use a pre-compiled sysimage to initialize Julia. This can save time for first execution.
 * - `project`: specify the Julia project to use. Default to `""`, meaning to use the default Julia project. Setting to `null` will create a temporary directory and use it as the project root. Setting to other `string` values will use the string passed in as the root directory of the project. Note that the project directory does not relate to the working directory.
 */
export interface JuliaOptions {
  bindir: string;
  sysimage: string;
  project: string | null;
  verbosity?: "quiet" | "normal" | "verbose";
  prefetchFilter?: boolean;
}

export {
  type BunArray,
  type FromBunArrayOptions,
  JuliaArray,
} from "./arrays.js";
export { JuliaDict, JuliaIdDict } from "./dicts.js";
export {
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
} from "./errors.js";
export { JuliaFunction } from "./functions.js";
export { Julia, MIME } from "./julia.js";
export { JuliaModule } from "./modules.js";
export { JuliaRange } from "./ranges.js";
export { JuliaSet } from "./sets.js";
export { JuliaSubArray } from "./subarrays.js";
export { JuliaTask } from "./tasks.js";
export { JuliaNamedTuple, JuliaPair, JuliaTuple } from "./tuples.js";
export { JuliaDataType } from "./types.js";
export { safeCString } from "./utils.js";
export {
  JuliaAny,
  JuliaBool,
  JuliaChar,
  JuliaFloat16,
  JuliaFloat32,
  JuliaFloat64,
  JuliaInt8,
  JuliaInt16,
  JuliaInt32,
  JuliaInt64,
  JuliaNothing,
  JuliaPtr,
  JuliaString,
  JuliaSymbol,
  JuliaUInt8,
  JuliaUInt16,
  JuliaUInt32,
  JuliaUInt64,
} from "./values.js";
export { jlbun } from "./wrapper.js";

// Re-export types for external use (ScopedJulia is the interface for scope callbacks)
export { GCManager } from "./gc.js";
export {
  JuliaScope,
  type ScopedJulia,
  type ScopedJuliaArray,
  type ScopedJuliaDict,
  type ScopedJuliaNamedTuple,
  type ScopedJuliaSet,
  type ScopedJuliaTuple,
} from "./scope.js";
