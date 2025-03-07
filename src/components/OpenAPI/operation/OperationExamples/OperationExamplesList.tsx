import { useEffect, useContext, useRef, type PropsWithChildren, type ReactNode } from "react";
import { OperationExamplesContext } from "./OperationExamplesContext";

interface OperationExamplesListProps {
  examples?: ReactNode;
}

export function OperationExamplesList({ examples }: PropsWithChildren<OperationExamplesListProps>) {
  const ctx = useContext(OperationExamplesContext);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !ctx) return;

    const currentActiveExample = containerRef.current.querySelector(
      `operation-example[active="true"]`,
    );
    const targetExample = containerRef.current.querySelector(
      `operation-example[target="${ctx.target}"][client="${ctx.client}"]`,
    );

    currentActiveExample?.setAttribute("active", "false");
    targetExample?.setAttribute("active", "true");
  }, [ctx?.target, ctx?.client]); // Add dependencies for the effect

  return (
    <div ref={containerRef} className="contents">
      {examples}
    </div>
  );
}
