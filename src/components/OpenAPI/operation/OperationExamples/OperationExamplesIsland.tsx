import type { ClientId, Target, TargetId } from "@scalar/snippetz";
import { batch, createSignal, type JSX } from "solid-js";
import { OperationExamplesContext } from "./OperationExamplesContext";
import { OperationExamplesList } from "./OperationExamplesList";
import { CustomSelect } from "~/components/CustomSelect";
import { invariant } from "~/lib/invariant";

interface OperationExamplesIslandProps {
  targets: Target[];
  initialTarget: TargetId;
  initialClient: ClientId<TargetId>;
  children: JSX.Element[];
}

export function OperationExamplesIsland({
  targets,
  initialTarget,
  initialClient,
  children,
}: OperationExamplesIslandProps) {
  const [currentTarget, setCurrentTarget] = createSignal(initialTarget);
  const [currentClient, setCurrentClient] = createSignal(initialClient);
  const [clientOptions, setClientOptions] = createSignal<
    { value: ClientId<TargetId>; label: string }[]
  >(getClientOptions(currentTarget()));

  function getClientOptions(target: TargetId) {
    const updatedTarget = targets.find((item) => item.key === target);
    invariant(updatedTarget, `Target with key ${target} not found`);

    return updatedTarget.clients.map((client) => ({
      value: client.client,
      label: client.title,
    }));
  }

  function handleTargetChange(target: TargetId) {
    batch(() => {
      setCurrentTarget(target);

      const targetClientOptions = getClientOptions(target);
      setClientOptions(targetClientOptions);
      const client = targetClientOptions[0]?.value;
      invariant(client, "No client options found");
      setCurrentClient(client);
    });
  }

  return (
    <div class="operation-examples not-content">
      <div class="flex items-center gap-2">
        <CustomSelect
          label="Select target"
          options={() => targets.map((item) => ({ value: item.key, label: item.title }))}
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
      <OperationExamplesContext.Provider value={{ target: currentTarget, client: currentClient }}>
        <OperationExamplesList>{children}</OperationExamplesList>
      </OperationExamplesContext.Provider>
    </div>
  );
}
