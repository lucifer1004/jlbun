import { afterAll, beforeAll, expect, test } from "bun:test";
import { Julia, JuliaPair } from "./index.js";

beforeAll(() => Julia.init());
afterAll(() => Julia.close());

test("JuliaPair", () => {
  const pair = JuliaPair.from(10n, 20n);
  expect(pair.first.value).toBe(10n);
  expect(pair.second.value).toBe(20n);
  expect(pair.toString()).toBe("10 => 20");
});
