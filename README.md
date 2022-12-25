# jlbun - Using Julia in Bun

> You need to have `CMake` and `Julia` installed to use this library.

First, compile the C wrapper via `CMake`. The output should be put in the `/build` folder.

Second, install `Bun`-side dependencies:

```bash
bun install
```

Then you can try the following example.

```bash
bun run test.ts
```
