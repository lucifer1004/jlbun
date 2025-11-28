import { beforeAll, describe, expect, it } from "bun:test";
import { Julia, JuliaFunction, JuliaTask, MethodError } from "../index.js";
import { ensureJuliaInitialized } from "./setup.js";

beforeAll(() => ensureJuliaInitialized());

describe("JuliaTask", () => {
  it("can be created from Julia", async () => {
    const task = Julia.eval("Task(() -> sum(i for i in 1:100))") as JuliaTask;
    const promise = task.value;
    expect((await promise).value).toBe(5050n);
  });

  it("can be created from JS", async () => {
    const func = Julia.wrapFunctionCall(
      Julia.Base.sum,
      {},
      new Int32Array([1, 2, 3]),
    );
    const task = JuliaTask.from(func);
    expect((await task.value).value).toBe(6n);

    const func2 = Julia.wrapFunctionCall(Julia.Base.sort, { rev: true }, [
      "foo",
      "bar",
      "hello",
    ]);
    const task2 = JuliaTask.from(func2);
    expect((await task2.value).value).toEqual(["hello", "foo", "bar"]);
  });

  it("can be scheduled to different threads", async () => {
    const func = Julia.eval("() -> sum(i for i in 1:100)") as JuliaFunction;
    const nthreads = Julia.nthreads;
    const promises = [];
    for (let i = 0; i < nthreads; i++) {
      promises.push(JuliaTask.from(func).schedule(i).value);
    }
    const results = (await Promise.all(promises)).map((x) => x.value);
    expect(results).toEqual(new Array(nthreads).fill(5050n));
  });
});

describe("JuliaTask additional coverage", () => {
  it("schedule throws when task cannot be rescheduled", () => {
    // Create a task from Julia directly (not via from())
    const taskPtr = (Julia.eval("Task(() -> 1)") as JuliaTask).ptr;
    const task = new JuliaTask(taskPtr, false); // canReschedule = false
    expect(() => task.schedule(0)).toThrow("This task cannot be rescheduled");
  });

  it("schedule throws when threadId is out of range", () => {
    const func = Julia.eval("() -> 1") as JuliaFunction;
    const task = JuliaTask.from(func);
    expect(() => task.schedule(-1)).toThrow(MethodError);
    expect(() => task.schedule(9999)).toThrow(MethodError);
  });

  it("toString returns task string representation", () => {
    const func = Julia.eval("() -> 1") as JuliaFunction;
    const task = JuliaTask.from(func);
    expect(task.toString()).toContain("Task");
  });
});
