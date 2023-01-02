import { Julia, JuliaValue } from "./index.js";

/**
 * Wrapper for Julia `Set`s.
 */
export class JuliaSet implements JuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  public static from(values: IterableIterator<unknown> | unknown[]): JuliaSet {
    const set = Julia.Base.Set() as JuliaSet;
    for (const value of values) {
      set.add(value);
    }
    return set;
  }

  has(value: unknown): boolean {
    return Julia.Base.in(value, this).value;
  }

  add(value: unknown): void {
    Julia.Base["push!"](this, value);
  }

  delete(value: unknown): boolean {
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

  get value(): Set<unknown> {
    return new Set(Julia.Base.collect(this).value);
  }

  toString(): string {
    return `[JuliaSet ${Julia.string(this)}]`;
  }
}
