export async function* asyncChunk<T>(
  limit: number,
  iterable: AsyncIterable<T>,
): AsyncIterable<T[]> {
  let values: T[] = [];
  for await (const value of iterable) {
    values.push(value);
    if (values.length === limit) {
      yield values;
      values = [];
    }
  }
  if (values.length) {
    yield values;
  }
}
