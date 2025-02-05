<script lang="ts">
  import { snippetz, type TargetId, type ClientId } from '@scalar/snippetz'
  import { highlightText } from '@speed-highlight/core'
  import { detectLanguage } from "@speed-highlight/core/detect"
  import type { PathItemOperation } from "starlight-openapi/libs/operation";

  interface Props {
    baseUrl: string;
    prefix: string
    operationPath: PathItemOperation
  }

  let { baseUrl, prefix, operationPath }: Props = $props();
  const targets = snippetz().clients();
  let selectedTarget = $state<TargetId>('shell');
  let selectedClient = $state<ClientId<TargetId>>('curl');
  let target = $derived(targets.find((item) => item.key === selectedTarget)!);
  let example = $state({ code: "Generating example code...", language: "markdown" });

  async function getExampleData<T extends TargetId>(target: T, client: ClientId<T>) {
    const snippet =  snippetz().print(target, client, { url: `${baseUrl}${prefix}${operationPath}` });

    if (!snippet) {
      return { code: 'Could not generate example code', language: 'markdown' };
    }

    const language = detectLanguage(snippet);

    return {
      code: await highlightText(snippet, language, true),
      language,
    };
  }

  $effect(() => {
    const updatedTarget = targets.find((item) => item.key === selectedTarget);

    if (updatedTarget) {
      selectedClient = updatedTarget.default;
    }
  })

  $effect(() => {
    getExampleData(selectedTarget, selectedClient).then((data) => {
      example = data;
    });
  })
</script>
<select bind:value={selectedTarget}>
  {#each targets as target}
    <option value={target.key} selected={target.key === selectedTarget}>{target.title}</option>
  {/each}
</select>
<select bind:value={selectedClient}>
  {#each target.clients as client}
    <option value={client.client} selected={client.client === selectedClient}>{client.title}</option>
  {/each}
</select>
<div class={['not-content', `shj-lang-${example.language}`]}>{@html example.code}</div>
