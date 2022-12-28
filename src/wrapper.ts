import { dlopen, FFIType, suffix } from "bun:ffi";
import { join } from "path";

const LIBJLBUN_PATH = join(
  import.meta.dir,
  "..",
  "build",
  `libjlbun.${suffix}`,
);

export const jlbun = dlopen(LIBJLBUN_PATH, {
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

  // Functions
  jl_function_getter: {
    args: [FFIType.ptr, FFIType.cstring],
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

  // Arrays
  jl_array_len_getter: {
    args: [FFIType.ptr],
    returns: FFIType.i64,
  },
  jl_array_ndims_getter: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_array_data_getter: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },

  // Values
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
  jl_gc_add_finalizer: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_gc_add_ptr_finalizer: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_gc_new_weakref: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_gc_alloc_0w: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_gc_alloc_1w: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_gc_alloc_2w: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_gc_alloc_3w: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_gc_allocobj: {
    args: [FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_malloc_stack: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_gc_queue_root: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_gc_queue_multiroot: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_gc_managed_malloc: {
    args: [FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_gc_managed_realloc: {
    args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_gc_safepoint: {
    args: [],
    returns: FFIType.void,
  },
  jl_array_typetagdata: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_compute_fieldtypes: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_subtype: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_egal: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_egal__bits: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_egal__special: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_object_id: {
    args: [FFIType.ptr],
    returns: FFIType.u64,
  },
  jl_type_equality_is_identity: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_has_free_typevars: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_has_typevar: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_has_typevar_from_unionall: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_subtype_env_size: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_subtype_env: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  jl_isa: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_types_equal: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_is_not_broken_subtype: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_type_union: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_type_intersection: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_has_empty_intersection: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_type_unionall: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_typename_str: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_typeof_str: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_type_morespecific: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_isa_compileable_sig: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_new_typename_in: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_new_typevar: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_instantiate_unionall: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_apply_type: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_apply_type1: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_apply_type2: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_apply_cmpswap_type: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_apply_tuple_type: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_apply_tuple_type_v: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_new_datatype: {
    args: [
      FFIType.ptr,
      FFIType.ptr,
      FFIType.ptr,
      FFIType.ptr,
      FFIType.ptr,
      FFIType.ptr,
      FFIType.ptr,
      FFIType.i32,
      FFIType.i32,
      FFIType.i32,
    ],
    returns: FFIType.ptr,
  },
  jl_new_primitivetype: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_new_bits: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_atomic_new_bits: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_atomic_store_bits: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_atomic_swap_bits: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_atomic_bool_cmpswap_bits: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  jl_atomic_cmpswap_bits: {
    args: [
      FFIType.ptr,
      FFIType.ptr,
      FFIType.ptr,
      FFIType.ptr,
      FFIType.ptr,
      FFIType.i32,
    ],
    returns: FFIType.ptr,
  },
  jl_new_struct: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_new_structv: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u32],
    returns: FFIType.ptr,
  },
  jl_new_structt: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_new_struct_uninit: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_new_method_instance_uninit: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_svec: {
    args: [FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_svec1: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_svec2: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_alloc_svec: {
    args: [FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_alloc_svec_uninit: {
    args: [FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_svec_copy: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_svec_fill: {
    args: [FFIType.i32, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_tupletype_fill: {
    args: [FFIType.i32, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_symbol: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_symbol_lookup: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_symbol_n: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_gensym: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_tagged_gensym: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_get_root_symbol: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_generic_function_def: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_method_def: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_code_for_staged: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_copy_code_info: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_get_world_counter: {
    args: [],
    returns: FFIType.i32,
  },
  jl_get_kwsorter: {
    args: [FFIType.ptr],
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
  jl_box_char: {
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
  jl_box_float32: {
    args: [FFIType.f32],
    returns: FFIType.ptr,
  },
  jl_box_float64: {
    args: [FFIType.f64],
    returns: FFIType.ptr,
  },
  jl_box_voidpointer: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_box_uint8pointer: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_box_ssavalue: {
    args: [FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_box_slotnumber: {
    args: [FFIType.i32],
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
  jl_unbox_uint8pointer: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_get_size: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_field_index: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  jl_get_nth_field: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_get_nth_field_noalloc: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_get_nth_field_checked: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_set_nth_field: {
    args: [FFIType.ptr, FFIType.i32, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_field_isdefined: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  jl_get_field: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_value_ptr: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_islayout_inline: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_new_array: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_reshape_array: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_ptr_to_array_1d: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_ptr_to_array: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_alloc_array_1d: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_alloc_array_2d: {
    args: [FFIType.ptr, FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_alloc_array_3d: {
    args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_pchar_to_array: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_pchar_to_string: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_cstr_to_string: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_alloc_string: {
    args: [FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_array_to_string: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_alloc_vec_any: {
    args: [FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_arrayref: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_ptrarrayref: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_arrayset: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_arrayunset: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_array_isassigned: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  jl_array_grow_end: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_array_del_end: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_array_grow_beg: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_array_del_beg: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_array_sizehint: {
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
  jl_array_validate_dims: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  jl_array_ptr: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_array_eltype: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_array_rank: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_array_size: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  jl_string_ptr: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_new_module: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_set_module_nospecialize: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_set_module_optlevel: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_get_module_optlevel: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_set_module_compile: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_get_module_compile: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_set_module_infer: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_get_module_infer: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_get_binding: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_get_binding_or_error: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_module_globalref: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_get_binding_wr: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_get_binding_for_method_def: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_boundp: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_defines_or_exports_p: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_binding_resolved_p: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_is_const: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_get_global: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_set_global: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_set_const: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_checked_assignment: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_declare_constant: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_module_using: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_module_use: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_module_import: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_module_export: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_is_imported: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_module_exports_p: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_add_standard_imports: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_eqtable_put: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_eqtable_get: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_eqtable_pop: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_errno: {
    args: [],
    returns: FFIType.i32,
  },
  jl_set_errno: {
    args: [FFIType.i32],
    returns: FFIType.void,
  },
  jl_cpu_threads: {
    args: [],
    returns: FFIType.i32,
  },
  jl_getpagesize: {
    args: [],
    returns: FFIType.i64,
  },
  jl_getallocationgranularity: {
    args: [],
    returns: FFIType.i64,
  },
  jl_is_debugbuild: {
    args: [],
    returns: FFIType.i32,
  },
  jl_get_UNAME: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_get_ARCH: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_get_libllvm: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_environ: {
    args: [FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_vexceptionf: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_error: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_errorf: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_exceptionf: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_too_few_args: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_too_many_args: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_type_error: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_type_error_rt: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_undefined_var_error: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_atomic_error: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_bounds_error: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_bounds_error_v: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_bounds_error_int: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_bounds_error_tuple_int: {
    args: [FFIType.ptr, FFIType.i32, FFIType.i32],
    returns: FFIType.void,
  },
  jl_bounds_error_unboxed_int: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_bounds_error_ints: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_eof_error: {
    args: [],
    returns: FFIType.void,
  },
  jl_current_exception: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_exception_occurred: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_exception_clear: {
    args: [],
    returns: FFIType.void,
  },
  jl_get_libdir: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_init: {
    args: [],
    returns: FFIType.void,
  },
  jl_init_with_image: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_get_default_sysimg_path: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_is_initialized: {
    args: [],
    returns: FFIType.i32,
  },
  jl_atexit_hook: {
    args: [FFIType.i32],
    returns: FFIType.void,
  },
  jl_exit: {
    args: [FFIType.i32],
    returns: FFIType.void,
  },
  jl_pathname_for_handle: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_preload_sysimg_so: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_set_sysimg_so: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_create_system_image: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_save_system_image: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_restore_system_image: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_restore_system_image_data: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.void,
  },
  jl_save_incremental: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_restore_incremental: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_restore_incremental_from_buf: {
    args: [FFIType.ptr, FFIType.i32, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_parse_all: {
    args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_parse_string: {
    args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_expand: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_expand_with_loc: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_expand_with_loc_warn: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_expand_stmt: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_expand_stmt_with_loc: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_parse_input_line: {
    args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_load_dynamic_library: {
    args: [FFIType.ptr, FFIType.u32, FFIType.i32],
    returns: FFIType.u64,
  },
  jl_dlopen: {
    args: [FFIType.ptr, FFIType.u32],
    returns: FFIType.u64,
  },
  jl_dlclose: {
    args: [FFIType.u64],
    returns: FFIType.i32,
  },
  jl_dlsym: {
    args: [FFIType.u64, FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  jl_toplevel_eval: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_toplevel_eval_in: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_eval_string: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_load_file_string: {
    args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_load: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_base_relative_to: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_register_newmeth_tracer: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_copy_ast: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_compress_ir: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_uncompress_ir: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_ir_flag_inferred: {
    args: [FFIType.ptr],
    returns: FFIType.u8,
  },
  jl_ir_flag_inlineable: {
    args: [FFIType.ptr],
    returns: FFIType.u8,
  },
  jl_ir_flag_pure: {
    args: [FFIType.ptr],
    returns: FFIType.u8,
  },
  jl_ir_nslots: {
    args: [FFIType.ptr],
    returns: FFIType.i64,
  },
  jl_ir_slotflag: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.u8,
  },
  jl_compress_argnames: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_uncompress_argnames: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_uncompress_argname_n: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_is_operator: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_is_unary_operator: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_is_unary_and_binary_operator: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_operator_precedence: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_apply_generic: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u32],
    returns: FFIType.ptr,
  },
  jl_invoke: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_invoke_api: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
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
  jl_yield: {
    args: [],
    returns: FFIType.void,
  },
  jl_install_sigint_handler: {
    args: [],
    returns: FFIType.void,
  },
  jl_sigatomic_begin: {
    args: [],
    returns: FFIType.void,
  },
  jl_sigatomic_end: {
    args: [],
    returns: FFIType.void,
  },
  jl_new_task: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.ptr,
  },
  jl_switchto: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_set_task_tid: {
    args: [FFIType.ptr, FFIType.i32],
    returns: FFIType.i32,
  },
  jl_throw: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_rethrow: {
    args: [],
    returns: FFIType.void,
  },
  jl_sig_throw: {
    args: [],
    returns: FFIType.void,
  },
  jl_rethrow_other: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_no_exc_handler: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_get_pgcstack: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_enter_handler: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_eh_restore_state: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_pop_handler: {
    args: [FFIType.i32],
    returns: FFIType.void,
  },
  jl_excstack_state: {
    args: [],
    returns: FFIType.i32,
  },
  jl_restore_excstack: {
    args: [FFIType.i32],
    returns: FFIType.void,
  },
  jl_process_events: {
    args: [],
    returns: FFIType.i32,
  },
  jl_global_event_loop: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_close_uv: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_take_buffer: {
    args: [FFIType.ptr],
    returns: FFIType.ptr,
  },
  jl_printf: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_vprintf: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_safe_printf: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  jl_stdout_stream: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_stdin_stream: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_stderr_stream: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_stdout_obj: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_stderr_obj: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_static_show: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_static_show_func_sig: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  jl_print_backtrace: {
    args: [],
    returns: FFIType.void,
  },
  jl_parse_opts: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_set_ARGS: {
    args: [FFIType.i32, FFIType.ptr],
    returns: FFIType.void,
  },
  jl_generating_output: {
    args: [],
    returns: FFIType.i32,
  },
  jl_ver_major: {
    args: [],
    returns: FFIType.i32,
  },
  jl_ver_minor: {
    args: [],
    returns: FFIType.i32,
  },
  jl_ver_patch: {
    args: [],
    returns: FFIType.i32,
  },
  jl_ver_is_release: {
    args: [],
    returns: FFIType.i32,
  },
  jl_ver_string: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_git_branch: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_git_commit: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_get_current_task: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_get_safe_restore: {
    args: [],
    returns: FFIType.ptr,
  },
  jl_set_safe_restore: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
});
