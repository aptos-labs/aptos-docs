import { type ClientId, type TargetId } from "@scalar/snippetz";
import { createContext, type Accessor } from "solid-js";

export const OperationExamplesContext = createContext<{
  target: Accessor<TargetId>;
  client: Accessor<ClientId<TargetId>>;
}>();
