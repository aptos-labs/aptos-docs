import type { ClientId, Target, TargetId } from "@scalar/snippetz";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CustomSelect } from "./CustomSelect";
import { invariant } from "~/lib/invariant";

interface OperationExamplesControllerProps<T extends TargetId> {
  targets: Target[];
  initialTarget: T;
  initialClient: ClientId<T>;
  // These are marked as optional, because typechecker doesn't understand they are passed as Astro slots
  slotTargetSelect?: ReactNode;
  slotClientSelect?: ReactNode;
  slotExamples?: ReactNode;
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

  const listRef = useRef<HTMLDivElement>(null);
  const [selectedTargetName, setSelectedTargetName] = useState(initialTarget);
  const [selectedClientName, setSelectedClientName] = useState(initialClient);
  const [clientOptions, setClientOptions] = useState<
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

  useEffect(() => {
    if (!listRef.current) return;

    const currentActiveExample = listRef.current.querySelector(`operation-example[active="true"]`);
    const targetExample = listRef.current.querySelector(
      `operation-example[target="${selectedTargetName}"][client="${selectedClientName}"]`,
    );

    currentActiveExample?.setAttribute("active", "false");
    targetExample?.setAttribute("active", "true");
  }, [selectedTargetName, selectedClientName]);

  return (
    <div className="operation-examples not-content">
      <div className="flex items-center gap-2">
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
      <div ref={listRef}>{slotExamples}</div>
    </div>
  );
}
