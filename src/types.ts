import { Julia } from "./julia.js";

export interface WrappedPointer {
  ptr: number;
}

export class JuliaDataType implements WrappedPointer {
  ptr: number;

  constructor(ptr: number) {
    this.ptr = ptr;
  }
}

export class JuliaFunction extends Function implements WrappedPointer {
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
