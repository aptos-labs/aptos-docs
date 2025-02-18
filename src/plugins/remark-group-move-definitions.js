const defaultDefinitionTypes = [
  { prefix: "Function", groupHeading: "Functions" },
  { prefix: "Resource", groupHeading: "Resources" },
  { prefix: "Struct", groupHeading: "Structs" },
];

/**
 * A remark plugin that groups Move definitions by type and removes repetitive prefixes.
 * For example, multiple "Function" prefixed headings will be grouped under a single "Functions" heading.
 */
export default function remarkGroupMoveDefinitions(options = {}) {
  const definitionTypes = options.definitionTypes || defaultDefinitionTypes;

  return (tree) => {
    const groups = new Map(); // type -> array of sections
    const introNodes = [];
    const nodesToRemove = new Set();

    let currentSection = null;
    let currentContent = [];
    let isIntro = true;

    // First pass: collect sections
    tree.children.forEach((node, index) => {
      if (node.type === "heading" && node.depth === 2) {
        const headingText = node.children?.[0]?.value || "";

        // Check if this is a definition heading
        for (const { prefix, groupHeading } of definitionTypes) {
          if (headingText.startsWith(prefix + " ")) {
            isIntro = false;

            // Save previous section if exists
            if (currentSection) {
              const group = currentSection.groupHeading;
              if (!groups.has(group)) {
                groups.set(group, []);
              }
              groups.get(group).push({
                heading: currentSection.heading,
                content: currentContent,
              });
            }

            // Create new heading by cloning the original and just modifying its text
            const newHeading = {
              ...node,
              depth: 3, // Change to h3
              children: node.children.map((child) => {
                if (child.type === "text") {
                  // Remove the prefix from the text
                  return {
                    ...child,
                    value: child.value.substring(prefix.length).trim(),
                  };
                }
                return child;
              }),
            };

            currentSection = {
              heading: newHeading,
              groupHeading: groupHeading,
            };
            currentContent = [];
            nodesToRemove.add(index);
            return;
          }
        }

        // Non-definition heading, end current section
        if (currentSection) {
          const group = currentSection.groupHeading;
          if (!groups.has(group)) {
            groups.set(group, []);
          }
          groups.get(group).push({
            heading: currentSection.heading,
            content: currentContent,
          });
          currentSection = null;
          currentContent = [];
        }
      } else if (currentSection) {
        currentContent.push(node);
        nodesToRemove.add(index);
      } else if (isIntro) {
        introNodes.push(node);
      }
    });

    // Save last section if exists
    if (currentSection) {
      const group = currentSection.groupHeading;
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group).push({
        heading: currentSection.heading,
        content: currentContent,
      });
    }

    // Build new tree
    const newChildren = [...introNodes];

    // Add each group
    for (const [groupHeading, sections] of groups) {
      // Add group heading
      newChildren.push({
        type: "heading",
        depth: 2,
        children: [{ type: "text", value: groupHeading }],
      });

      // Add sections
      for (const { heading, content } of sections) {
        newChildren.push(heading);
        newChildren.push(...content);
      }

      // Add spacing between groups
      newChildren.push({ type: "text", value: "\n\n" });
    }

    tree.children = newChildren;
  };
}
