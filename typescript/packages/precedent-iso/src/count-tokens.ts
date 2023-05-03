export function countTokens(s: string[]): number {
  return s.reduce((acc, cur) => acc + cur.length, 0);
}
