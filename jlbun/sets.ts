import { IJuliaValue, Julia } from "./index.js";

export class JuliaSet implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  get value(): Set<IJuliaValue> {
    const values = Julia.Base.collect(this).value;
    return new Set(values);
  }

  toString(): string {
    return `JuliaSet {${Array.from(this.value.values())
      .map((value) => value.toString())
      .join(", ")}}`;
  }
}
