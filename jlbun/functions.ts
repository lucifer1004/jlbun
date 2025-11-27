import { FFIFunction, JSCallback, Pointer } from "bun:ffi";
import { Julia, JuliaNamedTuple, JuliaValue } from "./index.js";
import { mapFFITypeToJulia } from "./utils.js";

/**
 * Wrapper for Julia `Function`.
 *
 * If the `JuliaFunction` comes from a JS function, you can use the
 * `.rawCB` field to get the raw `JSCallback` and use `cb.close()`
 * if the function will no longer be used.
 */
export class JuliaFunction extends Function implements JuliaValue {
  ptr: Pointer;
  name: string;
  rawCB?: JSCallback;

  constructor(ptr: Pointer, name: string) {
    super();
    this.ptr = ptr;
    this.name = name;
    return new Proxy(this, {
      apply: (target, _thisArg, args) => Julia.call(target, ...args),
    });
  }

  /**
   * Create a `JuliaFunction` from a JS function.
   *
   * @param jsFunc The JS function to be wrapped.
   * @param definition Type definition of the JS function. It follows
   * Bun's `JSCallback`.
   */
  public static from(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jsFunc: (...args: any[]) => any,
    definition: FFIFunction,
  ): JuliaFunction {
    const cb = new JSCallback(jsFunc, definition);
    const returnType = mapFFITypeToJulia(definition.returns ?? "void");
    const argTypes = (definition.args ?? []).map((arg) =>
      mapFFITypeToJulia(arg),
    );

    const funcStr = `
function (${Array.from({ length: argTypes.length }, (_, i) => `x${i}`).join(
      ", ",
    )})
  ret = ccall(
    convert(Ptr{Nothing}, ${cb.ptr}),
    ${returnType},
    (${argTypes.join(", ")},),
    ${Array.from({ length: argTypes.length }, (_, i) => {
      if (argTypes[i] === "Ptr{Nothing}") {
        return `pointer_from_objref(x${i})`;
      } else {
        return `x${i}`;
      }
    }).join(", ")}
  )

  ${returnType === "Cstring" ? "ret = unsafe_string(ret)" : ""}
end
    `;

    const func = Julia.eval(funcStr) as JuliaFunction;
    func.rawCB = cb;
    return func;
  }

  /**
   * Call the function with keyword arguments.
   *
   * @param kwargs Keyword arguments, can either be a `JuliaNamedTuple` or a JS object.
   * @param args Other arguments.
   */
  callWithKwargs(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kwargs: JuliaNamedTuple | Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): JuliaValue {
    return Julia.callWithKwargs(this, kwargs, ...args);
  }

  /**
   * Free the underlying `JSCallback` if this function is created from one.
   */
  close(): void {
    if (this.rawCB !== undefined) {
      this.rawCB.close();
    }
  }

  get value(): string {
    return this.toString();
  }

  toString(): string {
    return `[JuliaFunction ${this.name}]`;
  }
}
