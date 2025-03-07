import { snippetz, type ClientId, type TargetId } from "@scalar/snippetz";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { INITIAL_CLIENT, INITIAL_TARGET } from "./constants";
import { CustomSelect } from "~/components/CustomSelect";
import { invariant } from "~/lib/invariant";

interface OperationExamplesControllerProps {
  examples: ReactNode;
}

export function OperationExamplesController({ examples }: OperationExamplesControllerProps) {
  const targets = snippetz().clients();
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedTargetName, setSelectedTargetName] = useState(INITIAL_TARGET);
  const [selectedClientName, setSelectedClientName] = useState(INITIAL_CLIENT);
  const [clientOptions, setClientOptions] = useState<
    { value: ClientId<TargetId>; label: string }[]
  >(getClientOptions(selectedTargetName));

  function getClientOptions(target: TargetId) {
    const updatedTarget = targets.find((item) => item.key === target);
    invariant(updatedTarget, `Target with key ${target} not found`);
    return updatedTarget.clients.map((client) => ({
      value: client.client,
      label: client.title,
    }));
  }

  function handleTargetChange(target: TargetId) {
    setSelectedTargetName(target);

    const targetClientOptions = getClientOptions(target);
    setClientOptions(targetClientOptions);
    const client = targetClientOptions[0]?.value;
    invariant(client, "No client options found");
    setSelectedClientName(client);
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
        <CustomSelect
          label="Select target"
          options={targets.map((item) => ({ value: item.key, label: item.title }))}
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
      <div ref={listRef}>{examples}</div>
    </div>
  );
}
