import { Julia, JuliaArray, JuliaBool, JuliaInt64 } from "./src/index.js";

Julia.init();
const bunArray = new Float64Array([1, 2, 3, 4, 5]);
console.log("Created by Bun: ", bunArray, " length: ", bunArray.length);
const juliaArray = JuliaArray.from(bunArray);
Julia.Base.println(
  "Accessed from Julia: ",
  juliaArray,
  " length: ",
  juliaArray.length,
  " dims: ",
  juliaArray.ndims,
);
bunArray[1] = 100.0;
Julia.Base.println("Modified by Bun: ", juliaArray);
Julia.Base["setindex!"](juliaArray, -10.0, 1);
Julia.Base.println("Modified by Julia: ", juliaArray);
juliaArray.reverse();
Julia.Base.println("Reversed By Julia: ", juliaArray);
console.log("Accessed from Bun: ", bunArray);
bunArray.reverse();
Julia.Base.println("Reversed By Bun: ", juliaArray);
Julia.close();
