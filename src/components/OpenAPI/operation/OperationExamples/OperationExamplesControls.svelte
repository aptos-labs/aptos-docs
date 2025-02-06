<script lang="ts">
  import type { ClientId, Target, TargetId } from '@scalar/snippetz';
  import type { Snippet } from 'svelte';
  import { ensureNonNullable } from '~/lib/ensureNonNullable';
  import { emitter} from './events'

  interface Props<T extends TargetId> {
    targets: Target[]
    initialTarget: T,
    initialClient: ClientId<T>,
    children: Snippet
  }

  let { targets, initialTarget, initialClient, children }: Props<TargetId> = $props();
  let selectedTargetName = $state(initialTarget);
  let selectedClientName = $state(initialClient);
  let target = $derived(ensureNonNullable(targets.find((item) => item.key === selectedTargetName), "Target not found"));

  $effect(() => {
    const updatedTarget = targets.find((item) => item.key === selectedTargetName);

    if (updatedTarget) {
      selectedClientName = updatedTarget.default;
    }
  })

  $effect(() => {
    emitter.emit("activateExample", selectedTargetName, selectedClientName);
  })
</script>
<div class:list={["flex items-center gap-2"]}>
  <select class={["border rounded"]} bind:value={selectedTargetName}>
    {#each targets as target}
      <option value={target.key} selected={target.key === selectedTargetName}>{target.title}</option>
    {/each}
  </select>
  <select class={["border rounded"]} bind:value={selectedClientName}>
    {#each target.clients as client}
      <option value={client.client} selected={client.client === selectedClientName}>{client.title}</option>
    {/each}
  </select>
</div>
<div>{@render children()}</div>

