// It is handy to use such helper for exhaustive check

export function assertUnreachable(_x: never): never {
  throw new Error("Must be unreachable.");
}
