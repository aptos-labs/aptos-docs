import { snippetz, type ClientId, type TargetId } from "@scalar/snippetz";
import { createEffect, createSignal, batch, type JSX } from "solid-js";
import { INITIAL_CLIENT, INITIAL_TARGET } from "./constants";
import { CustomSelect } from "~/components/CustomSelect";
import { invariant } from "~/lib/invariant";

interface OperationExamplesControllerProps {
  children: JSX.Element[];
}

export function OperationExamplesController({ children }: OperationExamplesControllerProps) {
  const targets = snippetz().clients();
  let listRef: HTMLDivElement | undefined;
  const [selectedTargetName, setSelectedTargetName] = createSignal(INITIAL_TARGET);
  const [selectedClientName, setSelectedClientName] = createSignal(INITIAL_CLIENT);
  const [clientOptions, setClientOptions] = createSignal<
    { value: ClientId<TargetId>; label: string }[]
  >(getClientOptions(selectedTargetName()));

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
      setSelectedTargetName(target);

      const targetClientOptions = getClientOptions(target);
      setClientOptions(targetClientOptions);
      const client = targetClientOptions[0]?.value;
      invariant(client, "No client options found");
      setSelectedClientName(client);
    });
  }

  createEffect(() => {
    if (!listRef) return;

    const currentActiveExample = listRef.querySelector(`operation-example[active="true"]`);
    const targetExample = listRef.querySelector(
      `operation-example[target="${selectedTargetName()}"][client="${selectedClientName()}"]`,
    );

    currentActiveExample?.setAttribute("active", "false");
    targetExample?.setAttribute("active", "true");
  });

  return (
    <div class="operation-examples not-content">
      <div class="flex items-center gap-2">
        <CustomSelect
          label="Select target"
          options={() => targets.map((item) => ({ value: item.key, label: item.title }))}
          value={selectedTargetName}
          onChange={handleTargetChange}
        />
        <CustomSelect
          label="Select client"
          value={selectedClientName}
          onChange={setSelectedClientName}
          options={clientOptions}
        />
      </div>
      <div ref={listRef}>{children}</div>
    </div>
  );
}
