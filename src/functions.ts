import { IJuliaValue, Julia } from "./index.js";

export class JuliaFunction extends Function implements IJuliaValue {
  ptr: number;
  name: string;

  constructor(ptr: number, name: string) {
    super();
    this.ptr = ptr;
    this.name = name;
    return new Proxy(this, {
      apply: (target, _thisArg, args) => target._call(...args),
    });
  }

  get value(): JuliaFunction {
    return this;
  }

  toString(): string {
    return `[Function] ${this.name}`;
  }

  _call(...args: any[]): any {
    return Julia.call(this, ...args);
  }

  call(...args: any[]): any {
    return Julia.call(this, ...args);
  }

  apply(args: any[]): any {
    return Julia.call(this, ...args);
  }
}
