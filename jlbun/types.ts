import { Pointer } from "bun:ffi";
import { JuliaValue } from "./index.js";

/**
 * Wrapper for Julia `DataType`.
 */
export class JuliaDataType implements JuliaValue {
  ptr: Pointer;
  name: string;

  constructor(ptr: Pointer, name: string) {
    this.ptr = ptr;
    this.name = name;
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
