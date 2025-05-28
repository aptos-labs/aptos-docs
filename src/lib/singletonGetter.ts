export function singletonGetter<V>(initializer: () => V) {
  let instance: V | null = null;

  return function getInstance(): V {
    instance ??= initializer();

    return instance;
  };
}
