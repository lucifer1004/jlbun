import { dlopen, FFIType, suffix } from "bun:ffi";
import { join } from "path";

const LIBJLBUN_PATH = join(
  import.meta.dir,
  "..",
  "build",
  `libjlbun.${suffix}`,
);

export const jlbun = dlopen(LIBJLBUN_PATH, {
  // Init
  jl_init0: {
    args: [],
    returns: FFIType.void,
  },
  jl_init_with_image0: {
    args: [FFIType.cstring, FFIType.cstring],
    returns: FFIType.void,
  },

  // Data types
  jl_any_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_nothing_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_symbol_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_function_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_string_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_bool_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_char_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_int8_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_uint8_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_int16_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_uint16_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_int32_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_uint32_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_int64_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_uint64_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_float16_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_float32_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_float64_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_datatype_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_module_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_task_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  // Complex type getters
  jl_complexf64_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_complexf32_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_complexf16_type_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  // Get first type parameter (for Complex{T}, returns T)
  jl_tparam0_getter: {
    args: [FFIType.ptr], // jl_datatype_t*
    returns: FFIType.ptr, // jl_value_t* (the type parameter)
  },

  // Modules
  jl_main_module_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_base_module_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_core_module_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_top_module_getter: {
    args: [],
    returns: FFIType.ptr,
  },

  // Builtins
  jl_hasproperty: {
    args: [FFIType.ptr, FFIType.cstring],
    returns: FFIType.i8,
  },
  jl_propertycount: {
    args: [FFIType.ptr],
    returns: FFIType.i64,
  },
  jl_propertynames: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_nothing_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_true_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_false_getter: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_symbol_name_getter: {
    args: [FFIType.ptr],
    returns: FFIType.cstring,
  },
  jl_nfields_getter: {
    args: [FFIType.ptr],
    returns: FFIType.i64,
  },
  jl_typeof_getter: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },

  // Functions
  jl_function_getter: {
    args: [FFIType.ptr, FFIType.cstring],
    returns: FFIType.ptr,
  },

  // Arrays
  jl_array_len_getter: {
    args: [FFIType.ptr],
    returns: FFIType.i64,
  },
  jl_array_length: {
    args: [FFIType.ptr],
    returns: FFIType.u64,
  },
  jl_array_ndims_getter: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_array_data_getter: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_array_dim_getter: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.i64,
  },

  // Array element access
  jl_array_ptr_ref_wrapper: {
    args: [FFIType.ptr, FFIType.u64],
    returns: FFIType.ptr,
  },
  jl_array_ptr_set_wrapper: {
    args: [FFIType.ptr, FFIType.u64, FFIType.ptr],
    returns: FFIType.void,
  },

  // Stack-based GC Root Management
  jlbun_gc_init: {
    args: [FFIType.u64], // initial_capacity
    returns: FFIType.void,
  },
  jlbun_gc_mark: {
    args: [],
    returns: FFIType.u64, // current stack position
  },
  jlbun_gc_push: {
    args: [FFIType.ptr], // value to protect
    returns: FFIType.u64, // index in stack
  },
  jlbun_gc_release: {
    args: [FFIType.u64], // mark to release to
    returns: FFIType.void,
  },
  jlbun_gc_swap: {
    args: [FFIType.u64, FFIType.u64], // from_idx, to_idx
    returns: FFIType.void,
  },
  jlbun_gc_get: {
    args: [FFIType.u64], // index
    returns: FFIType.ptr, // value at index
  },
  jlbun_gc_set: {
    args: [FFIType.u64, FFIType.ptr], // index, value
    returns: FFIType.void,
  },
  jlbun_gc_size: {
    args: [],
    returns: FFIType.u64,
  },
  jlbun_gc_capacity: {
    args: [],
    returns: FFIType.u64,
  },
  jlbun_gc_is_initialized: {
    args: [],
    returns: FFIType.i32,
  },
  jlbun_gc_close: {
    args: [],
    returns: FFIType.void,
  },

  // Auto generated wrappers
  jl_gc_enable: {
    args: [FFIType.i32],
    returns: FFIType.i32,
  },
  jl_gc_is_enabled: {
    args: [],
    returns: FFIType.i32,
  },
  jl_gc_collect: {
    args: [FFIType.i32],
    returns: FFIType.void,
  },
  jl_typeof_str: {
    args: [FFIType.ptr],
    returns: FFIType.cstring,
  },
  jl_symbol: {
    args: [FFIType.cstring],
    returns: FFIType.ptr,
  },
  jl_box_bool: {
    args: [FFIType.i8],
    returns: FFIType.ptr,
  },
  jl_box_int8: {
    args: [FFIType.i8],
    returns: FFIType.ptr,
  },
  jl_box_uint8: {
    args: [FFIType.u8],
    returns: FFIType.ptr,
  },
  jl_box_int16: {
    args: [FFIType.i16],
    returns: FFIType.ptr,
  },
  jl_box_uint16: {
    args: [FFIType.u16],
    returns: FFIType.ptr,
  },
  jl_box_int32: {
    args: [FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_box_uint32: {
    args: [FFIType.u32],
    returns: FFIType.ptr,
  },
  jl_box_int64: {
    args: [FFIType.i64],
    returns: FFIType.ptr,
  },
  jl_box_uint64: {
    args: [FFIType.u64],
    returns: FFIType.ptr,
  },
  jl_box_float16: {
    args: [FFIType.u16], // Float16 is stored as uint16_t in IEEE 754 format
    returns: FFIType.ptr,
  },
  // Complex boxing
  jl_box_complex64: {
    args: [FFIType.f64, FFIType.f64], // re, im
    returns: FFIType.ptr,
  },
  jl_box_complex32: {
    args: [FFIType.f32, FFIType.f32], // re, im
    returns: FFIType.ptr,
  },
  jl_box_complex16: {
    args: [FFIType.u16, FFIType.u16], // re, im as Float16 bits
    returns: FFIType.ptr,
  },
  jl_box_float32: {
    args: [FFIType.f32],
    returns: FFIType.ptr,
  },
  jl_box_float64: {
    args: [FFIType.f64],
    returns: FFIType.ptr,
  },
  jl_unbox_bool: {
    args: [FFIType.ptr],
    returns: FFIType.i8,
  },
  jl_unbox_int8: {
    args: [FFIType.ptr],
    returns: FFIType.i8,
  },
  jl_unbox_uint8: {
    args: [FFIType.ptr],
    returns: FFIType.u8,
  },
  jl_unbox_int16: {
    args: [FFIType.ptr],
    returns: FFIType.i16,
  },
  jl_unbox_uint16: {
    args: [FFIType.ptr],
    returns: FFIType.u16,
  },
  jl_unbox_int32: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_unbox_uint32: {
    args: [FFIType.ptr],
    returns: FFIType.u32,
  },
  jl_unbox_int64: {
    args: [FFIType.ptr],
    returns: FFIType.i64,
  },
  jl_unbox_uint64: {
    args: [FFIType.ptr],
    returns: FFIType.u64,
  },
  jl_unbox_float16: {
    args: [FFIType.ptr],
    returns: FFIType.u16, // Float16 is stored as uint16_t in IEEE 754 format
  },
  // Complex unboxing - separate functions for re and im
  jl_unbox_complex64_re: {
    args: [FFIType.ptr],
    returns: FFIType.f64,
  },
  jl_unbox_complex64_im: {
    args: [FFIType.ptr],
    returns: FFIType.f64,
  },
  jl_unbox_complex32_re: {
    args: [FFIType.ptr],
    returns: FFIType.f32,
  },
  jl_unbox_complex32_im: {
    args: [FFIType.ptr],
    returns: FFIType.f32,
  },
  jl_unbox_complex16_re: {
    args: [FFIType.ptr],
    returns: FFIType.u16,
  },
  jl_unbox_complex16_im: {
    args: [FFIType.ptr],
    returns: FFIType.u16,
  },
  jl_unbox_float32: {
    args: [FFIType.ptr],
    returns: FFIType.f32,
  },
  jl_unbox_float64: {
    args: [FFIType.ptr],
    returns: FFIType.f64,
  },
  jl_unbox_voidpointer: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_box_voidpointer: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_pointer_from_objref_wrapper: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_ptr_eltype: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_ptr_load: {
    args: [FFIType.ptr, FFIType.u64],
    returns: FFIType.ptr,
  },
  jl_ptr_store: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u64],
    returns: FFIType.void,
  },
  jl_ptr_add: {
    args: [FFIType.ptr, FFIType.i64],
    returns: FFIType.ptr,
  },
  jl_get_nth_field: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_ptr_to_array_1d: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_alloc_array_1d: {
    args: [FFIType.ptr, FFIType.u64],
    returns: FFIType.ptr,
  },
  jl_alloc_array_2d: {
    args: [FFIType.ptr, FFIType.u64, FFIType.u64],
    returns: FFIType.ptr,
  },
  jl_alloc_array_3d: {
    args: [FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.u64],
    returns: FFIType.ptr,
  },
  jl_alloc_array_nd_wrapper: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u64],
    returns: FFIType.ptr,
  },
  jl_cstr_to_string: {
    args: [FFIType.cstring],
    returns: FFIType.ptr,
  },
  jl_array_grow_end: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_array_del_end: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_array_ptr_1d_push: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_array_ptr_1d_append: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_apply_array_type: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_array_eltype: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_string_ptr: {
    args: [FFIType.ptr],
    returns: FFIType.cstring,
  },
  jl_get_global: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_set_global: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_exception_occurred: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_atexit_hook: {
    args: [FFIType.i32],
    returns: FFIType.void,
  },
  jl_eval_string: {
    args: [FFIType.cstring],
    returns: FFIType.ptr,
  },
  jl_call: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u32],
    returns: FFIType.ptr,
  },
  jl_call0: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_call1: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_call2: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_call3: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_new_task: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_set_task_tid: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
});
