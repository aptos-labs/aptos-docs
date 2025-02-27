<script lang="ts">
  import type { ClientId, Target, TargetId } from "@scalar/snippetz";
  import { onMount, type Snippet } from "svelte";

  interface Props<T extends TargetId> {
    targets: Target[]
    initialTarget: T,
    initialClient: ClientId<T>,
    targetSelect: Snippet
    clientSelect: Snippet
    examples: Snippet
  }

  let { targets, initialTarget, initialClient, targetSelect, clientSelect, examples }: Props<TargetId> = $props();
  let targetSelectElement: HTMLElement | null = null;
  let clientSelectElement: HTMLElement | null = null;
  let list: HTMLDivElement | null = null;
  let selectedTargetName = $state(initialTarget);
  let selectedClientName = $state(initialClient);

  onMount(() => {
    targetSelectElement = document.querySelector("#targetSelect");
    clientSelectElement = document.querySelector("#clientSelect");

    if (!targetSelectElement || !clientSelectElement) {
      throw new Error("Target or client select element not found");
    }

    function handleTargetChange(event: Event) {
      selectedTargetName = (event.target as HTMLSelectElement).value as TargetId;
    }
    function handleClientChange(event: Event) {
      selectedClientName = (event.target as HTMLSelectElement).value as ClientId<TargetId>;
    }

    targetSelectElement.addEventListener("change", handleTargetChange);
    clientSelectElement.addEventListener("change", handleClientChange);

    return () => {
      targetSelectElement?.removeEventListener("change", handleTargetChange);
      clientSelectElement?.removeEventListener("change", handleClientChange);
    }
  })


  $effect(() => {
    targetSelectElement?.setAttribute("value", selectedTargetName);
    const updatedTarget = targets.find((item) => item.key === selectedTargetName);

    if (updatedTarget) {
      clientSelectElement?.setAttribute("options", JSON.stringify(updatedTarget.clients.map(client => ({
        value: client.client,
        label: client.title,
      }))));
    }
  })
  $effect(() => {
    clientSelectElement?.setAttribute("value", selectedClientName);
  })

  $effect(() => {
    if (!list) return;

    const currentActiveExample = list.querySelector(`operation-example[active="true"]`);
    const targetExample = list.querySelector(
      `operation-example[target="${selectedTargetName}"][client="${selectedClientName}"]`,
    );

    currentActiveExample?.setAttribute("active", "false");
    targetExample?.setAttribute("active", "true");
  })
</script>

<div class="operation-examples not-content">
  <div class="flex items-center gap-2">
    {@render targetSelect()}
    {@render clientSelect()}
  </div>
  <div bind:this={list}>
    {@render examples()}
  </div>
</div>
