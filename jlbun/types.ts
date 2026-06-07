import { Pointer } from "bun:ffi";
import { Julia, JuliaValue } from "./index.js";

/**
 * Wrapper for Julia `DataType`.
 */
export class JuliaDataType extends Function implements JuliaValue {
  ptr: Pointer;
  name!: string;

  constructor(ptr: Pointer, name: string) {
    super();
    this.ptr = ptr;
    Object.defineProperty(this, "name", {
      configurable: true,
      value: name,
      writable: false,
    });
    return new Proxy(this, {
      apply: (target, _thisArg, args) => Julia.call(target, ...args),
    });
  }

  get value(): string {
    return this.name;
  }

  isEqual(other: JuliaDataType): boolean {
    return this.ptr === other.ptr;
  }

  toString(): string {
    return `[JuliaDataType ${this.name}]`;
  }
}
