import { IJuliaValue } from "./index.js";

export class JuliaDataType implements IJuliaValue {
  ptr: number;
  name: string;

  constructor(ptr: number, name: string) {
    this.ptr = ptr;
    this.name = name;
  }

  get value(): JuliaDataType {
    return this;
  }

  toString(): string {
    return `[DataType] ${this.name}`;
  }
}
