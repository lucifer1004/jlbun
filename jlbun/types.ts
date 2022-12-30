import { JuliaValue } from "./index.js";

export class JuliaDataType implements JuliaValue {
  ptr: number;
  name: string;

  constructor(ptr: number, name: string) {
    this.ptr = ptr;
    this.name = name;
  }

  get value(): string {
    return this.toString();
  }

  isEqual(other: JuliaDataType): boolean {
    return this.ptr === other.ptr;
  }
}
