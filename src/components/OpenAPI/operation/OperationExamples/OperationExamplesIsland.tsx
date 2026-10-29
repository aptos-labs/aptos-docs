import type { ClientId, Target, TargetId } from "@scalar/snippetz";
import { type PropsWithChildren, type ReactNode, useState } from "react";
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

const selectClassName =
  "h-8 min-w-0 rounded-md border border-(--sl-color-gray-5) bg-(--sl-color-bg) px-2 text-sm text-(--sl-color-text)";

const buttonClassName =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-(--sl-color-gray-5) bg-(--sl-color-gray-6) px-3 text-sm font-medium text-(--sl-color-text) hover:bg-(--sl-color-gray-5)";

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
        <label className="sr-only" htmlFor="operation-examples-target">
          Select target
        </label>
        <select
          id="operation-examples-target"
          className={selectClassName}
          value={currentTarget}
          onChange={(event) => handleTargetChange(event.target.value as TargetId)}
        >
          {targets.map((item) => (
            <option key={item.key} value={item.key}>
              {item.title}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="operation-examples-client">
          Select client
        </label>
        <select
          id="operation-examples-client"
          className={selectClassName}
          value={currentClient}
          onChange={(event) => setCurrentClient(event.target.value as ClientId<TargetId>)}
        >
          {clientOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" className={buttonClassName} onClick={openScalarModal}>
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            width={16}
            height={16}
          >
            <path d="M6 6.663c0-1.582 1.75-2.538 3.082-1.682l8.301 5.337a2 2 0 0 1 0 3.364L9.082 19.02C7.75 19.875 6 18.919 6 17.337z"></path>
          </svg>
          Test request
        </button>
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
