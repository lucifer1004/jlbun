#include <julia.h>

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

// Modules
#define JL_MODULE_GETTER(x)                                                    \
  jl_module_t *jl_##x##_module_getter() { return jl_##x##_module; }

JL_MODULE_GETTER(main)
JL_MODULE_GETTER(base)
JL_MODULE_GETTER(core)
JL_MODULE_GETTER(top)

// Functions
jl_function_t *jl_function_getter(jl_module_t *m, const char *name) {
  return jl_get_function(m, name);
}

// Builtins
int8_t jl_hasproperty(jl_value_t *v, const char *name) {
  jl_function_t *hasproperty = jl_get_function(jl_base_module, "hasproperty");
  jl_value_t *ret = jl_call2(hasproperty, v, (jl_value_t *)jl_symbol(name));
  return jl_unbox_bool(ret);
}

size_t jl_propertycount(jl_value_t *v) {
  jl_function_t *propertynames =
      jl_get_function(jl_base_module, "propertynames");
  jl_array_t *properties = (jl_array_t *)jl_call1(propertynames, v);
  size_t len = jl_array_len(properties);
  return len;
}

const char **jl_propertynames(jl_value_t *v) {
  jl_function_t *propertynames =
      jl_get_function(jl_base_module, "propertynames");
  jl_array_t *properties = (jl_array_t *)jl_call1(propertynames, v);
  size_t len = jl_array_len(properties);
  const char **names = (const char **)malloc(len * sizeof(char *));
  for (size_t i = 0; i < len; i++) {
    jl_value_t *name = jl_arrayref(properties, i);
    names[i] = jl_symbol_name((jl_sym_t *)name);
  }
  return names;
}

// Arrays
size_t jl_array_len_getter(jl_array_t *a) { return jl_array_len(a); }
int32_t jl_array_ndims_getter(jl_array_t *a) { return jl_array_ndims(a); }
void* jl_array_data_getter(jl_array_t *a) { return jl_array_data(a); }

// Values
jl_value_t *jl_nothing_getter() { return jl_nothing; }
jl_value_t *jl_true_getter() { return jl_true; }
jl_value_t *jl_false_getter() { return jl_false; }
const char* jl_symbol_name_getter(jl_sym_t *s) { return jl_symbol_name(s); }
