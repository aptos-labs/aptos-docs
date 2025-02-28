import type { ClientId, Target, TargetId } from "@scalar/snippetz";
import { createEffect, createSignal } from "solid-js";
import { CustomSelect } from "./CustomSelect";
import { invariant } from "~/lib/invariant";

interface OperationExamplesControllerProps<T extends TargetId> {
  targets: Target[];
  initialTarget: T;
  initialClient: ClientId<T>;
  // These are marked as optional, because typechecker doesn't understand they are passed as Astro slots
  slotTargetSelect?: string;
  slotClientSelect?: string;
  slotExamples?: string;
}

export function OperationExamplesController({
  targets,
  initialTarget,
  initialClient,
  slotTargetSelect,
  slotClientSelect,
  slotExamples,
}: OperationExamplesControllerProps<TargetId>) {
  invariant(slotTargetSelect, "slotTargetSelect is not defined");
  invariant(slotClientSelect, "slotClientSelect is not defined");
  invariant(slotExamples, "slotExamples is not defined");

  let listRef: HTMLDivElement | undefined;
  const [selectedTargetName, setSelectedTargetName] = createSignal(initialTarget);
  const [selectedClientName, setSelectedClientName] = createSignal(initialClient);
  const [clientOptions, setClientOptions] = createSignal<
    { value: ClientId<TargetId>; label: string }[]
  >(getClientOptins(initialTarget));

  function getClientOptins(target: TargetId) {
    const updatedTarget = targets.find((item) => item.key === target);

    invariant(updatedTarget, `Target with key ${target} not found`);

    return updatedTarget.clients.map((client) => ({
      value: client.client,
      label: client.title,
    }));
  }

  function handleTargetChange(target: TargetId) {
    setSelectedTargetName(target);
    setClientOptions(getClientOptins(target));
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
        <CustomSelect value={selectedTargetName} onChange={handleTargetChange}>
          {slotTargetSelect}
        </CustomSelect>
        <CustomSelect
          value={selectedClientName}
          onChange={setSelectedClientName}
          options={clientOptions}
        >
          {slotClientSelect}
        </CustomSelect>
      </div>
      <div ref={listRef} innerHTML={slotExamples} />
    </div>
  );
}
