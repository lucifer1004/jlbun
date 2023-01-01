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
const arr1000_2 = genArray(1000);
const arr10000 = genArray(10000);
const arr10000_2 = genArray(10000);
const arr100000 = genArray(100000);
const arr100000_2 = genArray(100000);
const arr1000000 = genArray(1000000);
const arr1000000_2 = genArray(1000000);

const bunFn = (arr: Float64Array, arr2: Float64Array) => {
  const arr3 = new Float64Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    arr3[i] = arr[i] * arr2[i];
  }
  return arr3;
};

const juliaFn = (arr: Float64Array, arr2: Float64Array) => {
  const jlArr = JuliaArray.from(arr);
  const jlArr2 = JuliaArray.from(arr2);
  const jlArr3 = Julia.Base.broadcast(Julia.Base["*"], jlArr, jlArr2);
  return jlArr3.value;
};

suite(
  [
    { title: "bun mul of 1000", fn: () => bunFn(arr1000, arr1000_2) },
    {
      title: "julia mul of 1000",
      fn: () => juliaFn(arr1000, arr1000_2),
    },
    {
      title: "bun mul of 10000",
      fn: () => bunFn(arr10000, arr10000_2),
    },
    {
      title: "julia mul of 10000",
      fn: () => juliaFn(arr10000, arr10000_2),
    },
    {
      title: "bun mul of 100000",
      fn: () => bunFn(arr100000, arr100000_2),
    },
    {
      title: "julia mul of 100000",
      fn: () => juliaFn(arr100000, arr100000_2),
    },
    {
      title: "bun mul of 1000000",
      fn: () => bunFn(arr1000000, arr1000000_2),
    },
    {
      title: "julia mul of 1000000",
      fn: () => juliaFn(arr1000000, arr1000000_2),
    },
  ],
  {
    iter: 10,
    size: 50,
    warmup: 5,
    format: FORMAT_MD,
  },
);

Julia.close();
