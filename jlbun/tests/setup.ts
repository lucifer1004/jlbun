import { Julia } from "../index.js";

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
