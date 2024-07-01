type Class<T> = { new (): T };

export function instanceofFilter<T>(cls: Class<T>): (v: any) => v is T {
  return (v): v is T => v instanceof cls;
}
