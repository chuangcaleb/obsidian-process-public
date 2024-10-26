export function asArray<T>(value: T | T[] | undefined) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}
