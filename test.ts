import { Julia, JuliaArray } from "./src/index.js";

const julia = Julia.getInstance();
julia.eval("println(Base.sqrt(2))");
const println = julia.getFunction(Julia.Base, "println");
const arr = new JuliaArray(Julia.Int64, 10);
println(arr, " ", arr.length, " ", arr.ndims);
julia.close();
