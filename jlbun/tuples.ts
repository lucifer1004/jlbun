/* eslint-disable @typescript-eslint/no-explicit-any */
import { jlbun, Julia, JuliaFunction, JuliaValue } from "./index.js";

/**
 * Wrapper for Julia `Tuple`.
 */
export class JuliaTuple implements JuliaValue {
  ptr: number;
  length: number;

  constructor(ptr: number) {
    this.ptr = ptr;
    this.length = Number(jlbun.symbols.jl_nfields_getter(this.ptr));
  }

  static from(...args: any[]): JuliaTuple {
    return Julia.Core.tuple(...args);
  }

  get(index: number): JuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, index));
  }

  get value(): any[] {
    return Array.from({ length: this.length }, (_, i) => this.get(i).value);
  }

  toString(): string {
    return Julia.string(this);
  }
}

/**
 * Wrapper for Julia `Pair`.
 */
export class JuliaPair implements JuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  static from(first: any, second: any): JuliaPair {
    return Julia.Base.Pair(first, second);
  }

  get first(): JuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, 0));
  }

  get second(): JuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, 1));
  }

  get value(): [any, any] {
    return [this.first.value, this.second.value];
  }

  toString(): string {
    return Julia.string(this);
  }
}

/**
 * Wrapper for Julia `NamedTuple`.
 */
export class JuliaNamedTuple implements JuliaValue {
  ptr: number;
  length: number;
  fieldNames: string[];

  constructor(ptr: number, fieidNames?: string[]) {
    this.ptr = ptr;

    if (fieidNames === undefined) {
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
    } else {
      this.length = fieidNames.length;
      this.fieldNames = fieidNames;
    }
  }

  public static from(obj: Record<string, any>): JuliaNamedTuple {
    const keys = Array.from(Object.keys(obj));
    if (keys.length === 0) {
      return Julia.Core.NamedTuple() as JuliaNamedTuple;
    }

    const tupleType = Julia.eval(
      `NamedTuple{(${keys.map((key) => `Symbol("${key}")`).join(",")},)}`,
    );
    const values = JuliaTuple.from(...keys.map((key) => obj[key]));
    const ptr = jlbun.symbols.jl_call1(tupleType.ptr, values.ptr);
    Julia.handleCallException(tupleType as JuliaFunction, [values]);
    return new JuliaNamedTuple(ptr, keys);
  }

  get(index: number): JuliaValue {
    return Julia.wrapPtr(jlbun.symbols.jl_get_nth_field(this.ptr, index));
  }

  get value(): Record<string, any> {
    const len = this.length;

    const obj = {} as Record<string, any>;
    for (let i = 0; i < len; i++) {
      obj[this.fieldNames[i]] = this.get(i).value;
    }
    return obj;
  }

  toString(): string {
    return Julia.string(this);
  }
}
