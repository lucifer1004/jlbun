/**
 * Base class for all Julia-related errors.
 *
 * All Julia exceptions are mapped to specific error classes when possible.
 * Unknown exceptions are wrapped in `UnknownJuliaError`.
 */
export abstract class JuliaError extends Error {
  /** The original Julia exception type name */
  juliaType: string;

  constructor(message: string, juliaType: string) {
    super(message);
    this.juliaType = juliaType;
  }
}

/**
 * Thrown when a type conversion cannot be done exactly.
 *
 * Julia equivalent: `InexactError`
 *
 * @example
 * ```typescript
 * // Trying to convert 1.5 to Int64
 * Julia.Base.Int64(1.5); // throws InexactError
 * ```
 */
export class InexactError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "InexactError", "InexactError");
    this.name = "InexactError";
  }
}

/**
 * Thrown when no method matches the given arguments.
 *
 * Julia equivalent: `MethodError`
 *
 * @example
 * ```typescript
 * // Calling a function with wrong argument types
 * Julia.Base.sqrt("hello"); // throws MethodError
 * ```
 */
export class MethodError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "MethodError", "MethodError");
    this.name = "MethodError";
  }
}

/**
 * Thrown when accessing an array index out of bounds.
 *
 * Julia equivalent: `BoundsError`
 *
 * @example
 * ```typescript
 * const arr = JuliaArray.from(new Float64Array([1, 2, 3]));
 * Julia.Base.getindex(arr, 10); // throws BoundsError
 * ```
 */
export class BoundsError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "BoundsError", "BoundsError");
    this.name = "BoundsError";
  }
}

/**
 * Thrown when a function is called with incorrect arguments.
 *
 * Julia equivalent: `ArgumentError`
 *
 * @example
 * ```typescript
 * Julia.Base.zeros(-1); // throws ArgumentError (negative dimension)
 * ```
 */
export class ArgumentError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "ArgumentError", "ArgumentError");
    this.name = "ArgumentError";
  }
}

/**
 * Thrown when an argument is of the wrong type.
 *
 * Julia equivalent: `TypeError`
 */
export class TypeError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "TypeError", "TypeError");
    this.name = "TypeError";
  }
}

/**
 * Thrown when an argument is outside the valid domain.
 *
 * Julia equivalent: `DomainError`
 *
 * @example
 * ```typescript
 * Julia.Base.sqrt(-1); // throws DomainError (for real sqrt)
 * ```
 */
export class DomainError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "DomainError", "DomainError");
    this.name = "DomainError";
  }
}

/**
 * Thrown when integer division by zero occurs.
 *
 * Julia equivalent: `DivideError`
 *
 * @example
 * ```typescript
 * Julia.Base.div(1, 0); // throws DivideError
 * ```
 */
export class DivideError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "DivideError", "DivideError");
    this.name = "DivideError";
  }
}

/**
 * Thrown when integer overflow occurs in checked arithmetic.
 *
 * Julia equivalent: `OverflowError`
 */
export class OverflowError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "OverflowError", "OverflowError");
    this.name = "OverflowError";
  }
}

/**
 * Thrown when a key is not found in a collection.
 *
 * Julia equivalent: `KeyError`
 *
 * @example
 * ```typescript
 * const dict = JuliaDict.from([["a", 1]]);
 * Julia.Base.getindex(dict, "nonexistent"); // throws KeyError
 * ```
 */
export class KeyError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "KeyError", "KeyError");
    this.name = "KeyError";
  }
}

/**
 * Thrown when loading a module or package fails.
 *
 * Julia equivalent: `LoadError`
 */
export class LoadError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "LoadError", "LoadError");
    this.name = "LoadError";
  }
}

/**
 * Thrown for errors during string processing.
 *
 * Julia equivalent: `StringIndexError`
 */
export class StringIndexError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "StringIndexError", "StringIndexError");
    this.name = "StringIndexError";
  }
}

/**
 * Thrown when stack overflow occurs (deep recursion).
 *
 * Julia equivalent: `StackOverflowError`
 */
export class StackOverflowError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "StackOverflowError", "StackOverflowError");
    this.name = "StackOverflowError";
  }
}

/**
 * Thrown when dimensions are mismatched in array operations.
 *
 * Julia equivalent: `DimensionMismatch`
 *
 * @example
 * ```typescript
 * const a = JuliaArray.init(Julia.Float64, 2, 3);
 * const b = JuliaArray.init(Julia.Float64, 4, 5);
 * Julia.Base["*"](a, b); // throws DimensionMismatch
 * ```
 */
export class DimensionMismatch extends JuliaError {
  constructor(message?: string) {
    super(message ?? "DimensionMismatch", "DimensionMismatch");
    this.name = "DimensionMismatch";
  }
}

/**
 * Thrown when a variable or field is not defined.
 *
 * Julia equivalent: `UndefVarError`
 *
 * @example
 * ```typescript
 * Julia.eval("nonexistent_variable"); // throws UndefVarError
 * ```
 */
export class UndefVarError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "UndefVarError", "UndefVarError");
    this.name = "UndefVarError";
  }
}

/**
 * Thrown when accessing an uninitialized reference.
 *
 * Julia equivalent: `UndefRefError`
 */
export class UndefRefError extends JuliaError {
  constructor(message?: string) {
    super(message ?? "UndefRefError", "UndefRefError");
    this.name = "UndefRefError";
  }
}

/**
 * Thrown for errors occurring in a Julia task.
 *
 * Julia equivalent: `TaskFailedException`
 */
export class TaskFailedException extends JuliaError {
  constructor(message?: string) {
    super(message ?? "TaskFailedException", "TaskFailedException");
    this.name = "TaskFailedException";
  }
}

/**
 * Thrown when an interrupt signal is received (Ctrl+C).
 *
 * Julia equivalent: `InterruptException`
 */
export class InterruptException extends JuliaError {
  constructor(message?: string) {
    super(message ?? "InterruptException", "InterruptException");
    this.name = "InterruptException";
  }
}

/**
 * Thrown for Julia errors that don't have a specific wrapper class.
 *
 * Check the `juliaType` property for the original Julia exception type.
 */
export class UnknownJuliaError extends JuliaError {
  constructor(message?: string, juliaType?: string) {
    super(message ?? "UnknownJuliaError", juliaType ?? "Unknown");
    this.name = "UnknownJuliaError";
  }
}

/**
 * Map Julia error type string to corresponding TypeScript error class.
 * @internal
 */
export function createJuliaError(errType: string, message: string): JuliaError {
  switch (errType) {
    case "InexactError":
      return new InexactError(message);
    case "MethodError":
      return new MethodError(message);
    case "BoundsError":
      return new BoundsError(message);
    case "ArgumentError":
      return new ArgumentError(message);
    case "TypeError":
      return new TypeError(message);
    case "DomainError":
      return new DomainError(message);
    case "DivideError":
      return new DivideError(message);
    case "OverflowError":
      return new OverflowError(message);
    case "KeyError":
      return new KeyError(message);
    case "LoadError":
      return new LoadError(message);
    case "StringIndexError":
      return new StringIndexError(message);
    case "StackOverflowError":
      return new StackOverflowError(message);
    case "DimensionMismatch":
      return new DimensionMismatch(message);
    case "UndefVarError":
      return new UndefVarError(message);
    case "UndefRefError":
      return new UndefRefError(message);
    case "TaskFailedException":
      return new TaskFailedException(message);
    case "InterruptException":
      return new InterruptException(message);
    default:
      return new UnknownJuliaError(message, errType);
  }
}
