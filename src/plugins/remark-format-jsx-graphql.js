import { format } from "prettier";
import { visit } from "unist-util-visit";

/**
 * @typedef {import('unified').Plugin} Plugin
 *
 * Remark plugin that formats GraphQL and JSON in MDX JSX attributes
 * @type {Plugin}
 */
const remarkFormatJSXGraphQL = () => {
  return async (tree) => {
    const promises = [];

    visit(tree, "mdxJsxFlowElement", (node) => {
      if (!node.attributes) return;

      for (const attr of node.attributes) {
        if (
          attr.type === "mdxJsxAttribute" &&
          (attr.name === "query" || attr.name === "variables") &&
          typeof attr.value === "object" &&
          attr.value.type === "mdxJsxAttributeValueExpression"
        ) {
          try {
            // Check if the value is enclosed in backticks
            const value = attr.value.value;
            const hasBackticks = value.startsWith("`") && value.endsWith("`");

            // Remove backticks for formatting
            const contentToFormat = hasBackticks ? value.slice(1, -1) : value;

            // Create a promise for formatting
            const formatPromise = (async () => {
              try {
                const formatted = await format(contentToFormat, {
                  parser: attr.name === "query" ? "graphql" : "json",
                });

                // Add backticks back if they were present originally
                attr.value.value = hasBackticks ? `\`${formatted.trim()}\`` : formatted.trim();
              } catch (formattingError) {
                console.warn(`Error formatting ${attr.name}:`, formattingError);
                // Keep the original value if formatting failed
              }
            })();

            promises.push(formatPromise);
          } catch (err) {
            console.warn(`Failed to process ${attr.name}:`, err);
          }
        }
      }
    });

    // Wait for all formatting promises to complete
    await Promise.all(promises);
  };
};

export default remarkFormatJSXGraphQL;
export { remarkFormatJSXGraphQL };
