import { jlbun, JuliaValue } from "./index.js";

/**
 * Stack-based GC Manager for automatic lifecycle management of Julia objects.
 *
 * This module provides efficient garbage collection integration between
 * JavaScript and Julia runtimes using a stack-based root pool.
 *
 * Design:
 *   - Uses a Julia Vector{Any} as backing storage
 *   - Stack-based: push values, release by mark (scope exit)
 *   - Thread-safe: protected by mutex in C layer
 *   - Efficient: O(1) push, O(1) mark, O(n) release (batch)
 *   - FinalizationRegistry fallback: escaped objects are auto-cleaned when JS GC runs
 *
 * Comparison with previous IdDict-based approach:
 *   - Old: Each protect/unprotect required FFI → Julia function call
 *   - New: Direct array operations via FFI, ~10-50x faster
 */
export class GCManager {
  private static readonly DEFAULT_CAPACITY = 1024;

  /**
   * FinalizationRegistry for escaped objects.
   * When a JS object is garbage collected, its Julia root slot is cleared.
   */
  private static escapeRegistry: FinalizationRegistry<number> | null = null;

  /**
   * Track if GCManager has been closed.
   * Used to prevent FinalizationRegistry callbacks from accessing closed Julia.
   */
  private static closed = true;

  /**
   * Initialize the GC manager.
   * Called by Julia.init() after Julia is fully initialized.
   * @internal
   */
  static init(capacity: number = this.DEFAULT_CAPACITY): void {
    jlbun.symbols.jlbun_gc_init(BigInt(capacity));
    this.closed = false;

    // Initialize FinalizationRegistry for escaped objects
    this.escapeRegistry = new FinalizationRegistry<number>((idx: number) => {
      // Check if GC is still open before accessing Julia
      if (this.closed) return;

      try {
        // Clear the slot when JS object is garbage collected
        jlbun.symbols.jlbun_gc_set(
          BigInt(idx),
          jlbun.symbols.jl_nothing_getter(),
        );
      } catch {
        // Julia might be closed, ignore errors
      }
    });
  }

  /**
   * Check if GCManager is initialized.
   */
  static get isInitialized(): boolean {
    return jlbun.symbols.jlbun_gc_is_initialized() !== 0;
  }

  /**
   * Get the current stack position as a mark.
   * Used to record the stack state before a scope begins.
   *
   * @returns The current stack top position
   */
  static mark(): number {
    return Number(jlbun.symbols.jlbun_gc_mark());
  }

  /**
   * Push a Julia value onto the GC root stack.
   * The value will be protected from garbage collection until released.
   *
   * This operation is thread-safe and O(1).
   *
   * @param value The Julia value to protect
   * @returns The index in the stack where the value was stored
   */
  static push(value: JuliaValue): number {
    return Number(jlbun.symbols.jlbun_gc_push(value.ptr));
  }

  /**
   * Release all values from the given mark to the current stack top.
   * This is called when a scope exits to release all values created within it.
   *
   * This operation is thread-safe.
   *
   * @param mark The stack position to release to (from a previous mark() call)
   */
  static release(mark: number): void {
    jlbun.symbols.jlbun_gc_release(BigInt(mark));
  }

  /**
   * Swap values at two indices in the stack.
   * Used for escape: move a value to a lower scope's range before release.
   *
   * @param fromIdx Source index
   * @param toIdx Target index
   */
  static swap(fromIdx: number, toIdx: number): void {
    jlbun.symbols.jlbun_gc_swap(BigInt(fromIdx), BigInt(toIdx));
  }

  /**
   * Get the value at a specific index (for debugging/escape).
   *
   * @param idx The index to read
   * @returns The pointer at that index
   */
  static get(idx: number): unknown {
    return jlbun.symbols.jlbun_gc_get(BigInt(idx));
  }

  /**
   * Set a value at a specific index.
   * Used for escape: place a value in a specific slot.
   *
   * @param idx The index to write
   * @param value The value to store
   */
  static set(idx: number, value: JuliaValue): void {
    jlbun.symbols.jlbun_gc_set(BigInt(idx), value.ptr);
  }

  /**
   * Get the number of protected objects.
   */
  static get size(): number {
    return Number(jlbun.symbols.jlbun_gc_size());
  }

  /**
   * Get the current capacity of the root stack.
   */
  static get capacity(): number {
    return Number(jlbun.symbols.jlbun_gc_capacity());
  }

  /**
   * Register an escaped value with FinalizationRegistry.
   * When the JS object is garbage collected, the Julia root slot will be cleared.
   *
   * @param value The Julia value to register
   * @param idx The index in the GC stack where the value is stored
   */
  static registerEscape(value: JuliaValue, idx: number): void {
    this.escapeRegistry?.register(value, idx, value);
  }

  /**
   * Unregister an escaped value from FinalizationRegistry.
   * Call this if you manually release the value.
   *
   * @param value The Julia value to unregister
   */
  static unregisterEscape(value: JuliaValue): void {
    this.escapeRegistry?.unregister(value);
  }

  /**
   * Clean up the GC manager. Called by Julia.close().
   * @internal
   */
  static close(): void {
    this.closed = true; // Prevent FinalizationRegistry callbacks from accessing Julia
    this.escapeRegistry = null;
    jlbun.symbols.jlbun_gc_close();
  }
}
