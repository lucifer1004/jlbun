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

  get value(): string {
    return this.toString();
  }

  toString(): string {
    return `[Function] ${this.name}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _call(...args: any[]): any {
    return Julia.call(this, ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call(...args: any[]): any {
    return Julia.call(this, ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apply(args: any[]): any {
    return Julia.call(this, ...args);
  }
}
