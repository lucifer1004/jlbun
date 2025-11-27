import { Pointer } from "bun:ffi";
import {
  jlbun,
  JuliaFunction,
  JuliaSymbol,
  JuliaValue,
  MethodError,
} from "./index.js";

/**
 * Wrapper for Julia `Module`.
 */
export class JuliaModule implements JuliaValue {
  ptr: Pointer;
  name: string;
  cache: Map<string, JuliaFunction>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  constructor(ptr: Pointer, name: string) {
    this.ptr = ptr;
    this.name = name;
    this.cache = new Map();

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === "ptr") {
          return target.ptr;
        }
        if (prop === "name") {
          return target.name;
        }
        if (prop === "value") {
          return target.value;
        }
        if (prop === "toString") {
          return target.toString;
        }
        if (target.cache.has(prop as string)) {
          return target.cache.get(prop as string);
        }

        const sym = jlbun.symbols.jl_get_global(
          target.ptr,
          JuliaSymbol.from(prop as string).ptr,
        );

        if (sym === null) {
          throw new MethodError(
            `${prop as string} does not exist in module ${target.name}!`,
          );
        }

        const juliaFunc = new JuliaFunction(sym, prop as string);
        target.cache.set(prop as string, juliaFunc);
        return juliaFunc;
      },
    });
  }

  get value(): string {
    return this.toString();
  }

  toString(): string {
    return `[JuliaModule ${this.name}]`;
  }
}
