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

include("symbol_selection.jl")

function bunffi_type(cursor_type)
    result = @match cursor_type begin
        ::CLVoid => "FFIType.void"
        ::CLPointer =>
            @match Clang.getPointeeType(cursor_type) begin
                ::Union{CLChar_S, CLChar_U} => "FFIType.cstring"
                _ => "FFIType.ptr"
            end
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

    bunffi_fdecls = map(filter(x -> isexported(x) && occursin(spelling(x), src) && spelling(x) ∈ INCLUDED, fdecls)) do fdecl
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
        returns: $size_t,
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
    jl_array_dim_getter: {
        args: [FFIType.ptr, FFIType.i32],
        returns: $size_t,
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

    // GC
    jl_gc_push1: {
        args: [FFIType.ptr],
        returns: FFIType.void,
    },
    jl_gc_push2: {
        args: [FFIType.ptr, FFIType.ptr],
        returns: FFIType.void,
    },
    jl_gc_push3: {
        args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
        returns: FFIType.void,
    },
    jl_gc_push: {
        args: [FFIType.ptr, FFIType.i32],
        returns: FFIType.void,
    },
    jl_gc_pop: {
        args: [],
        returns: FFIType.void,
    },

    // Auto generated wrappers
    $(join(bunffi_fdecls, "\n    "))
})
"""

    write(joinpath(@__DIR__, "..", "jlbun", "wrapper.ts"), dlopen_template)
end

# Auto-run section: automatically find Julia and generate wrapper
function find_julia_header()
    # Use the same logic as FindJulia.cmake to locate julia.h
    julia_bindir = Sys.BINDIR

    # Calculate include directory using the same approach as CMake
    julia_include_dir = joinpath(match(r"(.*)(bin)", julia_bindir).captures[1], "include", "julia")

    # Check if the directory exists (installed Julia)
    if !isdir(julia_include_dir)
        # We're running directly from build, try alternative paths
        julia_base_dir_aux = splitdir(splitdir(julia_bindir)[1])[1]  # useful for running-from-build
        julia_include_dir = joinpath(julia_base_dir_aux, "usr", "include")
        if !isdir(joinpath(julia_include_dir, "julia"))
            julia_include_dir = joinpath(julia_base_dir_aux, "include", "julia")
        end
    end

    header_path = joinpath(julia_include_dir, "julia.h")
    if isfile(header_path)
        return header_path
    end

    error("Could not find julia.h header file at $header_path. Please ensure Julia is properly installed.")
end

# Auto-run the codegen if this file is executed directly
if abspath(PROGRAM_FILE) == abspath(@__FILE__)
    println("Auto-detecting Julia installation and generating wrapper...")
    try
        julia_header_path = find_julia_header()
        println("Found julia.h at: $julia_header_path")
        codegen(julia_header_path)
        println("Successfully generated wrapper.ts")
    catch e
        println("Error during codegen: $e")
        rethrow(e)
    end
end
