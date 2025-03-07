import type { ClientId, TargetId } from "@scalar/snippetz";
import { useEffect, useRef } from "react";

interface Props<T extends TargetId> {
  target: TargetId;
  client: ClientId<T>;
  children: string;
}

export function OperationExamplesList({ target, client, children }: Props<TargetId>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const currentActiveExample = containerRef.current.querySelector(
      `operation-example[active="true"]`,
    );
    const targetExample = containerRef.current.querySelector(
      `operation-example[target="${target}"][client="${client}"]`,
    );

    currentActiveExample?.setAttribute("active", "false");
    targetExample?.setAttribute("active", "true");
  }, [target, client]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: children }} />;
}
