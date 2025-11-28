import { Julia, JuliaFunction, JuliaValue } from "./index.js";

/**
 * GC Manager for automatic lifecycle management of Julia objects.
 *
 * This module provides automatic garbage collection integration between
 * JavaScript and Julia runtimes using FinalizationRegistry.
 *
 * Thread Safety: Uses a ReentrantLock to ensure thread-safe access to the
 * GC roots dictionary when Julia multi-threading is enabled.
 */
export class GCManager {
  private static registry: FinalizationRegistry<string> | null = null;
  private static roots: JuliaValue | null = null;
  private static setFn: JuliaFunction | null = null;
  private static deleteFn: JuliaFunction | null = null;
  private static counter = 0;
  private static initialized = false;

  /**
   * Initialize the GC manager.
   * Called by Julia.init() after Julia is fully initialized.
   * @internal
   */
  static init(): void {
    if (this.initialized) return;
    if (!Julia) {
      throw new Error("Julia reference not set. This is an internal error.");
    }

    // Create thread-safe GC roots storage with a lock
    Julia.eval(`
      module __JlbunGC__
        const roots = IdDict{String, Any}()
        const lock = ReentrantLock()
        
        function gcset(key::String, value)
          Base.lock(lock) do
            roots[key] = value
          end
        end
        
        function gcdelete(key::String)
          Base.lock(lock) do
            delete!(roots, key)
          end
        end
        
        function gclength()
          Base.lock(lock) do
            length(roots)
          end
        end
      end
    `);

    // Use eval to get the functions since module property access may not work
    // for dynamically created modules
    this.roots = Julia.eval("__JlbunGC__.roots");
    this.setFn = Julia.eval("__JlbunGC__.gcset") as JuliaFunction;
    this.deleteFn = Julia.eval("__JlbunGC__.gcdelete") as JuliaFunction;

    // Create FinalizationRegistry to clean up when JS objects are GC'd
    this.registry = new FinalizationRegistry((id: string) => {
      try {
        if (this.deleteFn) {
          Julia.call(this.deleteFn, id);
        }
      } catch {
        // Julia might already be closed, ignore errors
      }
    });

    this.initialized = true;
  }

  /**
   * Check if GCManager is initialized.
   */
  static get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Protect a Julia object from being garbage collected.
   * Returns a unique ID that can be used to unprotect later.
   *
   * This operation is thread-safe and can be called while Julia tasks
   * are running on other threads.
   *
   * @param value The Julia value to protect
   * @returns The protection ID
   */
  static protect(value: JuliaValue): string {
    if (!this.initialized || !this.setFn) {
      throw new Error("GCManager not initialized. Call Julia.init() first.");
    }

    const id = `__jlbun_gc_${this.counter++}`;
    Julia.call(this.setFn, id, value);
    this.registry?.register(value, id, value);
    return id;
  }

  /**
   * Manually unprotect a Julia object, allowing it to be garbage collected.
   *
   * This operation is thread-safe and can be called while Julia tasks
   * are running on other threads.
   *
   * @param id The protection ID returned by protect()
   * @param value The Julia value (needed to unregister from FinalizationRegistry)
   */
  static unprotect(id: string, value?: JuliaValue): void {
    if (!this.initialized || !this.deleteFn) return;

    try {
      Julia.call(this.deleteFn, id);
      if (value) {
        this.registry?.unregister(value);
      }
    } catch {
      // Ignore errors during cleanup
    }
  }

  /**
   * Get the number of protected objects.
   */
  static get protectedCount(): number {
    if (!this.initialized) return 0;
    try {
      return Number(Julia.eval("__JlbunGC__.gclength()").value);
    } catch {
      return 0;
    }
  }

  /**
   * Clean up the GC manager. Called by Julia.close().
   */
  static close(): void {
    this.initialized = false;
    this.roots = null;
    this.setFn = null;
    this.deleteFn = null;
    this.registry = null;
    this.counter = 0;
  }
}
