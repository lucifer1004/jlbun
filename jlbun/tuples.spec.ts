import { afterEach, beforeEach, expect, test } from "bun:test";
import { Julia, JuliaPair, JuliaTuple } from "./index.js";

beforeEach(() => Julia.init());
afterEach(() => Julia.close());

test("JuliaPair", () => {
  const pair = JuliaPair.from(10n, 20n);
  expect(pair.first.value).toBe(10n);
  expect(pair.second.value).toBe(20n);
  expect(pair.toString()).toBe("10 => 20");
});
