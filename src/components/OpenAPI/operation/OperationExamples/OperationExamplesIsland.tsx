import type { ClientId, Target, TargetId } from "@scalar/snippetz";
import { type PropsWithChildren, type ReactNode, useState } from "react";
import { Button } from "~/components/react/Button/Button";
import { Select } from "~/components/react/Select/Select";
import { invariant } from "~/lib/invariant";
import { OperationExamplesContext } from "./OperationExamplesContext";
import { OperationExamplesList } from "./OperationExamplesList";
import type { ExampleData } from "./types";

type OperationExamplesIslandProps = PropsWithChildren<{
  example: ExampleData;
  targets: Target[];
  initialTarget: TargetId;
  initialClient: ClientId<TargetId>;
  examples?: ReactNode;
}>;

export function OperationExamplesIsland({
  example,
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

  function openScalarModal() {
    document.dispatchEvent(
      new CustomEvent("scalarModal:open", {
        bubbles: true,
        detail: example,
      }),
    );
  }

  return (
    <div className="operation-examples not-content">
      <div className="flex items-center gap-2">
        <Select
          variant="bordered"
          size="sm"
          label="Select target"
          options={targets.map((item) => ({ value: item.key, label: item.title }))}
          value={currentTarget}
          onChange={handleTargetChange}
        />
        <Select
          variant="bordered"
          size="sm"
          label="Select client"
          value={currentClient}
          onChange={setCurrentClient}
          options={clientOptions}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={openScalarModal}
          className="self-stretch"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M6 6.663c0-1.582 1.75-2.538 3.082-1.682l8.301 5.337a2 2 0 0 1 0 3.364L9.082 19.02C7.75 19.875 6 18.919 6 17.337z"></path>
          </svg>
          Test request
        </Button>
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
