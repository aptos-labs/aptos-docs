import { createEffect, useContext, type JSX } from "solid-js";
import { OperationExamplesContext } from "./OperationExamplesContext";

interface OperationExamplesListProps {
  children: JSX.Element[];
}

export function OperationExamplesList({ children }: OperationExamplesListProps) {
  const ctx = useContext(OperationExamplesContext);

  let containerRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (!containerRef || !ctx) return;

    const currentActiveExample = containerRef.querySelector(`operation-example[active="true"]`);
    const targetExample = containerRef.querySelector(
      `operation-example[target="${ctx.target()}"][client="${ctx.client()}"]`,
    );

    currentActiveExample?.setAttribute("active", "false");
    targetExample?.setAttribute("active", "true");
  });

  return (
    <div ref={containerRef} class="contents">
      {children}
    </div>
  );
}
