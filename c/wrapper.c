#include <julia.h>

// Data types
#define JL_DATATYPE_GETTER(x)                                                  \
  jl_datatype_t *jl_##x##_type_getter() { return jl_##x##_type; }

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

// FIXME: `jl_call` has to be wrapped
jl_value_t *jl_calln(jl_function_t *f, jl_value_t **args, uint32_t nargs) {
  return jl_call(f, args, nargs);
}
