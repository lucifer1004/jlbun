import { IJuliaValue, Julia } from "./index.js";

export class JuliaDict implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): Map<any, any> {
    const values = Julia.Base.collect(this).value;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<any, any>();
    for (const value of values) {
      map.set(Julia.Base.first(value).value, Julia.Base.last(value).value);
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
    return `[JuliaDict ${Julia.string(this)}`;
  }
}
