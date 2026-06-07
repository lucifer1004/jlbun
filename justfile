set shell := ["bash", "-euo", "pipefail", "-c"]
set positional-arguments

# ---------------------------------------------------------------------------- #
#                                 DEPENDENCIES                                  #
# ---------------------------------------------------------------------------- #

# Bun: https://bun.sh
bun := require("bun")
bunx := require("bunx")

# CMake: https://cmake.org
cmake := require("cmake")

# Juliaup: https://github.com/JuliaLang/juliaup
julia := require("julia")
juliaup := require("juliaup")

# ---------------------------------------------------------------------------- #
#                                  CONSTANTS                                    #
# ---------------------------------------------------------------------------- #

JULIA_VERSIONS := "1.10 1.11 1.12 1.13 nightly"

# ---------------------------------------------------------------------------- #
#                                  RECIPES                                      #
# ---------------------------------------------------------------------------- #

# Show available commands
[group("meta")]
default:
    @just --list

# Install dependencies
[group("dependencies")]
install:
    bun install

# Build the Julia C wrapper
[group("build")]
build-lib:
    bun run build-lib

# Build distributable JavaScript and declarations
[group("build")]
package:
    bun run rollup -c rollup.config.js

# Generate API documentation
[group("docs")]
docs:
    bun run typedoc

# Remove generated outputs
[group("utilities")]
clean:
    rm -rf build dist docs coverage

# ---------------------------------------------------------------------------- #
#                                   TESTS                                       #
# ---------------------------------------------------------------------------- #

# Run tests
[group("tests")]
test *args:
    JULIA_NUM_THREADS=auto bun test {{ args }}

# Run tests with coverage
[group("tests")]
coverage *args:
    JULIA_NUM_THREADS=auto bun test --coverage {{ args }}

# Build and test with one Julia version via juliaup override
[group("tests")]
[script]
julia-test version:
    root="{{ justfile_dir() }}"

    cleanup() {
      status=$?
      juliaup override unset -p "${root}" >/dev/null 2>&1 || true

      echo
      echo "{{ BOLD + CYAN }}[default] restore build-lib{{ NORMAL }}"
      if ! bun run build-lib; then
        if [[ "${status}" -eq 0 ]]; then
          status=1
        fi
      fi

      exit "${status}"
    }

    trap cleanup EXIT
    juliaup override set "{{ version }}" -p "${root}"
    julia --startup-file=no --version
    bun run build-lib
    JULIA_NUM_THREADS=auto bun test

# Build and test against the local Julia compatibility matrix
[group("tests")]
[script]
julia-matrix versions=JULIA_VERSIONS:
    root="{{ justfile_dir() }}"

    cleanup() {
      status=$?
      juliaup override unset -p "${root}" >/dev/null 2>&1 || true

      echo
      echo "{{ BOLD + CYAN }}[default] restore build-lib{{ NORMAL }}"
      if ! bun run build-lib; then
        if [[ "${status}" -eq 0 ]]; then
          status=1
        fi
      fi

      exit "${status}"
    }

    trap cleanup EXIT
    for version in {{ versions }}; do
      echo
      echo "{{ BOLD + CYAN }}[${version}] override{{ NORMAL }}"
      juliaup override set "${version}" -p "${root}"

      julia --startup-file=no --version

      echo "{{ BOLD + CYAN }}[${version}] build-lib{{ NORMAL }}"
      bun run build-lib

      echo "{{ BOLD + CYAN }}[${version}] test{{ NORMAL }}"
      JULIA_NUM_THREADS=auto bun test
    done

# ---------------------------------------------------------------------------- #
#                                   CHECKS                                      #
# ---------------------------------------------------------------------------- #

# Type-check TypeScript
[group("checks")]
typecheck:
    bunx tsc --noEmit

# Check lint rules without writing files
[group("checks")]
lint-check:
    bunx eslint '**/*.{js,ts,json}' '*.{js,ts,cjs}'

# Fix lint issues
[group("checks")]
lint:
    bun run lint

# Check formatting without writing files
[group("checks")]
fmt-check:
    bunx prettier --check './**/*.{ts,tsx,cjs,js,jsx,json}'

# Format source files
[group("checks")]
fmt:
    bun run fmt

# Run the standard local verification suite
[group("checks")]
check: typecheck lint-check test

# Run all local verification before release
[group("checks")]
verify: check docs package

alias b := build-lib
alias c := check
alias jt := julia-test
alias jm := julia-matrix
alias t := test
