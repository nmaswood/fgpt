export function isNotNull<T>(t: T): t is Exclude<T, null | undefined> {
  return t !== null && t !== undefined;
}
