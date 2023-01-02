import { Julia, JuliaNothing, JuliaValue } from "./index.js";

/**
 * Wrapper for Julia `Dict`.
 */
export class JuliaDict implements JuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  has(key: any): boolean {
    return Julia.Base.haskey(this, key).value;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(key: any): JuliaValue {
    return Julia.Base.get(this, key, JuliaNothing.getInstance());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: any, value: any): JuliaValue {
    return Julia.Base["setindex!"](this, value, key);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    return Array.from(this.value.entries());
  }

  toString(): string {
    return `[JuliaDict ${Julia.string(this)}]`;
  }
}
