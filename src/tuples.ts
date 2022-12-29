import { jlbun, Julia, IJuliaValue } from "./index.js";

export class JuliaTuple implements IJuliaValue {
  ptr: number;
  length: number;

  constructor(ptr: number) {
    this.ptr = ptr;
    this.length = jlbun.symbols.jl_nfields_getter(this.ptr);
  }

  get(index: number): IJuliaValue {
    return Julia.wrap(jlbun.symbols.jl_get_nth_field(this.ptr, index));
  }

  get value(): any[] {
    const len = this.length;
    let arr = [];
    for (let i = 0; i < len; i++) {
      arr.push(this.get(i).value);
    }
    return arr;
  }

  toString(): string {
    return this.value.toString();
  }
}
