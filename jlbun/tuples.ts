import { jlbun, Julia, JuliaArray, JuliaSymbol, JuliaValue } from "./index.js";

export class JuliaTuple implements JuliaValue {
  ptr: number;
  length: number;

  constructor(ptr: number) {
    this.ptr = ptr;
    this.length = jlbun.symbols.jl_nfields_getter(this.ptr);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static from(...args: any[]): JuliaTuple {
    return Julia.Core.tuple(...args);
  }

  get(index: number): JuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, index));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): any[] {
    return Array.from({ length: this.length }, (_, i) => this.get(i).value);
  }

  toString(): string {
    return Julia.string(this);
  }
}

export class JuliaPair implements JuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static from(first: any, second: any): JuliaPair {
    return Julia.Base.Pair(first, second);
  }

  get first(): JuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, 0));
  }

  get second(): JuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, 1));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): [any, any] {
    return [this.first.value, this.second.value];
  }

  toString(): string {
    return Julia.string(this);
  }
}

export class JuliaNamedTuple implements JuliaValue {
  ptr: number;
  length: number;
  fieldNames: string[];

  constructor(ptr: number) {
    this.ptr = ptr;
    this.length = Number(jlbun.symbols.jl_nfields_getter(this.ptr));
    const fieldNamesStr: string = Julia.Base.fieldnames(
      Julia.Base.typeof(this),
    ).toString();
    const fieldNamesStrTrimmed = fieldNamesStr.substring(
      1,
      fieldNamesStr.length - 1,
    );
    this.fieldNames = fieldNamesStrTrimmed
      .split(", ")
      .map((s) => s.substring(1, s.length));
  }

  public static from(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj: Record<string, any>,
  ): JuliaNamedTuple {
    const arr = JuliaArray.init(Julia.Any, 0);
    for (const k of Object.keys(obj)) {
      arr.push(JuliaPair.from(JuliaSymbol.from(k), obj[k]));
    }
    return Julia.Core.NamedTuple(arr);
  }

  get(index: number): JuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, index));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): Map<string, any> {
    const len = this.length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = new Map<string, any>();
    for (let i = 0; i < len; i++) {
      obj.set(this.fieldNames[i], this.get(i).value);
    }
    return obj;
  }

  toString(): string {
    return Julia.string(this);
  }
}
