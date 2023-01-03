/* eslint-disable @typescript-eslint/no-explicit-any */
import { Julia, JuliaNothing, JuliaValue } from "./index.js";

/**
 * Wrapper for Julia `Dict`.
 */
export class JuliaDict implements JuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  public static from(
    map: IterableIterator<[any, any]> | [any, any][],
  ): JuliaDict {
    const dict = Julia.Base.Dict() as JuliaDict;
    for (const [key, value] of map) {
      dict.set(key, value);
    }
    return dict;
  }

  has(key: any): boolean {
    return Julia.Base.haskey(this, key).value;
  }

  get(key: any): JuliaValue {
    return Julia.Base.get(this, key, JuliaNothing.getInstance());
  }

  set(key: any, value: any): JuliaValue {
    return Julia.Base["setindex!"](this, value, key);
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

  get value(): Map<any, any> {
    return new Map(Julia.Base.collect(this).value);
  }

  keys(): JuliaValue[] {
    return Julia.Base.keys(this).value;
  }

  values(): JuliaValue[] {
    return Julia.Base.values(this).value;
  }

  entries(): [JuliaValue, JuliaValue][] {
    return Array.from(this.value.entries()) as [JuliaValue, JuliaValue][];
  }

  toString(): string {
    return `[JuliaDict ${Julia.string(this)}]`;
  }
}

export class JuliaIdDict extends JuliaDict {
  constructor(ptr: number) {
    super(ptr);
  }

  public static from(
    map: IterableIterator<[any, any]> | [any, any][],
  ): JuliaIdDict {
    const dict = Julia.Base.IdDict() as JuliaIdDict;
    for (const [key, value] of map) {
      dict.set(key, value);
    }
    return dict;
  }

  toString(): string {
    return `[JuliaIdDict ${Julia.string(this)}]`;
  }
}
