import { Julia, JuliaArray } from "./src/index.js";

const bunArray = new Float64Array(100000000);
for (let i = 0; i < bunArray.length; i++) {
  bunArray[i] = Math.random();
}

Julia.init();
const jlsqrt = Julia.Base.sqrt;
const jlmap = Julia.Base.map;
const jlmapi = Julia.Base["map!"];
const juliaArray = JuliaArray.from(new Float64Array(bunArray));

let start = new Date().getTime();
for (let i = 0; i < 100000000; ++i) {
  bunArray[i] = Math.sqrt(bunArray[i]);
}
let elapsed = new Date().getTime() - start;
console.log(`Bun used ${elapsed} ms.`);

start = new Date().getTime();
jlmapi(jlsqrt, juliaArray, juliaArray);
elapsed = new Date().getTime() - start;
console.log(`Julia used ${elapsed} ms.`);

start = new Date().getTime();
bunArray.map(Math.sqrt);
elapsed = new Date().getTime() - start;
console.log(`Bun used ${elapsed} ms.`);

start = new Date().getTime();
jlmap(jlsqrt, juliaArray);
elapsed = new Date().getTime() - start;
console.log(`Julia used ${elapsed} ms.`);

Julia.close();
