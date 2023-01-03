# jlbun - Using Julia in Bun

![Logo of jlbun](https://user-images.githubusercontent.com/13583761/210193825-4b898ddf-b4b2-4e21-a691-c05240bb81e3.png)

- [jlbun - Using Julia in Bun](#jlbun---using-julia-in-bun)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Evaluate Julia code](#evaluate-julia-code)
    - [Pass a Bun array to Julia](#pass-a-bun-array-to-julia)
    - [Pass a Julia Array to Bun](#pass-a-julia-array-to-bun)
    - [Do some linear algebra](#do-some-linear-algebra)
    - [Install and use new packages](#install-and-use-new-packages)
    - [Function calls with keyword arguments](#function-calls-with-keyword-arguments)
    - [Call JS functions from Julia](#call-js-functions-from-julia)
    - [Run Julia with multiple threads](#run-julia-with-multiple-threads)
  - [TODO](#todo)

## Installation

> - You need to have `Bun`, `CMake` and `Julia` installed to use this library.
> - `bun install` does not run the packages's `install` scripts, so `npm install` is used instead. 

```bash
npm install jlbun
```

## Usage

### Evaluate Julia code

`jlbun` provides `Julia.eval()` and `Julia.tagEval()`. The former accepts a string, while the latter accepts a tagged template literal.

```typescript
import { Julia } from "jlbun";

Julia.init();

Julia.eval('println("Hello from Julia")'); // "Hello from Julia"

const arr = [1, 2, "hello"];
Julia.tagEval`println(${arr})`; // "Any[1, 2, "hello"]"

const arr2 = new Uint8Array([1, 2, 3]);
Julia.tagEval`println(${arr2})`; // "UInt8[0x01, 0x02, 0x03]"

const obj = { foo: 0, bar: false, bal: [1, 2, 3] }
Julia.tagEval`println(${obj})`; // "(foo = 0, bar = false, bal = Any[1, 2, 3])"

Julia.close();
```

### Pass a Bun array to Julia

```typescript
import { Julia, JuliaArray } from "jlbun";

// This initializes Julia and loads prelude symbols.
Julia.init();

// Create a `TypedArray` at the Bun side.
const bunArray = new Float64Array([1, 2, 3, 4, 5]);

// Create a `JuliaArray` from the `TypedArray`.
const juliaArray = JuliaArray.from(bunArray);

// These two arrays now share the same memory.
Julia.Base.println(juliaArray); // [1.0, 2.0, 3.0, 4.0, 5.0]

// We can modify the array at the Bun side (0-indexed).
bunArray[1] = 100.0;
Julia.Base.println(juliaArray); // [1.0, 100.0, 3.0, 4.0, 5.0]

// Or we can modify the array at the Julia side (also 0-indexed).
juliaArray.set(0, -10.0);
Julia.Base.println(juliaArray); // [-10.0, 100.0, 3.0, 4.0, 5.0]

// This cleans up Julia-related stuff.
Julia.close();
```

### Pass a Julia Array to Bun

```typescript
import { Julia } from "jlbun";

Julia.init();

const juliaArray = Julia.Base.rand(10, 10);
const bunArray = juliaArray.rawValue;
console.log(bunArray);

Julia.close();
```

### Do some linear algebra

```typescript
import { Julia } from "jlbun";

Julia.init();

const juliaArray = Julia.Base.rand(2, 2);
const inv = Julia.Base.inv(juliaArray);
console.log(inv.value);

const anotherJuliaArray = Julia.Base.rand(2, 2);
const product = Julia.Base["*"](juliaArray, anotherJuliaArray);
console.log(product.value);

// We can also import Julia modules.
const LA = Julia.import("LinearAlgebra");
console.log(LA.norm(product).value);

Julia.close();
```

### Install and use new packages

```typescript
import { Julia } from "jlbun";
import { join } from "path";

Julia.init();

// Install `CairoMakie`
Julia.Pkg.add("CairoMakie");

// Import `CairoMakie`
const Cairo = Julia.import("CairoMakie");

// Plot and save
const plt = Cairo.plot(Julia.Base.rand(10), Julia.Base.rand(10));
Cairo.save(join(process.cwd(), "plot.png"), plt);

Julia.close();
```

### Function calls with keyword arguments

```typescript
import { Julia, JuliaArray } from "jlbun";

Julia.init();

const rawArray = new Int32Array([1, 10, 20, 30, 100]);
const arr = JuliaArray.from(rawArray);
Julia.Base["sort!"].callWithKwargs({ by: Julia.Base.string, rev: true }, arr);
console.log(rawArray); // Int32Array(5) [ 30, 20, 100, 10, 1 ]

Julia.close();
```

### Call JS functions from Julia

```typescript
import { Julia, JuliaArray, JuliaFunction } from "jlbun";

Julia.init();

const jsFunc = (x: number) => -x;

const cb = JuliaFunction.from(jsFunc, {
  returns: "i32",
  args: ["i32"],
});

const arr = JuliaArray.from(new Int32Array([1, 10, 20, 30, 100]));
const neg = arr.map(cb);
Julia.println(neg); // Int32[-1, -10, -20, -30, -100]
cb.close();

Julia.close();
```

To deal with strings requires some tricks, see the example below:

```typescript
import { ptr } from "bun:ffi";
import { Julia, JuliaArray, JuliaFunction, safeCString } from "jlbun";

Julia.init();

const jsFunc = (x: number) => {
  return ptr(safeCString(x.toString()));
};

const cb = JuliaFunction.from(jsFunc, {
  returns: "cstring",
  args: ["i32"],
});

const arr = JuliaArray.from(new Int32Array([1, 10, 20, 30, 100]));
Julia.Base["sort!"].callWithKwargs({ by: cb, rev: true }, arr);
Julia.println(arr); // Int32[30, 20, 100, 10, 1]
cb.close();

Julia.close();
```

### Run Julia with multiple threads

To use multiple threads in Julia, you need to set the `JULIA_NUM_THREADS` environment variable.

With `export JULIA_NUM_THREADS=2` set, the following program should output `2` instead of `1`:

```typescript
import { Julia } from "jlbun";

Julia.init();

Julia.eval("println(Threads.nthreads())");

Julia.close();
```

A more advanced example:

```typescript
import { Julia, JuliaFunction, JuliaTask, JuliaValue } from "jlbun";

Julia.init();

const promises: Promise<JuliaValue>[] = [];

const func = Julia.eval(`function ()
  ans = 0;
  for i in 1:1000
    ans += i
  end
  ans
end
`) as JuliaFunction;

for (let i = 0; i < Julia.nthreads; i++) {
  promises.push(JuliaTask.from(func).schedule(i).value);
}

const results = (await Promise.all(promises)).map(promise => promise.value);
console.log(results); // [ 500500n, 500500n, 500500n, 500500n, 500500n, 500500n, 500500n, 500500n ]

Julia.close();
```

## TODO

- [x] Tuple
- [x] NamedTuple
  - [x] Keyword arguments of Julia functions
- [ ] Range
- [x] Dict
- [x] Set
- [x] Pair
