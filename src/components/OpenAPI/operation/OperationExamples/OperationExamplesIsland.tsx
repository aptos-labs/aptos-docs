import type { ClientId, Target, TargetId } from "@scalar/snippetz";
import { type PropsWithChildren, type ReactNode, useState } from "react";
import { OperationExamplesContext } from "./OperationExamplesContext";
import { OperationExamplesList } from "./OperationExamplesList";
import { CustomSelect } from "~/components/CustomSelect";
import { invariant } from "~/lib/invariant";

type OperationExamplesIslandProps = PropsWithChildren<{
  targets: Target[];
  initialTarget: TargetId;
  initialClient: ClientId<TargetId>;
  examples?: ReactNode;
}>;

export function OperationExamplesIsland({
  targets,
  initialTarget,
  initialClient,
  examples,
}: OperationExamplesIslandProps) {
  const [currentTarget, setCurrentTarget] = useState(initialTarget);
  const [currentClient, setCurrentClient] = useState(initialClient);
  const [clientOptions, setClientOptions] = useState<
    { value: ClientId<TargetId>; label: string }[]
  >(getClientOptions(currentTarget));

  function getClientOptions(target: TargetId) {
    const updatedTarget = targets.find((item) => item.key === target);
    invariant(updatedTarget, `Target with key ${target} not found`);

    return updatedTarget.clients.map((client) => ({
      value: client.client,
      label: client.title,
    }));
  }

  function handleTargetChange(target: TargetId) {
    setCurrentTarget(target);

    const targetClientOptions = getClientOptions(target);
    setClientOptions(targetClientOptions);
    const client = targetClientOptions[0]?.value;
    invariant(client, "No client options found");
    setCurrentClient(client);
  }

  return (
    <div className="operation-examples not-content">
      <div className="flex items-center gap-2">
        <CustomSelect
          label="Select target"
          options={targets.map((item) => ({ value: item.key, label: item.title }))}
          value={currentTarget}
          onChange={handleTargetChange}
        />
        <CustomSelect
          label="Select client"
          value={currentClient}
          onChange={setCurrentClient}
          options={clientOptions}
        />
      </div>
      <OperationExamplesContext.Provider
        value={{
          target: currentTarget,
          setTarget: setCurrentTarget,
          client: currentClient,
          setClient: setCurrentClient,
        }}
      >
        <OperationExamplesList examples={examples} />
      </OperationExamplesContext.Provider>
    </div>
  );
}
