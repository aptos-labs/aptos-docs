<script lang="ts">
  import type { ClientId, TargetId } from "@scalar/snippetz";
  import type { Snippet } from "svelte";

  interface Props<T extends TargetId> {
    target: TargetId
    client: ClientId<T>
    children: Snippet
  }


  let { target, client, children }: Props<TargetId> = $props();
  let list: HTMLDivElement | null = null;

  $effect(() => {
    if (!list) return;

    const currentActiveExample = list.querySelector(`operation-example[active="true"]`);
    const targetExample = list.querySelector(
      `operation-example[target="${target}"][client="${client}"]`,
    );

    currentActiveExample?.setAttribute("active", "false");
    targetExample?.setAttribute("active", "true");
  })
</script>

<div bind:this={list}>{@render children()}</div>

