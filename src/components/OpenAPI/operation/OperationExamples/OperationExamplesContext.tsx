import type { ClientId, TargetId } from "@scalar/snippetz";
import { createContext } from "react";

export const OperationExamplesContext = createContext<{
  target: TargetId;
  client: ClientId<TargetId>;
  setTarget: (target: TargetId) => void;
  setClient: (client: ClientId<TargetId>) => void;
} | null>(null);
