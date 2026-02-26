const defaultDefinitionTypes = [
  { prefix: "Function", groupHeading: "Functions" },
  { prefix: "Resource", groupHeading: "Resources" },
  { prefix: "Struct", groupHeading: "Structs" },
];

/**
 * Helper function to remove a prefix from a heading node's text content
 */
function removePrefix(node, prefix, depth) {
  const firstChild = node.children?.[0];
  if (firstChild?.type === "text") {
    return {
      ...node,
      depth,
      children: [
        {
          ...firstChild,
          value: firstChild.value.substring(prefix.length).trim(),
        },
        ...node.children.slice(1),
      ],
    };
  }
  return { ...node, depth };
}

/**
 * Helper function to check if a heading starts with any of the definition prefixes
 */
function getDefinitionType(headingText, definitionTypes) {
  for (const defType of definitionTypes) {
    if (headingText?.startsWith(`${defType.prefix} `)) {
      return defType;
    }
  }
  return null;
}

/**
 * Processes nodes within the Specification section, removing prefixes from definition headings.
 */
function processSpecificationNodes(nodes, definitionTypes) {
  return nodes.map((node) => {
    if (node.type === "heading") {
      const headingText = node.children?.[0]?.value || "";
      const defType = getDefinitionType(headingText, definitionTypes);
      if (defType) {
        // Remove prefix but keep original depth within spec
        return removePrefix(node, defType.prefix, node.depth);
      }
    }
    return node; // Keep other nodes as is
  });
}

/**
 * A remark plugin that groups Move definitions by type and removes repetitive prefixes.
 * Refactored for clarity and maintainability.
 */
export default function remarkGroupMoveDefinitions(options = {}) {
  const definitionTypes = options.definitionTypes || defaultDefinitionTypes;
  const finalSectionOrder = [
    "intro",
    "Constants",
    "Structs",
    "Resources",
    "Functions",
    "Specification",
    "other",
  ];

  return (tree) => {
    const sections = {
      intro: [],
      Functions: [], // Will store { heading, content } objects
      Resources: [], // Will store { heading, content } objects
      Structs: [], // Will store { heading, content } objects
      Constants: [], // Will store raw nodes
      Specification: [], // Will store raw nodes initially
      other: [], // Will store raw nodes
    };

    let currentSectionNodes = [];
    let currentSectionType = "intro"; // Start with intro

    // Add a sentinel node to trigger processing of the last section
    const processingNodes = [...tree.children, { type: "sentinel" }];

    processingNodes.forEach((node) => {
      let isNewSectionStart = false;
      let newSectionType = null;
      let newSectionHeadingNode = null;

      if (node.type === "heading" && node.depth === 2) {
        isNewSectionStart = true;
        const headingText = node.children?.[0]?.value || "";
        newSectionHeadingNode = node; // Keep track of the heading node

        if (headingText === "Constants") {
          newSectionType = "Constants";
        } else if (headingText === "Specification") {
          newSectionType = "Specification";
        } else {
          const defType = getDefinitionType(headingText, definitionTypes);
          if (defType) {
            newSectionType = defType.groupHeading;
          } else {
            // If still in intro phase or no definitions encountered yet
            const noDefinitionsYet =
              !sections.Functions.length &&
              !sections.Resources.length &&
              !sections.Structs.length &&
              !sections.Constants.length &&
              !sections.Specification.length;
            if (currentSectionType === "intro" && noDefinitionsYet) {
              // Still part of the intro if it's the first H2
              isNewSectionStart = false;
              newSectionType = "intro";
            } else {
              // Unexpected H2, treat as 'other'
              newSectionType = "other";
            }
          }
        }
      } else if (node.type === "sentinel") {
        // Force processing of the last section
        isNewSectionStart = true;
        newSectionType = "end"; // Special type to signal end
      }

      // If a new section starts (or it's the end), process the collected nodes for the *previous* section
      if (isNewSectionStart && currentSectionNodes.length > 0) {
        const firstNode = currentSectionNodes[0];

        if (
          currentSectionType === "Functions" ||
          currentSectionType === "Resources" ||
          currentSectionType === "Structs"
        ) {
          // Process grouped definition section
          const headingText = firstNode.children?.[0]?.value || "";
          const defType = getDefinitionType(headingText, definitionTypes);
          if (defType) {
            // Should always find one here
            const newHeading = removePrefix(firstNode, defType.prefix, 3); // Definitions become h3
            sections[currentSectionType].push({
              heading: newHeading,
              content: currentSectionNodes.slice(1),
            });
          } else {
            // Fallback: shouldn't happen if logic is correct, but add raw nodes to 'other'
            sections.other.push(...currentSectionNodes);
          }
        } else if (currentSectionType === "Specification") {
          // Process specification nodes (heading + content)
          const processedNodes = processSpecificationNodes(
            currentSectionNodes.slice(1),
            definitionTypes,
          );
          sections.Specification.push(firstNode, ...processedNodes); // Keep original H2, add processed content
        } else {
          // For Intro, Constants, Other - add raw nodes directly
          sections[currentSectionType].push(...currentSectionNodes);
        }
        currentSectionNodes = []; // Reset for the new section
      }

      // Update current section type and add the new heading node if applicable
      if (isNewSectionStart && newSectionType !== "end") {
        currentSectionType = newSectionType;
        if (newSectionHeadingNode) {
          currentSectionNodes.push(newSectionHeadingNode);
        }
      }
      // Add content node to the current section (if not a heading that started a new section)
      else if (!isNewSectionStart && node.type !== "sentinel") {
        currentSectionNodes.push(node);
      }
    });

    // --- REBUILD TREE ---
    const finalChildren = [];

    finalSectionOrder.forEach((sectionName) => {
      const sectionNodes = sections[sectionName];
      if (sectionNodes && sectionNodes.length > 0) {
        if (
          sectionName === "Functions" ||
          sectionName === "Resources" ||
          sectionName === "Structs"
        ) {
          // Add the group H2 heading
          finalChildren.push({
            type: "heading",
            depth: 2,
            children: [{ type: "text", value: sectionName }],
          });
          // Add the processed {heading, content} items
          sectionNodes.forEach(({ heading, content }) => {
            finalChildren.push(heading);
            finalChildren.push(...content);
          });
        } else {
          // For Intro, Constants, Specification, Other - add the collected raw nodes
          finalChildren.push(...sectionNodes);
        }
        // Add spacing after the section if it's not the very last one
        finalChildren.push({ type: "text", value: "\n\n" });
      }
    });

    // Remove trailing newline if it exists
    if (finalChildren.length > 0) {
      const lastNode = finalChildren[finalChildren.length - 1];
      if (lastNode.type === "text" && lastNode.value === "\n\n") {
        finalChildren.pop();
      }
    }

    tree.children = finalChildren;
  };
}
