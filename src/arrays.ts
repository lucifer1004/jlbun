import { jlbun } from "./wrapper.js";
import { WrappedPointer, JuliaDataType } from "./types.js";
import { MethodError } from "./errors.js";

export class JuliaArray implements WrappedPointer {
  ptr: number;

  constructor(type: JuliaDataType, length: number) {
    const arrType = jlbun.symbols.jl_apply_array_type(type.ptr, 1);
    this.ptr = jlbun.symbols.jl_alloc_array_1d(arrType, length);
  }

  get length(): number {
    return Number(jlbun.symbols.jl_array_len_getter(this.ptr));
  }

  get ndims(): number {
    return Number(jlbun.symbols.jl_array_ndims_getter(this.ptr));
  }

  push(value: WrappedPointer): void {
    if (this.ndims === 1) {
      jlbun.symbols.jl_array_ptr_1d_push(this.ptr, value.ptr);
    } else {
      throw new MethodError(
        "`push` is not implemented for arrays with two or more dimensions.",
      );
    }
  }
}
