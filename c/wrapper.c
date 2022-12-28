#include <julia.h>
#include <stdio.h>
#include <stdlib.h>

char* itoa(int x) {
  int length = snprintf(NULL, 0, "%d", x);
  char *str = malloc(length + 1);
  snprintf(str, length + 1, "%d", x);
  return str;
}

// Data types
#define JL_DATATYPE_GETTER(x)                                                  \
  jl_datatype_t *jl_##x##_type_getter() { return jl_##x##_type; }

JL_DATATYPE_GETTER(any)
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

const char **jl_propertynames(jl_value_t *v) {
  jl_function_t *propertynames =
      jl_get_function(jl_base_module, "propertynames");
  jl_array_t *properties = (jl_array_t *)jl_call1(propertynames, v);
  size_t len = jl_array_len(properties);
  const char **names = (const char **)malloc((len + 1) * sizeof(char *));
  names[0] = itoa(len);
  for (size_t i = 0; i < len; i++) {
    jl_value_t *name = jl_arrayref(properties, i);
    names[i + 1] = jl_symbol_name((jl_sym_t *)name);
  }
  return names;
}

// Arrays
size_t jl_array_len_getter(jl_array_t *a) { return jl_array_len(a); }
int32_t jl_array_ndims_getter(jl_array_t *a) { return jl_array_ndims(a); }
