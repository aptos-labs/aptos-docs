import type { ClientId, TargetId } from "@scalar/snippetz";
import { createNanoEvents } from "nanoevents";

interface ExamplesEvents {
  activateExample: <T extends TargetId>(target: T, client: ClientId<T>) => void;
}

export const emitter = createNanoEvents<ExamplesEvents>();
