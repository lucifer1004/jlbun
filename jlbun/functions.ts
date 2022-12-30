import { Julia, JuliaValue } from "./index.js";

export class JuliaFunction extends Function implements JuliaValue {
  ptr: number;
  name: string;

  constructor(ptr: number, name: string) {
    super();
    this.ptr = ptr;
    this.name = name;
    return new Proxy(this, {
      apply: (target, _thisArg, args) => Julia.call(target, ...args),
    });
  }

  get value(): string {
    return this.toString();
  }

  toString(): string {
    return `[JuliaFunction ${this.name}]`;
  }
}
