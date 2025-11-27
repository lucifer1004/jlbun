/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pointer } from "bun:ffi";
import { Julia, JuliaValue } from "./index.js";

/**
 * Wrapper for Julia `Set`s.
 */
export class JuliaSet implements JuliaValue {
  ptr: Pointer;

  constructor(ptr: Pointer) {
    this.ptr = ptr;
  }

  public static from(values: IterableIterator<any> | any[]): JuliaSet {
    const set = Julia.Base.Set() as JuliaSet;
    for (const value of values) {
      set.add(value);
    }
    return set;
  }

  has(value: any): boolean {
    return Julia.Base.in(value, this).value;
  }

  add(value: any): void {
    Julia.Base["push!"](this, value);
  }

  delete(value: any): boolean {
    if (this.has(value)) {
      Julia.Base["pop!"](this, value);
      return true;
    } else {
      return false;
    }
  }

  get size(): number {
    return Number(Julia.Base.length(this).value);
  }

  get value(): Set<any> {
    return new Set(Julia.Base.collect(this).value);
  }

  toString(): string {
    return `[JuliaSet ${Julia.string(this)}]`;
  }
}
