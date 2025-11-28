#include <julia.h>

#if JULIA_VERSION_MAJOR >= 1 && JULIA_VERSION_MINOR >= 14
#define JL_FUNCTION_TYPE jl_value_t
#else
#define JL_FUNCTION_TYPE jl_function_t
#endif

void jl_init0() { jl_init(); }

void jl_init_with_image0(const char *julia_home_dir,
                         const char *image_relative_path) {
#if JULIA_VERSION_MAJOR >= 1 && JULIA_VERSION_MINOR >= 12
  jl_init_with_image_file(julia_home_dir, image_relative_path);
#else
  jl_init_with_image(julia_home_dir, image_relative_path);
#endif
}

// Data types
#define JL_DATATYPE_GETTER(x)                                                  \
  jl_datatype_t *jl_##x##_type_getter() { return jl_##x##_type; }

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

// Modules
#define JL_MODULE_GETTER(x)                                                    \
  jl_module_t *jl_##x##_module_getter() { return jl_##x##_module; }

JL_MODULE_GETTER(main)
JL_MODULE_GETTER(base)
JL_MODULE_GETTER(core)
JL_MODULE_GETTER(top)

// Functions
JL_FUNCTION_TYPE *jl_function_getter(jl_module_t *m, const char *name) {
  return jl_get_function(m, name);
}

// Builtins
int8_t jl_hasproperty(jl_value_t *v, const char *name) {
  JL_FUNCTION_TYPE *hasproperty = jl_get_function(jl_base_module, "hasproperty");
  jl_value_t *ret = jl_call2(hasproperty, v, (jl_value_t *)jl_symbol(name));
  return jl_unbox_bool(ret);
}

size_t jl_propertycount(jl_value_t *v) {
  JL_FUNCTION_TYPE *propertynames =
      jl_get_function(jl_base_module, "propertynames");
  jl_array_t *properties = (jl_array_t *)jl_call1(propertynames, v);
  size_t len = jl_array_len(properties);
  return len;
}

const char **jl_propertynames(jl_value_t *v) {
  JL_FUNCTION_TYPE *propertynames =
      jl_get_function(jl_base_module, "propertynames");
  jl_array_t *properties = (jl_array_t *)jl_call1(propertynames, v);
  size_t len = jl_array_len(properties);
  const char **names = (const char **)malloc(len * sizeof(char *));
  for (size_t i = 0; i < len; i++) {
#if JULIA_VERSION_MAJOR >= 1 && JULIA_VERSION_MINOR >= 11
    jl_value_t *name = jl_array_data(properties, jl_value_t);
#else
    jl_value_t *name = jl_array_data(properties);
#endif
    names[i] = jl_symbol_name((jl_sym_t *)name);
  }
  return names;
}

jl_value_t *jl_nothing_getter() { return jl_nothing; }
jl_value_t *jl_true_getter() { return jl_true; }
jl_value_t *jl_false_getter() { return jl_false; }
const char *jl_symbol_name_getter(jl_sym_t *s) { return jl_symbol_name(s); }
size_t jl_nfields_getter(jl_datatype_t *t) { return jl_nfields(t); }
jl_datatype_t *jl_typeof_getter(jl_value_t *v) {
  return (jl_datatype_t *)jl_typeof(v);
}

// Arrays
size_t jl_array_len_getter(jl_array_t *a) { return jl_array_len(a); }
int32_t jl_array_ndims_getter(jl_array_t *a) { return jl_array_ndims(a); }
#if JULIA_VERSION_MAJOR >= 1 && JULIA_VERSION_MINOR >= 11
void *jl_array_data_getter(jl_array_t *a) { return jl_array_data_(a); }
#else
void *jl_array_data_getter(jl_array_t *a) { return jl_array_data(a); }
#endif
size_t jl_array_dim_getter(jl_array_t *a, int32_t i) {
  return jl_array_dim(a, i);
}

// Array utilities
STATIC_INLINE int jl_array_isboxed(jl_array_t *a) {
#if JULIA_VERSION_MAJOR >= 1 && JULIA_VERSION_MINOR >= 11
  return ((jl_datatype_t *)jl_typetagof(a->ref.mem))->layout->flags.arrayelem_isboxed;
#else
  return ((jl_array_t*)a)->flags.ptrarray;
#endif
}

jl_value_t *jl_array_ptr_ref_wrapper(jl_array_t *a, size_t i) {
  if (jl_array_isboxed(a)) {
    return jl_array_ptr_ref(a, i);
  } else {
    // For unboxed arrays, we need to box the primitive value
    jl_value_t *eltype = jl_array_eltype((jl_value_t *)a);
#if JULIA_VERSION_MAJOR >= 1 && JULIA_VERSION_MINOR >= 11
    void *data = jl_array_data_(a);
#else
    void *data = jl_array_data(a);
#endif

    if (eltype == (jl_value_t *)jl_bool_type) {
      return jl_box_bool(((int8_t *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_int8_type) {
      return jl_box_int8(((int8_t *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_uint8_type) {
      return jl_box_uint8(((uint8_t *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_int16_type) {
      return jl_box_int16(((int16_t *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_uint16_type) {
      return jl_box_uint16(((uint16_t *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_int32_type) {
      return jl_box_int32(((int32_t *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_uint32_type) {
      return jl_box_uint32(((uint32_t *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_int64_type) {
      return jl_box_int64(((int64_t *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_uint64_type) {
      return jl_box_uint64(((uint64_t *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_float32_type) {
      return jl_box_float32(((float *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_float64_type) {
      return jl_box_float64(((double *)data)[i]);
    } else if (eltype == (jl_value_t *)jl_char_type) {
      return jl_box_char(((uint32_t *)data)[i]);
    } else {
      // For unsupported types, fall back to jl_new_bits
      // This is a more general approach but requires knowing the element size
      return jl_new_bits(eltype, (char *)data + i * jl_datatype_size((jl_datatype_t *)eltype));
    }
  }
}

void jl_array_ptr_set_wrapper(jl_array_t *a, size_t i, jl_value_t *v) {
  if (jl_array_isboxed(a)) {
    jl_array_ptr_set(a, i, v);
  } else {
    // For unboxed arrays, we need to unbox the value and write directly to memory
    jl_value_t *eltype = jl_array_eltype((jl_value_t *)a);
#if JULIA_VERSION_MAJOR >= 1 && JULIA_VERSION_MINOR >= 11
    void *data = jl_array_data_(a);
#else
    void *data = jl_array_data(a);
#endif

    if (eltype == (jl_value_t *)jl_bool_type) {
      ((int8_t *)data)[i] = jl_unbox_bool(v);
    } else if (eltype == (jl_value_t *)jl_int8_type) {
      ((int8_t *)data)[i] = jl_unbox_int8(v);
    } else if (eltype == (jl_value_t *)jl_uint8_type) {
      ((uint8_t *)data)[i] = jl_unbox_uint8(v);
    } else if (eltype == (jl_value_t *)jl_int16_type) {
      ((int16_t *)data)[i] = jl_unbox_int16(v);
    } else if (eltype == (jl_value_t *)jl_uint16_type) {
      ((uint16_t *)data)[i] = jl_unbox_uint16(v);
    } else if (eltype == (jl_value_t *)jl_int32_type) {
      ((int32_t *)data)[i] = jl_unbox_int32(v);
    } else if (eltype == (jl_value_t *)jl_uint32_type) {
      ((uint32_t *)data)[i] = jl_unbox_uint32(v);
    } else if (eltype == (jl_value_t *)jl_int64_type) {
      ((int64_t *)data)[i] = jl_unbox_int64(v);
    } else if (eltype == (jl_value_t *)jl_uint64_type) {
      ((uint64_t *)data)[i] = jl_unbox_uint64(v);
    } else if (eltype == (jl_value_t *)jl_float32_type) {
      ((float *)data)[i] = jl_unbox_float32(v);
    } else if (eltype == (jl_value_t *)jl_float64_type) {
      ((double *)data)[i] = jl_unbox_float64(v);
    } else if (eltype == (jl_value_t *)jl_char_type) {
      ((uint32_t *)data)[i] = jl_unbox_uint32(v);
    } else {
      // For unsupported types, fall back to jl_array_ptr_set
      jl_array_ptr_set(a, i, v);
    }
  }
}

// GC
void jl_gc_push1(jl_value_t *x) { JL_GC_PUSH1(&x); }
void jl_gc_push2(jl_value_t *x, jl_value_t *y) { JL_GC_PUSH2(&x, &y); }
void jl_gc_push3(jl_value_t *x, jl_value_t *y, jl_value_t *z) {
  JL_GC_PUSH3(&x, &y, &z);
}
void jl_gc_push(jl_value_t **args, int32_t n) { JL_GC_PUSHARGS(args, n); }

void jl_gc_pop() { JL_GC_POP(); }
