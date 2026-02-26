/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('unified').Plugin<[{components?: Record<string, string>}], Root>} RemarkPlugin
 *
 * Remark plugin that automatically adds client:only directives to specified components in MDX files.
 * This eliminates the need to manually add client:only directives in every MDX file.
 *
 * Usage:
 * 1. In your astro.config.mjs, import and add this plugin to your MDX configuration:
 *    ```js
 *    import { remarkClientOnly } from './src/plugins/remark-client-only';
 *
 *    export default defineConfig({
 *      markdown: {
 *        remarkPlugins: [
 *          [remarkClientOnly, {
 *            components: {
 *              // Map component names to their framework
 *              GraphQLEditor: 'react',
 *              SomeOtherComponent: 'vue',
 *              // etc...
 *            }
 *          }]
 *        ]
 *      }
 *    });
 *    ```
 *
 * 2. Now in your MDX files, you can use components without client:only:
 *    ```mdx
 *    <GraphQLEditor /> <!-- client:only="react" is automatically added -->
 *    ```
 *
 * How it works:
 * - The plugin traverses the MDX AST (Abstract Syntax Tree)
 * - For each JSX element that matches a component name in the config
 * - It adds the client:only directive with the specified framework
 * - Only adds the directive if it's not already present
 *
 * @type {RemarkPlugin}
 */
export const remarkClientOnly = (options = { components: {} }) => {
  const { components } = options;

  return (tree) => {
    function visit(node) {
      if (
        (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
        node.name in components // Check if component is in the list
      ) {
        const framework = components[node.name]; // Get framework type
        node.attributes = node.attributes || [];

        // Only add the directive if it’s not already present
        if (!node.attributes.find((attr) => attr.name === "client:only")) {
          node.attributes.push({ type: "mdxJsxAttribute", name: "client:only", value: framework });
        }
      }

      if (node.children) {
        node.children.forEach(visit);
      }
    }

    visit(tree);
  };
};
