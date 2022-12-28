using Libdl
using PackageCompiler

PackageCompiler.create_sysimage(;
                                sysimage_path = joinpath(@__DIR__,
                                                         "..",
                                                         "build",
                                                         "sysimage.$dlext"),
                                precompile_execution_file = "precompile.jl")
