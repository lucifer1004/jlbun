import { afterEach, beforeEach } from "bun:test";
import { enterJuliaScope, Julia, JuliaScope } from "../index.js";

// Track if Julia has been initialized
let juliaInitialized = false;

/**
 * Ensure Julia is initialized (only once per process)
 */
export function ensureJuliaInitialized(): void {
  if (!juliaInitialized) {
    Julia.init({ project: null, verbosity: "verbose" });
    juliaInitialized = true;

    // Register process exit handler to close Julia
    process.on("beforeExit", () => {
      if (juliaInitialized) {
        Julia.close();
        juliaInitialized = false;
      }
    });
  }
}

/**
 * Check if Julia version supports resizing shared buffers (>=1.11)
 */
export function canResizeSharedBuffers(): boolean {
  const [major = "0", minor = "0"] = Julia.version
    .split(".")
    .map((part) => part.replace(/[^0-9].*/, ""));
  const majorNum = Number(major);
  const minorNum = Number(minor);
  return majorNum > 1 || (majorNum === 1 && minorNum >= 11);
}

/**
 * Run each test in an active scope for legacy API coverage.
 *
 * v0.3 requires object-producing APIs to have an active scope. Most historical
 * tests exercise wrapper behavior rather than the no-scope error path, so they
 * opt into this harness. Dedicated scope-first tests intentionally do not.
 */
export function useJuliaTestScope(): void {
  let scope: JuliaScope | undefined;

  beforeEach(() => {
    scope = new JuliaScope({ mode: "safe" });
    enterJuliaScope(scope);
  });

  afterEach(() => {
    scope?.dispose();
    scope = undefined;
  });
}
