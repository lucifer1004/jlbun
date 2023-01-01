import { Julia, JuliaSymbol, JuliaValue } from "./index.js";

export class JuliaTask implements JuliaValue {
  ptr: number;
  queryInterval: number;
  scheduled: boolean;

  constructor(ptr: number, queryInterval = 100) {
    this.ptr = ptr;
    this.queryInterval = queryInterval;
    this.scheduled = false;
  }

  get value(): Promise<JuliaValue> {
    return new Promise((resolve, reject) => {
      if (!Julia.Base.istaskstarted(this).value && !this.scheduled) {
        Julia.Base.yield(this);
        this.scheduled = true;
      }

      const timer = setInterval(() => {
        if (Julia.Base.istaskdone(this).value) {
          const result = Julia.Core.getproperty(
            this,
            JuliaSymbol.from("result"),
          );
          clearInterval(timer);
          if (Julia.Base.istaskfailed(this).value) {
            reject(result);
          } else {
            resolve(result);
          }
        }
      }, this.queryInterval);
    });
  }

  toString(): string {
    return Julia.string(this);
  }
}
