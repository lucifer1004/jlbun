import { Julia, JuliaValue } from "./index.js";

export class JuliaSet implements JuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): Set<any> {
    const values = Julia.Base.collect(this).value;
    return new Set(values.map((value: JuliaValue) => value.value));
  }

  toString(): string {
    return `[JuliaSet ${Julia.string(this)}]`;
  }
}
