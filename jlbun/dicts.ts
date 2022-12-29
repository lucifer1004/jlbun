import { IJuliaValue, Julia } from "./index.js";

export class JuliaDict implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  get value(): Map<IJuliaValue, IJuliaValue> {
    const values = Julia.Base.collect(this).value;
    const map = new Map<IJuliaValue, IJuliaValue>();
    for (const value of values) {
      map.set(Julia.Base.first(value), Julia.Base.last(value));
    }
    return map;
  }

  keys(): IJuliaValue[] {
    return Julia.Base.keys(this).value;
  }

  values(): IJuliaValue[] {
    return Julia.Base.values(this).value;
  }

  entries(): [IJuliaValue, IJuliaValue][] {
    return Array.from(this.value.entries());
  }

  toString(): string {
    return `JuliaDict {${this.entries()
      .map(([key, value]) => `${key.toString()} => ${value.toString()}`)
      .join(", ")}}`;
  }
}
