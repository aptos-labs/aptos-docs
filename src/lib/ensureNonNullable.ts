import { assertNonNullable } from "./assertNonNullable";

export function ensureNonNullable<V>(
  value: V | null | undefined,
  message = `${JSON.stringify(value)} is not non-nullable`,
) {
  assertNonNullable(value, message);

  return value;
}
