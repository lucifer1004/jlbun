import { IJuliaValue, jlbun, Julia, JuliaSymbol } from "./index.js";

export class JuliaTuple implements IJuliaValue {
  ptr: number;
  length: number;

  constructor(ptr: number) {
    this.ptr = ptr;
    this.length = jlbun.symbols.jl_nfields_getter(this.ptr);
  }

  get(index: number): IJuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, index));
  }

  get value(): IJuliaValue[] {
    const len = this.length;
    const arr = [];
    for (let i = 0; i < len; i++) {
      arr.push(this.get(i));
    }
    return arr;
  }

  toString(): string {
    return `(${this.value.map((x) => x.toString()).join(", ")})`;
  }
}

export class JuliaPair implements IJuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  get first(): IJuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, 0));
  }

  get second(): IJuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, 1));
  }

  get value(): [IJuliaValue, IJuliaValue] {
    return [this.first, this.second];
  }

  toString(): string {
    return `${this.first.toString()} => ${this.second.toString()}`;
  }
}

export class JuliaNamedTuple implements IJuliaValue {
  ptr: number;
  length: number;
  fieldNames: string[];

  constructor(ptr: number) {
    this.ptr = ptr;
    this.length = Number(jlbun.symbols.jl_nfields_getter(this.ptr));
    this.fieldNames = Julia.Base.fieldnames(Julia.Base.typeof(this)).value.map(
      (x: JuliaSymbol) => x.name,
    );
  }

  get(index: number): IJuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, index));
  }

  get value(): Map<string, IJuliaValue> {
    const len = this.length;
    const obj = new Map<string, IJuliaValue>();
    for (let i = 0; i < len; i++) {
      obj.set(this.fieldNames[i], this.get(i));
    }
    return obj;
  }

  toString(): string {
    return `(${Array.from(this.value.entries())
      .map(([key, value]) => `${key} = ${value.toString()}`)
      .join(", ")})`;
  }
}
