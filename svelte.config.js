import { vitePreprocess } from "@astrojs/svelte";

const svelteConfig = {
  preprocess: vitePreprocess(),
};

export default svelteConfig;
