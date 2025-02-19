const defaultDefinitionTypes = [
  { prefix: "Function", groupHeading: "Functions" },
  { prefix: "Resource", groupHeading: "Resources" },
  { prefix: "Struct", groupHeading: "Structs" },
];

/**
 * Helper function to remove a prefix from a heading node's text content
 */
function removePrefix(node, prefix, depth) {
  return {
    ...node,
    depth,
    children: node.children.map((child) => {
      if (child.type === "text") {
        return {
          ...child,
          value: child.value.substring(prefix.length).trim(),
        };
      }
      return child;
    }),
  };
}

/**
 * Helper function to save a section to the appropriate group
 */
function saveSection(groups, currentSection, currentContent) {
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
}

/**
 * Helper function to check if a heading starts with any of the definition prefixes
 * Returns the matching definition type or null
 */
function getDefinitionType(headingText, definitionTypes) {
  for (const defType of definitionTypes) {
    if (headingText.startsWith(defType.prefix + " ")) {
      return defType;
    }
  }
  return null;
}

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
    let inSpecificationSection = false;
    let specificationNodes = [];

    // First pass: collect sections
    tree.children.forEach((node, index) => {
      if (node.type === "heading" && node.depth === 2) {
        const headingText = node.children?.[0]?.value || "";

        // Check if this is the Specification section
        if (headingText === "Specification") {
          saveSection(groups, currentSection, currentContent);
          inSpecificationSection = true;
          currentSection = null;
          currentContent = [];
          specificationNodes.push(node);
          return;
        }

        // Check if this is a definition heading
        const defType = getDefinitionType(headingText, definitionTypes);
        if (defType) {
          isIntro = false;
          saveSection(groups, currentSection, currentContent);

          // Create new heading with prefix removed
          const newHeading = removePrefix(
            node,
            defType.prefix,
            inSpecificationSection ? 2 : 3, // Keep h2 for Specification section
          );

          if (inSpecificationSection) {
            specificationNodes.push(newHeading);
            currentSection = null;
            currentContent = [];
          } else {
            currentSection = {
              heading: newHeading,
              groupHeading: defType.groupHeading,
            };
            currentContent = [];
            nodesToRemove.add(index);
          }
          return;
        }

        // Non-definition heading, end current section
        saveSection(groups, currentSection, currentContent);
        currentSection = null;
        currentContent = [];

        // If we hit a new h2, we're exiting the Specification section
        inSpecificationSection = false;
      } else if (inSpecificationSection) {
        // If this is a heading in the Specification section, check for prefixes
        if (node.type === "heading") {
          const headingText = node.children?.[0]?.value || "";
          const defType = getDefinitionType(headingText, definitionTypes);
          if (defType) {
            // Remove prefix but keep the original depth
            specificationNodes.push(removePrefix(node, defType.prefix, node.depth));
            return;
          }
        }
        specificationNodes.push(node);
      } else if (currentSection) {
        currentContent.push(node);
        nodesToRemove.add(index);
      } else if (isIntro) {
        introNodes.push(node);
      }
    });

    // Save last section if exists
    saveSection(groups, currentSection, currentContent);

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

    // Add Specification section at the end if it exists
    if (specificationNodes.length > 0) {
      newChildren.push(...specificationNodes);
      newChildren.push({ type: "text", value: "\n\n" });
    }

    tree.children = newChildren;
  };
}
