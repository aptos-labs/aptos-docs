import type { ClientId, TargetId } from "@scalar/snippetz";
import { createEffect } from "solid-js";

interface Props<T extends TargetId> {
  target: TargetId;
  client: ClientId<T>;
  children: string;
}

export function OperationExamplesList({ target, client, children }: Props<TargetId>) {
  let containerRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!containerRef) return;

    const currentActiveExample = containerRef.querySelector(`operation-example[active="true"]`);
    const targetExample = containerRef.querySelector(
      `operation-example[target="${target}"][client="${client}"]`,
    );

    currentActiveExample?.setAttribute("active", "false");
    targetExample?.setAttribute("active", "true");
  });

  return <div ref={containerRef} innerHTML={children} />;
}
