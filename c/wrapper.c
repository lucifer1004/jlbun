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
 * ============================================================================
 */

// Version check macro: JL_VERSION_AT_LEAST(1, 11) means Julia >= 1.11
#define JL_VERSION_AT_LEAST(major, minor)                                      \
  (JULIA_VERSION_MAJOR > (major) ||                                            \
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
 * ============================================================================
 */

void jl_init0(void) { jl_init(); }

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
 * ============================================================================
 */

#define JL_DATATYPE_GETTER(x)                                                  \
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
 * ============================================================================
 */

#define JL_MODULE_GETTER(x)                                                    \
  jl_module_t *jl_##x##_module_getter(void) { return jl_##x##_module; }

JL_MODULE_GETTER(main)
JL_MODULE_GETTER(base)
JL_MODULE_GETTER(core)
JL_MODULE_GETTER(top)

#undef JL_MODULE_GETTER

/* ============================================================================
 * Type & Value Utilities
 * ============================================================================
 */

JL_FUNCTION_TYPE *jl_function_getter(jl_module_t *m, const char *name) {
  return jl_get_function(m, name);
}

jl_datatype_t *jl_typeof_getter(jl_value_t *v) {
  return (jl_datatype_t *)jl_typeof(v);
}

size_t jl_nfields_getter(jl_datatype_t *t) { return jl_nfields(t); }

const char *jl_symbol_name_getter(jl_sym_t *s) { return jl_symbol_name(s); }

jl_value_t *jl_nothing_getter(void) { return jl_nothing; }
jl_value_t *jl_true_getter(void) { return jl_true; }
jl_value_t *jl_false_getter(void) { return jl_false; }

/* ============================================================================
 * Float16 Boxing/Unboxing
 *
 * Float16 is stored as uint16_t in IEEE 754 half-precision format.
 * Julia does not export box/unbox functions for Float16, so we implement them.
 * ============================================================================
 */

jl_value_t *jl_box_float16(uint16_t x) {
  jl_value_t *v = jl_new_struct_uninit(jl_float16_type);
  *(uint16_t *)jl_data_ptr(v) = x;
  return v;
}

uint16_t jl_unbox_float16(jl_value_t *v) { return *(uint16_t *)jl_data_ptr(v); }

/* ============================================================================
 * Complex Number Support
 *
 * Complex{T} stores two values of type T contiguously: [re, im]
 * Memory layout:
 *   ComplexF64: 16 bytes = [Float64 re, Float64 im]
 *   ComplexF32: 8 bytes  = [Float32 re, Float32 im]
 *   ComplexF16: 4 bytes  = [Float16 re, Float16 im]
 * ============================================================================
 */

// Cache for Complex types (initialized lazily)
static jl_datatype_t *complexf64_type = NULL;
static jl_datatype_t *complexf32_type = NULL;
static jl_datatype_t *complexf16_type = NULL;

static jl_datatype_t *get_complexf64_type(void) {
  if (complexf64_type == NULL) {
    complexf64_type = (jl_datatype_t *)jl_eval_string("ComplexF64");
  }
  return complexf64_type;
}

static jl_datatype_t *get_complexf32_type(void) {
  if (complexf32_type == NULL) {
    complexf32_type = (jl_datatype_t *)jl_eval_string("ComplexF32");
  }
  return complexf32_type;
}

static jl_datatype_t *get_complexf16_type(void) {
  if (complexf16_type == NULL) {
    complexf16_type = (jl_datatype_t *)jl_eval_string("ComplexF16");
  }
  return complexf16_type;
}

// Type getters
jl_datatype_t *jl_complexf64_type_getter(void) { return get_complexf64_type(); }
jl_datatype_t *jl_complexf32_type_getter(void) { return get_complexf32_type(); }
jl_datatype_t *jl_complexf16_type_getter(void) { return get_complexf16_type(); }

// Get first type parameter (wrapper for jl_tparam0 macro)
// For Complex{Float64}, returns Float64 type pointer
jl_value_t *jl_tparam0_getter(jl_datatype_t *t) {
  if (jl_nparams(t) == 0)
    return NULL;
  return jl_tparam0(t);
}

// Box ComplexF64
jl_value_t *jl_box_complex64(double re, double im) {
  jl_value_t *v = jl_new_struct_uninit(get_complexf64_type());
  double *data = (double *)jl_data_ptr(v);
  data[0] = re;
  data[1] = im;
  return v;
}

// Box ComplexF32
jl_value_t *jl_box_complex32(float re, float im) {
  jl_value_t *v = jl_new_struct_uninit(get_complexf32_type());
  float *data = (float *)jl_data_ptr(v);
  data[0] = re;
  data[1] = im;
  return v;
}

// Box ComplexF16 (using raw uint16 bits)
jl_value_t *jl_box_complex16(uint16_t re, uint16_t im) {
  jl_value_t *v = jl_new_struct_uninit(get_complexf16_type());
  uint16_t *data = (uint16_t *)jl_data_ptr(v);
  data[0] = re;
  data[1] = im;
  return v;
}

// Unbox ComplexF64 - returns re, use jl_unbox_complex64_im for im
double jl_unbox_complex64_re(jl_value_t *v) {
  return ((double *)jl_data_ptr(v))[0];
}

double jl_unbox_complex64_im(jl_value_t *v) {
  return ((double *)jl_data_ptr(v))[1];
}

// Unbox ComplexF32
float jl_unbox_complex32_re(jl_value_t *v) {
  return ((float *)jl_data_ptr(v))[0];
}

float jl_unbox_complex32_im(jl_value_t *v) {
  return ((float *)jl_data_ptr(v))[1];
}

// Unbox ComplexF16 (returns raw uint16 bits)
uint16_t jl_unbox_complex16_re(jl_value_t *v) {
  return ((uint16_t *)jl_data_ptr(v))[0];
}

uint16_t jl_unbox_complex16_im(jl_value_t *v) {
  return ((uint16_t *)jl_data_ptr(v))[1];
}

/* ============================================================================
 * Property Queries
 * ============================================================================
 */

int8_t jl_hasproperty(jl_value_t *v, const char *name) {
  JL_FUNCTION_TYPE *hasproperty =
      jl_get_function(jl_base_module, "hasproperty");
  jl_value_t *ret = jl_call2(hasproperty, v, (jl_value_t *)jl_symbol(name));
  return jl_unbox_bool(ret);
}

size_t jl_propertycount(jl_value_t *v) {
  JL_FUNCTION_TYPE *propertynames =
      jl_get_function(jl_base_module, "propertynames");
  jl_array_t *properties = (jl_array_t *)jl_call1(propertynames, v);
  return jl_array_len(properties);
}

const char **jl_propertynames(jl_value_t *v) {
  JL_FUNCTION_TYPE *propertynames =
      jl_get_function(jl_base_module, "propertynames");
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
 * ============================================================================
 */

size_t jl_array_len_getter(jl_array_t *a) { return jl_array_len(a); }

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

int32_t jl_array_ndims_getter(jl_array_t *a) { return jl_array_ndims(a); }

void *jl_array_data_getter(jl_array_t *a) { return JL_ARRAY_DATA(a); }

size_t jl_array_dim_getter(jl_array_t *a, int32_t i) {
  return jl_array_dim(a, i);
}

/* ============================================================================
 * Array Operations - Internal Utilities
 * ============================================================================
 */

// Check if array elements are boxed (stored as pointers to Julia objects)
STATIC_INLINE int jl_array_isboxed(jl_array_t *a) {
#if JL_VERSION_AT_LEAST(1, 11)
  return ((jl_datatype_t *)jl_typetagof(a->ref.mem))
      ->layout->flags.arrayelem_isboxed;
#else
  return ((jl_array_t *)a)->flags.ptrarray;
#endif
}

// Check if a type is a Ptr{T} type (pointer-sized primitive with 1 type param)
STATIC_INLINE int jl_is_ptr_type(jl_value_t *t) {
  if (!jl_is_datatype(t))
    return 0;
  jl_datatype_t *dt = (jl_datatype_t *)t;
  return jl_datatype_size(dt) == sizeof(void *) && jl_nparams(dt) == 1 &&
         jl_is_primitivetype(dt);
}

/* ============================================================================
 * Array Operations - Element Access
 *
 * These wrappers handle boxing/unboxing for unboxed arrays, which store
 * primitive values directly in memory rather than as Julia object pointers.
 * ============================================================================
 */

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
 * Compatibility wrapper for jl_alloc_array_nd which doesn't exist in
 * Julia 1.10.
 * ============================================================================
 */

#if JL_VERSION_AT_LEAST(1, 11)

jl_array_t *jl_alloc_array_nd_wrapper(jl_value_t *atype, size_t *dims,
                                      size_t ndims) {
  return jl_alloc_array_nd(atype, dims, ndims);
}

#else

jl_array_t *jl_alloc_array_nd_wrapper(jl_value_t *atype, size_t *dims,
                                      size_t ndims) {
  // Create NTuple{N, Int} type for dimensions
  jl_value_t **types = (jl_value_t **)alloca(ndims * sizeof(jl_value_t *));
  for (size_t i = 0; i < ndims; i++) {
    types[i] = (jl_value_t *)jl_long_type;
  }
  jl_datatype_t *tuple_type =
      (jl_datatype_t *)jl_apply_tuple_type_v(types, ndims);

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
 * ============================================================================
 */

// Get raw address of Julia object (equivalent to pointer_from_objref)
// WARNING: Returned pointer only valid while object is GC-rooted!
void *jl_pointer_from_objref_wrapper(jl_value_t *obj) { return (void *)obj; }

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
  if (addr == NULL)
    return NULL;

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
      return (sign << 15) | 0x7c00; // Infinity
    } else {
      return (sign << 15) | 0x7c00 | (frac >> 13); // NaN
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
  if (vtype == jl_float64_type)
    return jl_unbox_float64(val);
  if (vtype == jl_float32_type)
    return (double)jl_unbox_float32(val);
  if (vtype == jl_float16_type)
    return (double)float16_to_float(jl_unbox_float16(val));
  if (vtype == jl_int64_type)
    return (double)jl_unbox_int64(val);
  if (vtype == jl_int32_type)
    return (double)jl_unbox_int32(val);
  if (vtype == jl_uint64_type)
    return (double)jl_unbox_uint64(val);
  if (vtype == jl_uint32_type)
    return (double)jl_unbox_uint32(val);
  if (vtype == jl_int16_type)
    return (double)jl_unbox_int16(val);
  if (vtype == jl_uint16_type)
    return (double)jl_unbox_uint16(val);
  if (vtype == jl_int8_type)
    return (double)jl_unbox_int8(val);
  if (vtype == jl_uint8_type)
    return (double)jl_unbox_uint8(val);
  return 0.0;
}

// Helper: convert numeric value to target type and return as int64
static int64_t jl_to_int64(jl_value_t *val) {
  jl_datatype_t *vtype = (jl_datatype_t *)jl_typeof(val);
  if (vtype == jl_int64_type)
    return jl_unbox_int64(val);
  if (vtype == jl_int32_type)
    return (int64_t)jl_unbox_int32(val);
  if (vtype == jl_uint64_type)
    return (int64_t)jl_unbox_uint64(val);
  if (vtype == jl_uint32_type)
    return (int64_t)jl_unbox_uint32(val);
  if (vtype == jl_int16_type)
    return (int64_t)jl_unbox_int16(val);
  if (vtype == jl_uint16_type)
    return (int64_t)jl_unbox_uint16(val);
  if (vtype == jl_int8_type)
    return (int64_t)jl_unbox_int8(val);
  if (vtype == jl_uint8_type)
    return (int64_t)jl_unbox_uint8(val);
  if (vtype == jl_float64_type)
    return (int64_t)jl_unbox_float64(val);
  if (vtype == jl_float32_type)
    return (int64_t)jl_unbox_float32(val);
  if (vtype == jl_float16_type)
    return (int64_t)float16_to_float(jl_unbox_float16(val));
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
  if (addr == NULL)
    return;

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
 * Scope-based GC Root Management
 *
 * Provides FFI-friendly GC rooting with scope isolation for concurrent async
 * operations. Each scope has a unique ID, allowing independent release without
 * affecting other scopes.
 *
 * Design:
 *   - Scope-based: each value belongs to a scope_id
 *   - Thread-safe: protected by mutex
 *   - Concurrent-safe: scopes can be released in any order
 *   - Efficient: O(1) push, O(n) release (only touches scope's values)
 *
 * API:
 *   - jlbun_gc_scope_begin(): Start a new scope, returns scope_id
 *   - jlbun_gc_push_scoped(v, scope_id): Push value to specific scope
 *   - jlbun_gc_scope_end(scope_id): Release all values in scope
 *   - jlbun_gc_transfer(idx, new_scope_id): Move value to another scope
 * (escape)
 *   - jlbun_gc_get_scope(idx): Get scope_id of value at index
 *
 * Global scope (id=0):
 *   - Values in scope_id=0 are never auto-released
 *   - Use for escaped values that should persist until JS GC runs
 * ============================================================================
 */

#include <pthread.h>
#include <stdlib.h>

typedef struct {
  jl_array_t *values;     // Vector{Any} as root storage
  uint64_t *scope_ids;    // C array: scope ownership for each slot
  size_t top;             // Current stack top (next write position)
  size_t capacity;        // Current capacity
  uint64_t next_scope_id; // Counter for generating unique scope IDs
  pthread_mutex_t lock;   // Thread safety
  int initialized;        // Initialization flag
} JlbunGCStack;

static JlbunGCStack gc_stack = {NULL, NULL, 0, 0, 1, PTHREAD_MUTEX_INITIALIZER,
                                0};

// Initialize the GC root stack
void jlbun_gc_init(size_t initial_capacity) {
  pthread_mutex_lock(&gc_stack.lock);

  if (gc_stack.initialized) {
    pthread_mutex_unlock(&gc_stack.lock);
    return; // Already initialized
  }

  // Allocate Vector{Any} for values
  jl_value_t *any_type = (jl_value_t *)jl_any_type;
  jl_value_t *array_type = jl_apply_array_type(any_type, 1);
  gc_stack.values = jl_alloc_array_1d(array_type, initial_capacity);

  // Allocate C array for scope IDs
  gc_stack.scope_ids = (uint64_t *)calloc(initial_capacity, sizeof(uint64_t));
  if (!gc_stack.scope_ids) {
    pthread_mutex_unlock(&gc_stack.lock);
    return; // Allocation failed
  }

  gc_stack.capacity = initial_capacity;
  gc_stack.top = 0;
  gc_stack.next_scope_id = 1; // 0 is reserved for global/legacy

  // Julia 1.12+ requires declaring global before assignment
  // Use eval to declare and assign in one step
  char eval_buf[256];
  snprintf(eval_buf, sizeof(eval_buf),
           "global __jlbun_gc_stack__::Vector{Any} = Vector{Any}(nothing, %zu)",
           initial_capacity);
  jl_eval_string(eval_buf);

  // Get the array we just created and use it as our values storage
  jl_value_t *values =
      jl_get_global(jl_main_module, jl_symbol("__jlbun_gc_stack__"));
  if (values != NULL && jl_is_array(values)) {
    gc_stack.values = (jl_array_t *)values;
  }

  gc_stack.initialized = 1;
  pthread_mutex_unlock(&gc_stack.lock);
}

// Ensure capacity (internal helper, must be called with lock held)
static void ensure_capacity_locked(size_t needed) {
  if (needed <= gc_stack.capacity)
    return;

  // Double capacity until sufficient
  size_t new_cap = gc_stack.capacity;
  while (new_cap < needed)
    new_cap *= 2;

  // Grow Julia Vector{Any} via resize!
  JL_FUNCTION_TYPE *resize_fn = jl_get_function(jl_base_module, "resize!");
  jl_call2(resize_fn, (jl_value_t *)gc_stack.values, jl_box_int64(new_cap));

  // Fill new value slots with nothing
  for (size_t i = gc_stack.capacity; i < new_cap; i++) {
    jl_array_ptr_set(gc_stack.values, i, jl_nothing);
  }

  // Grow C array for scope IDs
  uint64_t *new_scope_ids =
      (uint64_t *)realloc(gc_stack.scope_ids, new_cap * sizeof(uint64_t));
  if (new_scope_ids) {
    // Zero-initialize new slots
    memset(new_scope_ids + gc_stack.capacity, 0,
           (new_cap - gc_stack.capacity) * sizeof(uint64_t));
    gc_stack.scope_ids = new_scope_ids;
  }

  gc_stack.capacity = new_cap;
}

// Begin a new scope, returns unique scope_id
uint64_t jlbun_gc_scope_begin(void) {
  pthread_mutex_lock(&gc_stack.lock);

  if (!gc_stack.initialized) {
    pthread_mutex_unlock(&gc_stack.lock);
    return 0; // Error: not initialized, return invalid scope_id
  }

  uint64_t scope_id = gc_stack.next_scope_id++;
  pthread_mutex_unlock(&gc_stack.lock);
  return scope_id;
}

// Push a value with explicit scope_id, returns index
size_t jlbun_gc_push_scoped(jl_value_t *v, uint64_t scope_id) {
  pthread_mutex_lock(&gc_stack.lock);

  if (!gc_stack.initialized) {
    pthread_mutex_unlock(&gc_stack.lock);
    return SIZE_MAX; // Error: not initialized
  }

  ensure_capacity_locked(gc_stack.top + 1);
  size_t idx = gc_stack.top++;
  jl_array_ptr_set(gc_stack.values, idx, v);
  gc_stack.scope_ids[idx] = scope_id;

  pthread_mutex_unlock(&gc_stack.lock);
  return idx;
}

// End a scope: release all values belonging to this scope_id
void jlbun_gc_scope_end(uint64_t scope_id) {
  pthread_mutex_lock(&gc_stack.lock);

  if (!gc_stack.initialized || scope_id == 0) {
    pthread_mutex_unlock(&gc_stack.lock);
    return; // scope_id=0 is global, never auto-released
  }

  // Clear all slots belonging to this scope
  for (size_t i = 0; i < gc_stack.top; i++) {
    if (gc_stack.scope_ids[i] == scope_id) {
      jl_array_ptr_set(gc_stack.values, i, jl_nothing);
      gc_stack.scope_ids[i] = 0; // Mark as free
    }
  }

  // Shrink top if trailing slots are empty
  while (gc_stack.top > 0 && gc_stack.scope_ids[gc_stack.top - 1] == 0 &&
         jl_array_ptr_ref(gc_stack.values, gc_stack.top - 1) == jl_nothing) {
    gc_stack.top--;
  }

  pthread_mutex_unlock(&gc_stack.lock);
}

// Transfer a value to a different scope (for escape)
// Returns new index, or SIZE_MAX on error
size_t jlbun_gc_transfer(size_t idx, uint64_t new_scope_id) {
  pthread_mutex_lock(&gc_stack.lock);

  if (!gc_stack.initialized || idx >= gc_stack.top) {
    pthread_mutex_unlock(&gc_stack.lock);
    return SIZE_MAX;
  }

  gc_stack.scope_ids[idx] = new_scope_id;

  pthread_mutex_unlock(&gc_stack.lock);
  return idx;
}

// Get the scope_id of a value at index
uint64_t jlbun_gc_get_scope(size_t idx) {
  pthread_mutex_lock(&gc_stack.lock);

  if (!gc_stack.initialized || idx >= gc_stack.top) {
    pthread_mutex_unlock(&gc_stack.lock);
    return 0;
  }

  uint64_t scope_id = gc_stack.scope_ids[idx];
  pthread_mutex_unlock(&gc_stack.lock);
  return scope_id;
}

// Get value at index (for debugging/escape)
// Thread-safe: protects against concurrent modifications
jl_value_t *jlbun_gc_get(size_t idx) {
  pthread_mutex_lock(&gc_stack.lock);

  if (!gc_stack.initialized || idx >= gc_stack.top) {
    pthread_mutex_unlock(&gc_stack.lock);
    return jl_nothing;
  }

  jl_value_t *val = jl_array_ptr_ref(gc_stack.values, idx);
  pthread_mutex_unlock(&gc_stack.lock);
  return val;
}

// Set value at index (for escape - move value to specific slot)
void jlbun_gc_set(size_t idx, jl_value_t *v) {
  pthread_mutex_lock(&gc_stack.lock);

  if (!gc_stack.initialized || idx >= gc_stack.capacity) {
    pthread_mutex_unlock(&gc_stack.lock);
    return;
  }

  jl_array_ptr_set(gc_stack.values, idx, v);

  pthread_mutex_unlock(&gc_stack.lock);
}

// Get stack statistics (thread-safe)
size_t jlbun_gc_size(void) {
  pthread_mutex_lock(&gc_stack.lock);
  size_t size = gc_stack.top;
  pthread_mutex_unlock(&gc_stack.lock);
  return size;
}

size_t jlbun_gc_capacity(void) {
  pthread_mutex_lock(&gc_stack.lock);
  size_t cap = gc_stack.capacity;
  pthread_mutex_unlock(&gc_stack.lock);
  return cap;
}

// Check if initialized (thread-safe)
int jlbun_gc_is_initialized(void) {
  pthread_mutex_lock(&gc_stack.lock);
  int init = gc_stack.initialized;
  pthread_mutex_unlock(&gc_stack.lock);
  return init;
}

// Cleanup (called at Julia.close())
void jlbun_gc_close(void) {
  pthread_mutex_lock(&gc_stack.lock);

  // Free C array for scope IDs
  if (gc_stack.scope_ids) {
    free(gc_stack.scope_ids);
    gc_stack.scope_ids = NULL;
  }

  gc_stack.values = NULL;
  gc_stack.top = 0;
  gc_stack.capacity = 0;
  gc_stack.next_scope_id = 1;
  gc_stack.initialized = 0;

  pthread_mutex_unlock(&gc_stack.lock);
}

/* ============================================================================
 * Performance Mode GC - Lock-free Stack-based Management
 *
 * Optimized for single-threaded, non-concurrent scenarios with LIFO semantics.
 * No mutex overhead, pure O(1) operations, minimum memory footprint.
 *
 * IMPORTANT: NOT thread-safe! Only use when you can guarantee:
 *   1. Single-threaded access (no JuliaTask parallelism)
 *   2. LIFO scope disposal order (no concurrent scopeAsync)
 *
 * API:
 *   - jlbun_gc_perf_init(capacity): Initialize perf mode stack
 *   - jlbun_gc_perf_mark(): Get current stack position (O(1))
 *   - jlbun_gc_perf_push(v): Push value onto stack (O(1))
 *   - jlbun_gc_perf_release(mark): Release to mark position (O(1))
 *   - jlbun_gc_perf_size(): Current stack size
 *   - jlbun_gc_perf_close(): Cleanup
 * ============================================================================
 */

typedef struct {
  jl_array_t *values; // Vector{Any} as root storage
  size_t top;         // Current stack top (next write position)
  size_t capacity;    // Current capacity
  int initialized;    // Initialization flag
} JlbunPerfGCStack;

static JlbunPerfGCStack perf_gc_stack = {NULL, 0, 0, 0};

// Ensure capacity (internal helper, NO LOCKS)
static void perf_ensure_capacity(size_t needed) {
  if (needed <= perf_gc_stack.capacity)
    return;

  // Double capacity until sufficient
  size_t new_cap = perf_gc_stack.capacity;
  while (new_cap < needed)
    new_cap *= 2;

  // Grow Julia Vector{Any} via resize!
  JL_FUNCTION_TYPE *resize_fn = jl_get_function(jl_base_module, "resize!");
  jl_call2(resize_fn, (jl_value_t *)perf_gc_stack.values, jl_box_int64(new_cap));

  // Fill new slots with nothing
  for (size_t i = perf_gc_stack.capacity; i < new_cap; i++) {
    jl_array_ptr_set(perf_gc_stack.values, i, jl_nothing);
  }

  perf_gc_stack.capacity = new_cap;
}

// Initialize the perf mode GC stack
void jlbun_gc_perf_init(size_t initial_capacity) {
  if (perf_gc_stack.initialized)
    return;

  // Allocate Vector{Any} for values
  jl_value_t *any_type = (jl_value_t *)jl_any_type;
  jl_value_t *array_type = jl_apply_array_type(any_type, 1);
  perf_gc_stack.values = jl_alloc_array_1d(array_type, initial_capacity);

  perf_gc_stack.capacity = initial_capacity;
  perf_gc_stack.top = 0;

  // Create global reference to prevent GC
  char eval_buf[256];
  snprintf(
      eval_buf, sizeof(eval_buf),
      "global __jlbun_perf_gc_stack__::Vector{Any} = Vector{Any}(nothing, %zu)",
      initial_capacity);
  jl_eval_string(eval_buf);

  // Get the array we just created
  jl_value_t *values =
      jl_get_global(jl_main_module, jl_symbol("__jlbun_perf_gc_stack__"));
  if (values != NULL && jl_is_array(values)) {
    perf_gc_stack.values = (jl_array_t *)values;
  }

  perf_gc_stack.initialized = 1;
}

// Get current stack position (mark point)
size_t jlbun_gc_perf_mark(void) { return perf_gc_stack.top; }

// Push value onto stack, returns index
size_t jlbun_gc_perf_push(jl_value_t *v) {
  if (!perf_gc_stack.initialized)
    return SIZE_MAX;

  perf_ensure_capacity(perf_gc_stack.top + 1);
  size_t idx = perf_gc_stack.top++;
  jl_array_ptr_set(perf_gc_stack.values, idx, v);
  return idx;
}

// Release all values from mark position to current top
void jlbun_gc_perf_release(size_t mark) {
  if (!perf_gc_stack.initialized || mark > perf_gc_stack.top)
    return;

  // Clear slots from mark to top
  for (size_t i = mark; i < perf_gc_stack.top; i++) {
    jl_array_ptr_set(perf_gc_stack.values, i, jl_nothing);
  }

  // Reset top to mark position
  perf_gc_stack.top = mark;
}

// Get current stack size
size_t jlbun_gc_perf_size(void) { return perf_gc_stack.top; }

// Get capacity
size_t jlbun_gc_perf_capacity(void) { return perf_gc_stack.capacity; }

// Check if initialized
int jlbun_gc_perf_is_initialized(void) { return perf_gc_stack.initialized; }

// Cleanup
void jlbun_gc_perf_close(void) {
  perf_gc_stack.values = NULL;
  perf_gc_stack.top = 0;
  perf_gc_stack.capacity = 0;
  perf_gc_stack.initialized = 0;
}
