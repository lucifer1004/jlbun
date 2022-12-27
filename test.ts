import { Julia, JuliaArray } from "./src/index.js";

Julia.init();
const bunArray = new Float64Array([1, 2, 3, 4, 5]);
console.log("Array created by Bun: ", bunArray, " length: ", bunArray.length);
const juliaArray = JuliaArray.from(bunArray);
Julia.Base.println("Can be accessed by Julia: ", juliaArray, " length: ", juliaArray.length, " dims: ", juliaArray.ndims);
bunArray[1] = 100.0;
Julia.Base.println("Array value modified: ", juliaArray);
Julia.Base["setindex!"](juliaArray, -10.0, 1);
Julia.Base.println("Array value modified: ", juliaArray);
Julia.close();
