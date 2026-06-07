import type { JuliaValue } from "./index.js";
import type { JuliaScope } from "./scope.js";

export type JuliaOwnershipKind =
  | "scoped"
  | "escaped"
  | "runtime"
  | "borrowed"
  | "untracked";

export interface JuliaOwnership {
  kind: JuliaOwnershipKind;
  scope?: JuliaScope;
  idx?: number;
  owner?: unknown;
}

export const JULIA_OWNERSHIP = Symbol("jlbun.ownership");

type OwnedJuliaValue = JuliaValue & {
  [JULIA_OWNERSHIP]?: JuliaOwnership;
};

export function isJuliaValue(value: unknown): value is JuliaValue {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    "ptr" in value
  );
}

export function getJuliaOwnership(
  value: JuliaValue,
): JuliaOwnership | undefined {
  return (value as OwnedJuliaValue)[JULIA_OWNERSHIP];
}

export function setJuliaOwnership<T extends JuliaValue>(
  value: T,
  ownership: JuliaOwnership,
): T {
  Object.defineProperty(value, JULIA_OWNERSHIP, {
    configurable: true,
    enumerable: false,
    value: ownership,
    writable: true,
  });
  return value;
}

export function markJuliaRuntimeValue<T extends JuliaValue>(value: T): T {
  return setJuliaOwnership(value, { kind: "runtime" });
}

export function isPersistentJuliaValue(value: JuliaValue): boolean {
  const ownership = getJuliaOwnership(value);
  return ownership?.kind === "escaped" || ownership?.kind === "runtime";
}

export function setJuliaExternalOwner<T extends JuliaValue>(
  value: T,
  owner: unknown,
): T {
  const current = getJuliaOwnership(value);
  setJuliaOwnership(value, {
    ...(current ?? { kind: "borrowed" as const }),
    owner,
  });
  return value;
}
