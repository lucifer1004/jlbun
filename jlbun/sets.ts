import { Julia, JuliaValue } from "./index.js";

export class JuliaSet implements JuliaValue {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  has(value: any): boolean {
    return Julia.Base.in(value, this).value;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  add(value: any): void {
    Julia.Base["push!"](this, value);
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
  get value(): Set<any> {
    return new Set(Julia.Base.collect(this).value);
  }

  toString(): string {
    return `[JuliaSet ${Julia.string(this)}]`;
  }
}
