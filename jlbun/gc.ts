import { jlbun, JuliaValue } from "./index.js";

/**
 * Scope-based GC Manager for automatic lifecycle management of Julia objects.
 *
 * This module provides efficient garbage collection integration between
 * JavaScript and Julia runtimes using scope-based isolation.
 *
 * Design:
 *   - Uses a Julia Vector{Any} as backing storage
 *   - Scope-based: each value belongs to a scope_id, scopes can be released independently
 *   - Thread-safe: protected by mutex in C layer
 *   - Concurrent-safe: scopes can be released in any order (safe for async)
 *   - Efficient: O(1) push, O(n) release (only touches scope's values)
 *   - FinalizationRegistry fallback: escaped objects are auto-cleaned when JS GC runs
 *
 * API:
 *   - scopeBegin(): Create a new scope, returns unique scope_id
 *   - pushScoped(value, scopeId): Push value to specific scope
 *   - scopeEnd(scopeId): Release all values in scope
 *   - transfer(idx, newScopeId): Move value to another scope (for escape)
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

  // ============================================================================
  // Scope-based API (recommended for async/concurrent scopes)
  // ============================================================================

  /**
   * Begin a new scope and get a unique scope ID.
   * Values pushed with this scope_id will be released together when scopeEnd is called.
   *
   * This is the recommended API for async scopes that may run concurrently.
   *
   * @returns A unique scope ID (never 0, which is reserved for global scope)
   */
  static scopeBegin(): bigint {
    return jlbun.symbols.jlbun_gc_scope_begin();
  }

  /**
   * Push a Julia value with explicit scope ownership.
   * The value will be protected until scopeEnd(scopeId) is called.
   *
   * @param value The Julia value to protect
   * @param scopeId The scope this value belongs to
   * @returns The index in the stack where the value was stored
   */
  static pushScoped(value: JuliaValue, scopeId: bigint): number {
    return Number(jlbun.symbols.jlbun_gc_push_scoped(value.ptr, scopeId));
  }

  /**
   * End a scope and release all values belonging to it.
   * This is safe to call even if other scopes are still active.
   *
   * @param scopeId The scope to release
   */
  static scopeEnd(scopeId: bigint): void {
    jlbun.symbols.jlbun_gc_scope_end(scopeId);
  }

  /**
   * Transfer a value to a different scope (for escape).
   * The value will now be released when the new scope ends.
   *
   * @param idx The index of the value to transfer
   * @param newScopeId The new scope to transfer to (use 0n for global/permanent)
   * @returns The same index, or -1 on error
   */
  static transfer(idx: number, newScopeId: bigint): number {
    const result = Number(
      jlbun.symbols.jlbun_gc_transfer(BigInt(idx), newScopeId),
    );
    // SIZE_MAX (2^64-1) indicates error, convert to -1
    return result === Number.MAX_SAFE_INTEGER || result < 0 ? -1 : result;
  }

  /**
   * Get the scope ID of a value at the given index.
   *
   * @param idx The index to query
   * @returns The scope ID (0 for global scope or unassigned)
   */
  static getScope(idx: number): bigint {
    return jlbun.symbols.jlbun_gc_get_scope(BigInt(idx));
  }

  // ============================================================================
  // Utility methods
  // ============================================================================

  /**
   * Get the value at a specific index (for debugging).
   *
   * @param idx The index to read
   * @returns The pointer at that index
   */
  static get(idx: number): unknown {
    return jlbun.symbols.jlbun_gc_get(BigInt(idx));
  }

  /**
   * Set a value at a specific index.
   * Used internally for clearing slots.
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
