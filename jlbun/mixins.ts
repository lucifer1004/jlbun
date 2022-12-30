import { Julia } from "./index.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
type GConstructor<T = {}> = new (...args: any[]) => T;

type JuliaValue = GConstructor<{ ptr: number }>;

export function JuliaValue<TBase extends JuliaValue>(Base: TBase) {
  return class JuliaValue extends Base {
    toString(): string {
      return Julia.Base.string(this).value;
    }
  };
}
