import { Pointer } from "bun:ffi";
import {
  GCManager,
  jlbun,
  Julia,
  JuliaDataType,
  JuliaFunction,
  JuliaSymbol,
  JuliaValue,
  MethodError,
} from "./index.js";
import {
  getJuliaOwnership,
  isPersistentJuliaValue,
  markJuliaRuntimeValue,
} from "./ownership.js";

export const JULIA_MODULE_CACHE = Symbol("jlbun.module.cache");

const RESERVED_MODULE_PROPS = new Set([
  "ptr",
  "name",
  "value",
  "toString",
  "lookup",
  "constructor",
  "hasOwnProperty",
]);

/**
 * Wrapper for Julia `Module`.
 */
export class JuliaModule implements JuliaValue {
  ptr: Pointer;
  name: string;
  [JULIA_MODULE_CACHE]: Map<string, JuliaValue>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  constructor(ptr: Pointer, name: string) {
    this.ptr = ptr;
    this.name = name;
    this[JULIA_MODULE_CACHE] = new Map();

    return new Proxy(this, {
      get: (target, prop) => {
        if (typeof prop !== "string") {
          return Reflect.get(target, prop);
        }
        if (RESERVED_MODULE_PROPS.has(prop)) {
          return Reflect.get(target, prop);
        }

        return target.lookup(prop);
      },
    });
  }

  lookup(prop: string): JuliaValue {
    const cache = this[JULIA_MODULE_CACHE];
    const cached = cache.get(prop);
    if (cached !== undefined) {
      return cached;
    }

    const sym = jlbun.symbols.jl_get_global(
      this.ptr,
      JuliaSymbol.from(prop).ptr,
    );

    if (sym === null) {
      throw new MethodError(`${prop} does not exist in module ${this.name}!`);
    }

    const value = Julia.wrapPtr(sym);
    if (isPersistentJuliaValue(value)) {
      cache.set(prop, value);
    } else if (
      value instanceof JuliaFunction ||
      value instanceof JuliaDataType ||
      value instanceof JuliaModule
    ) {
      const ownership = getJuliaOwnership(value);
      if (ownership?.kind === "scoped" && ownership.idx !== undefined) {
        if (ownership.scope?.isPerfMode) {
          ownership.scope.releaseProtectedPointer(ownership.idx);
        } else {
          GCManager.release(ownership.idx);
        }
      }
      markJuliaRuntimeValue(value);
      cache.set(prop, value);
    }
    return value;
  }

  get value(): string {
    return this.toString();
  }

  toString(): string {
    return `[JuliaModule ${this.name}]`;
  }
}
