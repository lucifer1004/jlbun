using Clang
using Clang.LibClang
using MLStyle

size_t = Sys.WORD_SIZE == 64 ? "FFIType.i64" : "FFIType.i32"
usize_t = Sys.WORD_SIZE == 64 ? "FFIType.u64" : "FFIType.u32"

TYPEDEF_DICT = Dict(
    "int8_t" => "FFIType.i8",
    "uint8_t" => "FFIType.u8",
    "int16_t" => "FFIType.i16",
    "uint16_t" => "FFIType.u16",
    "int32_t" => "FFIType.i32",
    "uint32_t" => "FFIType.u32",
    "int64_t" => "FFIType.i64",
    "uint64_t" => "FFIType.u64",
    "size_t" => size_t,
    "ssize_t" => size_t,
    "usize_t" => usize_t,
    "uintptr_t" => usize_t,
    "jl_libhandle" => usize_t,
    "va_list" => "FFIType.ptr",
    "jl_gc_collection_t" => "FFIType.i32",
    "jl_ptls_t" => "FFIType.ptr",
)

EXCLUDED = Set([
    "jl_finalize",
    "jl_free_stack",
    "jl_gc_use",
    "jl_clear_malloc_data",
    "jl_symbol_name",
    "jl_egal__unboxed",
    "jl_apply_modify_type",
    "jl_set_module_max_methods",
    "jl_get_module_max_methods",
    "jl_binding_type",
    "jl_module_use_as",
    "jl_module_import_as",
    "jl_stat",
    "jl_deserialize_verify_header",
    "jl_set_newly_inferred",
    "jl_expand_in_world",
    "jl_is_syntactic_operator",
    "jl_uv_puts",
    "jl_flush_cstdio",
    "jl_",
    "jl_sizeof_jl_options",
    "jl_format_filename"
])

function bunffi_type(cursor_type)
    result = @match cursor_type begin
        ::CLVoid => "FFIType.void"
        ::CLPointer => "FFIType.ptr"
        ::CLInt => "FFIType.i32"
        ::CLUInt => "FFIType.u32"
        ::CLLong => size_t
        ::CLULong => usize_t
        ::CLLongLong => "FFIType.i64"
        ::CLULongLong => "FFIType.u64"
        ::CLFloat => "FFIType.f32"
        ::CLDouble => "FFIType.f64"
        ::CLTypedef => get(TYPEDEF_DICT, spelling(cursor_type), "unknown typedef")
        _ => "unknown"
    end

    if startswith(result, "unknown")
        @warn spelling(cursor_type)
    end

    result
end

function isexported(fdecl)
    startswith(spelling(fdecl), "jl_") && children(fdecl)[1] isa CLVisibilityAttr
end

function codegen(julia_header_path)
    src = read(julia_header_path, String)
    trans_unit = Clang.parse_header(Index(), julia_header_path)
    root_cursor = Clang.getTranslationUnitCursor(trans_unit)
    fdecls = search(root_cursor, CXCursor_FunctionDecl)

    bunffi_fdecls = map(filter(x -> isexported(x) && occursin(spelling(x), src) && spelling(x) ∉ EXCLUDED, fdecls)) do fdecl
        name = spelling(fdecl)
        result_type = Clang.getCursorResultType(fdecl)
        returns = bunffi_type(result_type)
        args = []
        for i in 0:10
            child = Clang.getArgument(fdecl, i)
            child_type = Clang.getCursorType(child)
            if child_type isa CLInvalid
                break
            else
                push!(args, bunffi_type(child_type))
            end
        end

        """
    $name: {
            args: [$(join(args, ", "))],
            returns: $returns,
        },"""
    end

    dlopen_template = """
import { dlopen, FFIType, suffix } from "bun:ffi";
import { join } from "path";

const LIBJLBUN_PATH = join(import.meta.dir, "..", "build", `libjlbun.\${suffix}`);

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

    // Builtins
    jl_hasproperty: {
        args: [FFIType.ptr, FFIType.cstring],
        returns: FFIType.i8,
    },
    jl_propertycount: {
        args: [FFIType.ptr],
        returns: $size_t,
    },
    jl_propertynames: {
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
        returns: $size_t,
    },
    jl_array_ndims_getter: {
        args: [FFIType.ptr],
        returns: FFIType.i32,
    },
    jl_array_data_getter: {
        args: [FFIType.ptr],
        returns: FFIType.ptr,
    },
    jl_array_len_getter: {
        args: [FFIType.ptr, FFIType.i32],
        returns: $size_t,
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
    $(join(bunffi_fdecls, "\n    "))
})
"""

    write(joinpath(@__DIR__, "..", "src", "wrapper.ts"), dlopen_template)
end
