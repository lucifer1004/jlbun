/**
 * jlbun C Wrapper for Julia C API
 * 
 * This file provides FFI-friendly wrappers around Julia's C API,
 * handling version compatibility and exposing internal functions.
 */

#include <julia.h>
#include <string.h>

/* ============================================================================
 * Version Compatibility Macros
 * ============================================================================ */

// Version check macro: JL_VERSION_AT_LEAST(1, 11) means Julia >= 1.11
#define JL_VERSION_AT_LEAST(major, minor) \
  (JULIA_VERSION_MAJOR > (major) || \
   (JULIA_VERSION_MAJOR == (major) && JULIA_VERSION_MINOR >= (minor)))

#if JL_VERSION_AT_LEAST(1, 14)
#define JL_FUNCTION_TYPE jl_value_t
#else
#define JL_FUNCTION_TYPE jl_function_t
#endif

#if JL_VERSION_AT_LEAST(1, 11)
#define JL_ARRAY_DATA(a) jl_array_data_(a)
#else
#define JL_ARRAY_DATA(a) jl_array_data(a)
#endif

/* ============================================================================
 * Initialization
 * ============================================================================ */

void jl_init0(void) {
  jl_init();
}

void jl_init_with_image0(const char *julia_home_dir,
                         const char *image_relative_path) {
#if JL_VERSION_AT_LEAST(1, 12)
  jl_init_with_image_file(julia_home_dir, image_relative_path);
#else
  jl_init_with_image(julia_home_dir, image_relative_path);
#endif
}

/* ============================================================================
 * Data Type Getters
 * 
 * Expose Julia's built-in type pointers via getter functions.
 * ============================================================================ */

#define JL_DATATYPE_GETTER(x) \
  jl_datatype_t *jl_##x##_type_getter(void) { return jl_##x##_type; }

JL_DATATYPE_GETTER(any)
JL_DATATYPE_GETTER(nothing)
JL_DATATYPE_GETTER(symbol)
JL_DATATYPE_GETTER(function)
JL_DATATYPE_GETTER(string)
JL_DATATYPE_GETTER(bool)
JL_DATATYPE_GETTER(char)
JL_DATATYPE_GETTER(int8)
JL_DATATYPE_GETTER(uint8)
JL_DATATYPE_GETTER(int16)
JL_DATATYPE_GETTER(uint16)
JL_DATATYPE_GETTER(int32)
JL_DATATYPE_GETTER(uint32)
JL_DATATYPE_GETTER(int64)
JL_DATATYPE_GETTER(uint64)
JL_DATATYPE_GETTER(float16)
JL_DATATYPE_GETTER(float32)
JL_DATATYPE_GETTER(float64)
JL_DATATYPE_GETTER(datatype)
JL_DATATYPE_GETTER(module)
JL_DATATYPE_GETTER(task)

#undef JL_DATATYPE_GETTER

/* ============================================================================
 * Module Getters
 * 
 * Expose Julia's built-in module pointers via getter functions.
 * ============================================================================ */

#define JL_MODULE_GETTER(x) \
  jl_module_t *jl_##x##_module_getter(void) { return jl_##x##_module; }

JL_MODULE_GETTER(main)
JL_MODULE_GETTER(base)
JL_MODULE_GETTER(core)
JL_MODULE_GETTER(top)

#undef JL_MODULE_GETTER

/* ============================================================================
 * Type & Value Utilities
 * ============================================================================ */

JL_FUNCTION_TYPE *jl_function_getter(jl_module_t *m, const char *name) {
  return jl_get_function(m, name);
}

jl_datatype_t *jl_typeof_getter(jl_value_t *v) {
  return (jl_datatype_t *)jl_typeof(v);
}

size_t jl_nfields_getter(jl_datatype_t *t) {
  return jl_nfields(t);
}

const char *jl_symbol_name_getter(jl_sym_t *s) {
  return jl_symbol_name(s);
}

jl_value_t *jl_nothing_getter(void) { return jl_nothing; }
jl_value_t *jl_true_getter(void) { return jl_true; }
jl_value_t *jl_false_getter(void) { return jl_false; }

/* ============================================================================
 * Property Queries
 * ============================================================================ */

int8_t jl_hasproperty(jl_value_t *v, const char *name) {
  JL_FUNCTION_TYPE *hasproperty = jl_get_function(jl_base_module, "hasproperty");
  jl_value_t *ret = jl_call2(hasproperty, v, (jl_value_t *)jl_symbol(name));
  return jl_unbox_bool(ret);
}

size_t jl_propertycount(jl_value_t *v) {
  JL_FUNCTION_TYPE *propertynames = jl_get_function(jl_base_module, "propertynames");
  jl_array_t *properties = (jl_array_t *)jl_call1(propertynames, v);
  return jl_array_len(properties);
}

const char **jl_propertynames(jl_value_t *v) {
  JL_FUNCTION_TYPE *propertynames = jl_get_function(jl_base_module, "propertynames");
  jl_array_t *properties = (jl_array_t *)jl_call1(propertynames, v);
  size_t len = jl_array_len(properties);
  const char **names = (const char **)malloc(len * sizeof(char *));
  for (size_t i = 0; i < len; i++) {
#if JL_VERSION_AT_LEAST(1, 11)
    jl_value_t *name = jl_array_data(properties, jl_value_t);
#else
    jl_value_t *name = jl_array_data(properties);
#endif
    names[i] = jl_symbol_name((jl_sym_t *)name);
  }
  return names;
}

/* ============================================================================
 * Array Operations - Basic Accessors
 * ============================================================================ */

size_t jl_array_len_getter(jl_array_t *a) {
  return jl_array_len(a);
}

int32_t jl_array_ndims_getter(jl_array_t *a) {
  return jl_array_ndims(a);
}

void *jl_array_data_getter(jl_array_t *a) {
  return JL_ARRAY_DATA(a);
}

size_t jl_array_dim_getter(jl_array_t *a, int32_t i) {
  return jl_array_dim(a, i);
}

/* ============================================================================
 * Array Operations - Internal Utilities
 * ============================================================================ */

// Check if array elements are boxed (stored as pointers to Julia objects)
STATIC_INLINE int jl_array_isboxed(jl_array_t *a) {
#if JL_VERSION_AT_LEAST(1, 11)
  return ((jl_datatype_t *)jl_typetagof(a->ref.mem))->layout->flags.arrayelem_isboxed;
#else
  return ((jl_array_t *)a)->flags.ptrarray;
#endif
}

// Check if a type is a Ptr{T} type (pointer-sized primitive with 1 type param)
STATIC_INLINE int jl_is_ptr_type(jl_value_t *t) {
  if (!jl_is_datatype(t)) return 0;
  jl_datatype_t *dt = (jl_datatype_t *)t;
  return jl_datatype_size(dt) == sizeof(void *) &&
         jl_nparams(dt) == 1 &&
         jl_is_primitivetype(dt);
}

/* ============================================================================
 * Array Operations - Element Access
 * 
 * These wrappers handle boxing/unboxing for unboxed arrays, which store
 * primitive values directly in memory rather than as Julia object pointers.
 * ============================================================================ */

jl_value_t *jl_array_ptr_ref_wrapper(jl_array_t *a, size_t i) {
  // Boxed arrays: elements are already Julia object pointers
  if (jl_array_isboxed(a)) {
    return jl_array_ptr_ref(a, i);
  }

  // Unboxed arrays: need to box primitive values
  jl_value_t *eltype = jl_array_eltype((jl_value_t *)a);
  void *data = JL_ARRAY_DATA(a);

  // Fast path: common primitive types
  if (eltype == (jl_value_t *)jl_bool_type)
    return jl_box_bool(((int8_t *)data)[i]);
  if (eltype == (jl_value_t *)jl_int8_type)
    return jl_box_int8(((int8_t *)data)[i]);
  if (eltype == (jl_value_t *)jl_uint8_type)
    return jl_box_uint8(((uint8_t *)data)[i]);
  if (eltype == (jl_value_t *)jl_int16_type)
    return jl_box_int16(((int16_t *)data)[i]);
  if (eltype == (jl_value_t *)jl_uint16_type)
    return jl_box_uint16(((uint16_t *)data)[i]);
  if (eltype == (jl_value_t *)jl_int32_type)
    return jl_box_int32(((int32_t *)data)[i]);
  if (eltype == (jl_value_t *)jl_uint32_type)
    return jl_box_uint32(((uint32_t *)data)[i]);
  if (eltype == (jl_value_t *)jl_int64_type)
    return jl_box_int64(((int64_t *)data)[i]);
  if (eltype == (jl_value_t *)jl_uint64_type)
    return jl_box_uint64(((uint64_t *)data)[i]);
  if (eltype == (jl_value_t *)jl_float32_type)
    return jl_box_float32(((float *)data)[i]);
  if (eltype == (jl_value_t *)jl_float64_type)
    return jl_box_float64(((double *)data)[i]);
  if (eltype == (jl_value_t *)jl_char_type)
    return jl_box_char(((uint32_t *)data)[i]);

  // Ptr{T} types
  if (jl_is_ptr_type(eltype)) {
    void *ptr_val = ((void **)data)[i];
    return jl_new_bits(eltype, &ptr_val);
  }

  // Fallback: generic primitive types
  size_t elsz = jl_datatype_size((jl_datatype_t *)eltype);
  return jl_new_bits(eltype, (char *)data + i * elsz);
}

void jl_array_ptr_set_wrapper(jl_array_t *a, size_t i, jl_value_t *v) {
  // Boxed arrays: store Julia object pointer directly
  if (jl_array_isboxed(a)) {
    jl_array_ptr_set(a, i, v);
    return;
  }

  // Unboxed arrays: need to unbox and write raw value
  jl_value_t *eltype = jl_array_eltype((jl_value_t *)a);
  void *data = JL_ARRAY_DATA(a);

  // Fast path: common primitive types
  if (eltype == (jl_value_t *)jl_bool_type) {
    ((int8_t *)data)[i] = jl_unbox_bool(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_int8_type) {
    ((int8_t *)data)[i] = jl_unbox_int8(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_uint8_type) {
    ((uint8_t *)data)[i] = jl_unbox_uint8(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_int16_type) {
    ((int16_t *)data)[i] = jl_unbox_int16(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_uint16_type) {
    ((uint16_t *)data)[i] = jl_unbox_uint16(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_int32_type) {
    ((int32_t *)data)[i] = jl_unbox_int32(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_uint32_type) {
    ((uint32_t *)data)[i] = jl_unbox_uint32(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_int64_type) {
    ((int64_t *)data)[i] = jl_unbox_int64(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_uint64_type) {
    ((uint64_t *)data)[i] = jl_unbox_uint64(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_float32_type) {
    ((float *)data)[i] = jl_unbox_float32(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_float64_type) {
    ((double *)data)[i] = jl_unbox_float64(v);
    return;
  }
  if (eltype == (jl_value_t *)jl_char_type) {
    ((uint32_t *)data)[i] = jl_unbox_uint32(v);
    return;
  }

  // Ptr{T} types
  if (jl_is_ptr_type(eltype)) {
    ((void **)data)[i] = jl_unbox_voidpointer(v);
    return;
  }

  // Fallback: copy raw bytes for other primitive types
  size_t elsz = jl_datatype_size((jl_datatype_t *)eltype);
  memcpy((char *)data + i * elsz, (char *)v, elsz);
}

/* ============================================================================
 * Array Operations - Multi-dimensional Allocation
 * 
 * Compatibility wrapper for jl_alloc_array_nd which doesn't exist in Julia 1.10.
 * ============================================================================ */

#if JL_VERSION_AT_LEAST(1, 11)

jl_array_t *jl_alloc_array_nd_wrapper(jl_value_t *atype, size_t *dims, size_t ndims) {
  return jl_alloc_array_nd(atype, dims, ndims);
}

#else

jl_array_t *jl_alloc_array_nd_wrapper(jl_value_t *atype, size_t *dims, size_t ndims) {
  // Create NTuple{N, Int} type for dimensions
  jl_value_t **types = (jl_value_t **)alloca(ndims * sizeof(jl_value_t *));
  for (size_t i = 0; i < ndims; i++) {
    types[i] = (jl_value_t *)jl_long_type;
  }
  jl_datatype_t *tuple_type = (jl_datatype_t *)jl_apply_tuple_type_v(types, ndims);

  // Tuple layout: fields stored contiguously, can write directly
  jl_value_t *dims_tuple = jl_new_struct_uninit(tuple_type);
  size_t *tuple_data = (size_t *)dims_tuple;
  for (size_t i = 0; i < ndims; i++) {
    tuple_data[i] = dims[i];
  }

  return jl_new_array(atype, dims_tuple);
}

#endif

/* ============================================================================
 * Pointer Operations
 * ============================================================================ */

// Get raw address of Julia object (equivalent to pointer_from_objref)
// WARNING: Returned pointer only valid while object is GC-rooted!
void *jl_pointer_from_objref_wrapper(jl_value_t *obj) {
  return (void *)obj;
}

// Get element type T from Ptr{T}, or NULL if not a Ptr type
jl_value_t *jl_ptr_eltype(jl_value_t *ptr_value) {
  jl_datatype_t *ptr_type = (jl_datatype_t *)jl_typeof(ptr_value);
  if (jl_is_datatype(ptr_type) && jl_nparams(ptr_type) == 1) {
    return jl_tparam0(ptr_type);
  }
  return NULL;
}

/* ============================================================================
 * Garbage Collection
 * ============================================================================ */

void jl_gc_push1(jl_value_t *x) { JL_GC_PUSH1(&x); }
void jl_gc_push2(jl_value_t *x, jl_value_t *y) { JL_GC_PUSH2(&x, &y); }
void jl_gc_push3(jl_value_t *x, jl_value_t *y, jl_value_t *z) {
  JL_GC_PUSH3(&x, &y, &z);
}
void jl_gc_push(jl_value_t **args, int32_t n) { JL_GC_PUSHARGS(args, n); }
void jl_gc_pop(void) { JL_GC_POP(); }
