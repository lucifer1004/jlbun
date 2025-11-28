import { Julia } from "jlbun";

Julia.init();

Julia.scope((julia) => {
  const N = 1000000;
  // 使用 julia.Array.init() 创建自动 track 的数组
  const a = julia.Array.init(julia.Float64, N);
  for (let i = 0; i < N; i++) {
    a.set(i, i);
  }

  for (let i = 0; i < N; i++) {
    console.log(julia.Base.sqrt(a.get(i)).value);
  }
});

Julia.close();
