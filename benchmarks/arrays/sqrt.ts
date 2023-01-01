import { FORMAT_MD, suite } from "@thi.ng/bench";
import { Julia, JuliaArray } from "../../jlbun/index.js";

Julia.init({ project: null });

const genArray = (n: number) => {
  const arr = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    arr[i] = Math.random();
  }
  return arr;
};

const arr1000 = genArray(1000);
const arr10000 = genArray(10000);
const arr100000 = genArray(100000);
const arr1000000 = genArray(1000000);

const bunFn = (arr: Float64Array) => {
  return arr.map(Math.sqrt);
};

const juliaFn = (arr: Float64Array) => {
  const jlArr = JuliaArray.from(arr);
  return jlArr.map(Julia.Base.sqrt).value;
};

suite(
  [
    { title: "bun sqrt of 1000", fn: () => bunFn(arr1000) },
    { title: "julia sqrt of 1000", fn: () => juliaFn(arr1000) },
    { title: "bun sqrt of 10000", fn: () => bunFn(arr10000) },
    { title: "julia sqrt of 10000", fn: () => juliaFn(arr10000) },
    { title: "bun sqrt of 100000", fn: () => bunFn(arr100000) },
    { title: "julia sqrt of 100000", fn: () => juliaFn(arr100000) },
    { title: "bun sqrt of 1000000", fn: () => bunFn(arr1000000) },
    { title: "julia sqrt of 1000000", fn: () => juliaFn(arr1000000) },
  ],
  {
    iter: 10,
    size: 100,
    warmup: 5,
    format: FORMAT_MD,
  },
);

Julia.close();
