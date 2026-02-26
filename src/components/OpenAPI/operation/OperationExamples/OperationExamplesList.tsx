import { type PropsWithChildren, type ReactNode, useContext, useEffect, useRef } from "react";
import { OperationExamplesContext } from "./OperationExamplesContext";

interface OperationExamplesListProps {
  examples?: ReactNode;
}

export function OperationExamplesList({ examples }: PropsWithChildren<OperationExamplesListProps>) {
  const ctx = useContext(OperationExamplesContext);
  const target = ctx?.target;
  const client = ctx?.client;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !target || !client) return;

    const currentActiveExample = containerRef.current.querySelector(
      `operation-example[active="true"]`,
    );
    const targetExample = containerRef.current.querySelector(
      `operation-example[target="${target}"][client="${client}"]`,
    );

    currentActiveExample?.setAttribute("active", "false");
    targetExample?.setAttribute("active", "true");
  }, [target, client]);

  return (
    <div ref={containerRef} className="contents">
      {examples}
    </div>
  );
}
