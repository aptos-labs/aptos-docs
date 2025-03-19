/* eslint-disable @typescript-eslint/no-invalid-void-type */
import type { AnyStore, Store, StoreValue } from "nanostores";

export type StoreValues<Stores extends AnyStore[]> = {
  [Index in keyof Stores]: StoreValue<Stores[Index]>;
};

export function effect<S extends Store>(
  store: S,
  callback: (value: StoreValue<S>) => VoidFunction | void,
): VoidFunction;
export function effect<Stores extends Store[]>(
  stores: [...Stores],
  callback: (...values: StoreValues<Stores>) => VoidFunction | void,
): VoidFunction;
export function effect<Stores extends Store[]>(
  stores: [...Stores],
  callback: (...values: StoreValues<Stores>) => VoidFunction | void,
): VoidFunction {
  const storesArr = (Array.isArray(stores) ? stores : [stores]) as [...Stores];
  let storesUnsubscribe: VoidFunction[] = [];
  let callbackUnsubscribe: VoidFunction | void = undefined;

  function runCallback() {
    callbackUnsubscribe?.();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const values = storesArr.map((store) => store.get()) as StoreValues<Stores>;
    callbackUnsubscribe = callback(...values);
  }

  function unsubscribe() {
    for (const unsubscribe of storesUnsubscribe) {
      unsubscribe();
    }
    callbackUnsubscribe?.();
  }

  storesUnsubscribe = storesArr.map((store) => store.listen(runCallback));
  runCallback();

  return unsubscribe;
}
