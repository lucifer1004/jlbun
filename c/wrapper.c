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
 * Float16 Boxing/Unboxing
 * 
 * Float16 is stored as uint16_t in IEEE 754 half-precision format.
 * Julia does not export box/unbox functions for Float16, so we implement them.
 * ============================================================================ */

jl_value_t *jl_box_float16(uint16_t x) {
  jl_value_t *v = jl_new_struct_uninit(jl_float16_type);
  *(uint16_t *)jl_data_ptr(v) = x;
  return v;
}

uint16_t jl_unbox_float16(jl_value_t *v) {
  return *(uint16_t *)jl_data_ptr(v);
}

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

// Get logical length of array (product of dimensions)
// Unlike jl_array_len which returns underlying storage size,
// this returns the actual element count for reshaped/viewed arrays
size_t jl_array_length(jl_array_t *a) {
  int ndims = jl_array_ndims(a);
  size_t length = 1;
  for (int i = 0; i < ndims; i++) {
    length *= jl_array_dim(a, i);
  }
  return length;
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
  if (eltype == (jl_value_t *)jl_float16_type)
    return jl_box_float16(((uint16_t *)data)[i]);
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
  if (eltype == (jl_value_t *)jl_float16_type) {
    ((uint16_t *)data)[i] = jl_unbox_float16(v);
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

// Load value from Ptr{T} at element offset (0-based)
// Returns boxed Julia value, or NULL on error
jl_value_t *jl_ptr_load(jl_value_t *ptr_value, size_t offset) {
  jl_datatype_t *ptr_type = (jl_datatype_t *)jl_typeof(ptr_value);
  if (!jl_is_datatype(ptr_type) || jl_nparams(ptr_type) != 1) {
    return NULL;
  }

  jl_value_t *eltype = jl_tparam0(ptr_type);
  void *addr = jl_unbox_voidpointer(ptr_value);
  if (addr == NULL) return NULL;

  size_t elsz = jl_datatype_size((jl_datatype_t *)eltype);
  void *target = (char *)addr + offset * elsz;

  // Fast path: common primitive types
  if (eltype == (jl_value_t *)jl_float64_type)
    return jl_box_float64(*(double *)target);
  if (eltype == (jl_value_t *)jl_float32_type)
    return jl_box_float32(*(float *)target);
  if (eltype == (jl_value_t *)jl_float16_type)
    return jl_box_float16(*(uint16_t *)target);
  if (eltype == (jl_value_t *)jl_int64_type)
    return jl_box_int64(*(int64_t *)target);
  if (eltype == (jl_value_t *)jl_int32_type)
    return jl_box_int32(*(int32_t *)target);
  if (eltype == (jl_value_t *)jl_uint64_type)
    return jl_box_uint64(*(uint64_t *)target);
  if (eltype == (jl_value_t *)jl_uint32_type)
    return jl_box_uint32(*(uint32_t *)target);
  if (eltype == (jl_value_t *)jl_int16_type)
    return jl_box_int16(*(int16_t *)target);
  if (eltype == (jl_value_t *)jl_uint16_type)
    return jl_box_uint16(*(uint16_t *)target);
  if (eltype == (jl_value_t *)jl_int8_type)
    return jl_box_int8(*(int8_t *)target);
  if (eltype == (jl_value_t *)jl_uint8_type)
    return jl_box_uint8(*(uint8_t *)target);
  if (eltype == (jl_value_t *)jl_bool_type)
    return jl_box_bool(*(int8_t *)target);
  if (eltype == (jl_value_t *)jl_char_type)
    return jl_box_char(*(uint32_t *)target);

  // Ptr{T} types
  if (jl_is_ptr_type(eltype)) {
    void *ptr_val = *(void **)target;
    return jl_new_bits(eltype, &ptr_val);
  }

  // Fallback: generic primitive types
  return jl_new_bits(eltype, target);
}

// Helper: convert float to Float16 bits
static uint16_t float_to_float16(float value) {
  uint32_t f32_bits;
  memcpy(&f32_bits, &value, sizeof(f32_bits));

  uint32_t sign = (f32_bits >> 31) & 0x1;
  int32_t exp = ((f32_bits >> 23) & 0xff) - 127 + 15;
  uint32_t frac = f32_bits & 0x7fffff;

  // Handle special cases
  if (((f32_bits >> 23) & 0xff) == 0xff) {
    // Infinity or NaN
    if (frac == 0) {
      return (sign << 15) | 0x7c00;  // Infinity
    } else {
      return (sign << 15) | 0x7c00 | (frac >> 13);  // NaN
    }
  }

  if (exp >= 31) {
    // Overflow to infinity
    return (sign << 15) | 0x7c00;
  } else if (exp <= 0) {
    // Underflow to zero or denormal
    if (exp < -10) {
      return sign << 15;
    }
    // Denormalized
    uint32_t m = frac | 0x800000;
    int shift = 14 - exp;
    return (sign << 15) | (m >> shift);
  } else {
    // Normalized
    return (sign << 15) | (exp << 10) | (frac >> 13);
  }
}

// Helper: convert Float16 bits to float
static float float16_to_float(uint16_t bits) {
  uint32_t sign = (bits >> 15) & 0x1;
  uint32_t exp = (bits >> 10) & 0x1f;
  uint32_t frac = bits & 0x3ff;

  uint32_t f32_bits;
  if (exp == 0) {
    if (frac == 0) {
      // Zero
      f32_bits = sign << 31;
    } else {
      // Denormalized: convert to normalized float32
      exp = 1;
      while (!(frac & 0x400)) {
        frac <<= 1;
        exp--;
      }
      frac &= 0x3ff;
      f32_bits = (sign << 31) | ((exp + 127 - 15) << 23) | (frac << 13);
    }
  } else if (exp == 31) {
    // Infinity or NaN
    f32_bits = (sign << 31) | 0x7f800000 | (frac << 13);
  } else {
    // Normalized
    f32_bits = (sign << 31) | ((exp + 127 - 15) << 23) | (frac << 13);
  }

  float result;
  memcpy(&result, &f32_bits, sizeof(result));
  return result;
}

// Helper: convert numeric value to target type and return as double
static double jl_to_double(jl_value_t *val) {
  jl_datatype_t *vtype = (jl_datatype_t *)jl_typeof(val);
  if (vtype == jl_float64_type) return jl_unbox_float64(val);
  if (vtype == jl_float32_type) return (double)jl_unbox_float32(val);
  if (vtype == jl_float16_type) return (double)float16_to_float(jl_unbox_float16(val));
  if (vtype == jl_int64_type) return (double)jl_unbox_int64(val);
  if (vtype == jl_int32_type) return (double)jl_unbox_int32(val);
  if (vtype == jl_uint64_type) return (double)jl_unbox_uint64(val);
  if (vtype == jl_uint32_type) return (double)jl_unbox_uint32(val);
  if (vtype == jl_int16_type) return (double)jl_unbox_int16(val);
  if (vtype == jl_uint16_type) return (double)jl_unbox_uint16(val);
  if (vtype == jl_int8_type) return (double)jl_unbox_int8(val);
  if (vtype == jl_uint8_type) return (double)jl_unbox_uint8(val);
  return 0.0;
}

// Helper: convert numeric value to target type and return as int64
static int64_t jl_to_int64(jl_value_t *val) {
  jl_datatype_t *vtype = (jl_datatype_t *)jl_typeof(val);
  if (vtype == jl_int64_type) return jl_unbox_int64(val);
  if (vtype == jl_int32_type) return (int64_t)jl_unbox_int32(val);
  if (vtype == jl_uint64_type) return (int64_t)jl_unbox_uint64(val);
  if (vtype == jl_uint32_type) return (int64_t)jl_unbox_uint32(val);
  if (vtype == jl_int16_type) return (int64_t)jl_unbox_int16(val);
  if (vtype == jl_uint16_type) return (int64_t)jl_unbox_uint16(val);
  if (vtype == jl_int8_type) return (int64_t)jl_unbox_int8(val);
  if (vtype == jl_uint8_type) return (int64_t)jl_unbox_uint8(val);
  if (vtype == jl_float64_type) return (int64_t)jl_unbox_float64(val);
  if (vtype == jl_float32_type) return (int64_t)jl_unbox_float32(val);
  if (vtype == jl_float16_type) return (int64_t)float16_to_float(jl_unbox_float16(val));
  return 0;
}

// Store value to Ptr{T} at element offset (0-based)
// Automatically converts value to target element type
void jl_ptr_store(jl_value_t *ptr_value, jl_value_t *val, size_t offset) {
  jl_datatype_t *ptr_type = (jl_datatype_t *)jl_typeof(ptr_value);
  if (!jl_is_datatype(ptr_type) || jl_nparams(ptr_type) != 1) {
    return;
  }

  jl_value_t *eltype = jl_tparam0(ptr_type);
  void *addr = jl_unbox_voidpointer(ptr_value);
  if (addr == NULL) return;

  size_t elsz = jl_datatype_size((jl_datatype_t *)eltype);
  void *target = (char *)addr + offset * elsz;

  // Convert value to target type (handles type mismatch like Int64 -> Float64)
  if (eltype == (jl_value_t *)jl_float64_type) {
    *(double *)target = jl_to_double(val);
    return;
  }
  if (eltype == (jl_value_t *)jl_float32_type) {
    *(float *)target = (float)jl_to_double(val);
    return;
  }
  if (eltype == (jl_value_t *)jl_float16_type) {
    *(uint16_t *)target = float_to_float16((float)jl_to_double(val));
    return;
  }
  if (eltype == (jl_value_t *)jl_int64_type) {
    *(int64_t *)target = jl_to_int64(val);
    return;
  }
  if (eltype == (jl_value_t *)jl_int32_type) {
    *(int32_t *)target = (int32_t)jl_to_int64(val);
    return;
  }
  if (eltype == (jl_value_t *)jl_uint64_type) {
    *(uint64_t *)target = (uint64_t)jl_to_int64(val);
    return;
  }
  if (eltype == (jl_value_t *)jl_uint32_type) {
    *(uint32_t *)target = (uint32_t)jl_to_int64(val);
    return;
  }
  if (eltype == (jl_value_t *)jl_int16_type) {
    *(int16_t *)target = (int16_t)jl_to_int64(val);
    return;
  }
  if (eltype == (jl_value_t *)jl_uint16_type) {
    *(uint16_t *)target = (uint16_t)jl_to_int64(val);
    return;
  }
  if (eltype == (jl_value_t *)jl_int8_type) {
    *(int8_t *)target = (int8_t)jl_to_int64(val);
    return;
  }
  if (eltype == (jl_value_t *)jl_uint8_type) {
    *(uint8_t *)target = (uint8_t)jl_to_int64(val);
    return;
  }
  if (eltype == (jl_value_t *)jl_bool_type) {
    *(int8_t *)target = jl_to_int64(val) != 0;
    return;
  }
  if (eltype == (jl_value_t *)jl_char_type) {
    *(uint32_t *)target = (uint32_t)jl_to_int64(val);
    return;
  }

  // Ptr{T} types
  if (jl_is_ptr_type(eltype)) {
    *(void **)target = jl_unbox_voidpointer(val);
    return;
  }

  // Fallback: copy raw bytes (same type assumed)
  memcpy(target, (char *)val, elsz);
}

// Create new Ptr{T} by adding n elements offset (preserves element type)
// Equivalent to: ptr + n * sizeof(eltype(ptr)) in bytes
jl_value_t *jl_ptr_add(jl_value_t *ptr_value, int64_t n) {
  jl_datatype_t *ptr_type = (jl_datatype_t *)jl_typeof(ptr_value);
  if (!jl_is_datatype(ptr_type) || jl_nparams(ptr_type) != 1) {
    return NULL;
  }

  jl_value_t *eltype = jl_tparam0(ptr_type);
  void *addr = jl_unbox_voidpointer(ptr_value);

  // Calculate new address: addr + n * sizeof(eltype)
  size_t elsz = jl_datatype_size((jl_datatype_t *)eltype);
  void *new_addr = (char *)addr + n * elsz;

  // Create new Ptr{T} with same type
  return jl_new_bits((jl_value_t *)ptr_type, &new_addr);
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
