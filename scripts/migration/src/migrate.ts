import path from "path";
import fs from "fs/promises";
import { glob } from "glob";

interface BaseComponentMapping {
  from: RegExp;
  to: string;
  importFrom: string;
}

interface SimpleComponentMapping extends BaseComponentMapping {
  transformProps?: (props: string) => string;
}

interface RegexComponentMapping extends BaseComponentMapping {
  transformProps: (props: string, matches: RegExpExecArray) => string;
}

type ComponentMapping = SimpleComponentMapping | RegexComponentMapping;

const COMPONENT_MAPPINGS: ComponentMapping[] = [
  {
    // Transform Tabs.Tab to TabItem
    from: /<Tabs\.Tab(?:\s+[^>]*)?>([\s\S]*?)<\/Tabs\.Tab>/g,
    to: "TabItem",
    importFrom: "@astrojs/starlight/components",
    transformProps: (props: string, matches: RegExpExecArray) => {
      const parentContent = matches.input;
      const currentPosition = matches.index;

      // Find the closest parent Tabs by looking backwards
      const precedingContent = parentContent.slice(0, currentPosition);
      const lastTabsIndex = precedingContent.lastIndexOf("<Tabs");
      if (lastTabsIndex === -1) return ' label=""';

      // Get the parent Tabs tag and its items
      const parentTabsContent = parentContent.slice(lastTabsIndex);
      const parentTabsMatch = /items={\[([^\]]+)\]}/.exec(parentTabsContent);

      if (!parentTabsMatch) return ' label=""';

      // Parse the items array
      const items = parentTabsMatch[1].split(",").map((item) => item.trim().replace(/['"]/g, ""));

      // Count Tabs.Tab elements before this one in the same parent Tabs
      const tabsContentBeforeThis = parentContent.slice(lastTabsIndex, currentPosition);
      const tabIndex = (tabsContentBeforeThis.match(/<Tabs\.Tab/g) || []).length;

      return ` label="${items[tabIndex] || ""}"`;
    },
  },
  {
    // Transform Tabs component (both with and without items prop)
    from: /<Tabs(?:\s+items={\[([^\]]+)\]})?\s*>/g,
    to: "Tabs",
    importFrom: "@astrojs/starlight/components",
    transformProps: () => "",
  },
  {
    // Transform Steps component and its content
    from: /<Steps[^>]*>([\s\S]*?)<\/Steps>/g,
    to: "Steps",
    importFrom: "@astrojs/starlight/components",
    transformProps: (props: string, matches: RegExpExecArray) => {
      // Ensure we have the content from the match
      const content = matches[1] ?? "";
      let stepCount = 1;

      // Convert h3 headings to ordered list items while preserving content between them
      const sections = content.split(/(?=###\s+)/);
      const transformedSections = sections
        .map((section) => {
          const trimmed = section.trim();
          if (!trimmed) return "";

          // If section starts with ###, convert it to a numbered step
          if (trimmed.startsWith("###")) {
            const [heading, ...rest] = trimmed.split("\n");
            const title = heading.replace(/^###\s+/, "").trim();
            const stepNumber = String(stepCount++);
            return [`${stepNumber}. ${title}`, ...rest]
              .map((line) => (line.trim() ? `   ${line}` : ""))
              .join("\n");
          }

          // If it's the first section and doesn't start with ###, make it step 1
          if (stepCount === 1) {
            const stepNumber = String(stepCount++);
            return [`${stepNumber}. Content`, trimmed]
              .map((line) => (line.trim() ? `   ${line}` : ""))
              .join("\n");
          }

          // Otherwise, just indent the content
          return trimmed
            .split("\n")
            .map((line) => (line.trim() ? `   ${line}` : ""))
            .join("\n");
        })
        .filter(Boolean)
        .join("\n\n");

      return `\n\n${transformedSections}\n`;
    },
  },
  {
    // Transform Card with href to LinkCard
    from: /<Card[^>]*href="([^"]*)"[^>]*>(?:\s*<Card\.Title[^>]*>(.*?)<\/Card\.Title>)?(?:\s*<Card\.Description[^>]*>(.*?)<\/Card\.Description>)?(?:\s*)<\/Card>/gs,
    to: "LinkCard",
    importFrom: "@astrojs/starlight/components",
    transformProps: (props: string, matches: RegExpExecArray) => {
      const [, href, title, description] = matches;
      const titleAttr = title ? ` title="${String(title)}"` : "";
      const descAttr = description ? ` description="${String(description)}"` : "";
      return ` href="${String(href)}"${titleAttr}${descAttr}`;
    },
  },
  {
    from: /<Callout type="([^"]*)"[^>]*>([\s\S]*?)<\/Callout>/g,
    to: "Aside",
    importFrom: "@astrojs/starlight/components",
    transformProps: (props: string, matches: RegExpExecArray) => {
      const [, type, content] = matches;
      const mappedType =
        {
          info: "note",
          warning: "caution",
          error: "danger",
        }[type] ?? type;
      return ` type="${mappedType}">${content}`;
    },
  },
  {
    from: /<Cards([^>]*)>/g,
    to: "CardGrid",
    importFrom: "@astrojs/starlight/components",
  },
  {
    from: /<Card(?![^>]*href=)([^>]*)>/g,
    to: "Card",
    importFrom: "@astrojs/starlight/components",
  },
];

// Get component names for import cleanup
const componentNames = COMPONENT_MAPPINGS.map((m) => /^<(\w+)/.exec(m.from.source)?.[1]).filter(
  Boolean,
);
const componentImportRegex = new RegExp(
  `^import\\s*{[^}]*(?:${componentNames.join("|")}|Tabs|FileTree|Steps|Callout)\\s*}\\s*from\\s*['"](?:@components/index|nextra/components|@components)['"];?\\s*$`,
  "gm",
);

async function processMdxFile(filePath: string, outputBasePath: string): Promise<void> {
  const content = await fs.readFile(filePath, "utf-8");
  let transformedContent = content;

  // Track required imports
  const requiredImports = new Set<string>();

  // Pre-process: Convert any remaining Tabs.Tab instances
  // First handle Tabs.Tab with comments
  transformedContent = transformedContent.replace(
    /<Tabs\.Tab[^>]*>\s*{\s*\/\*\s*([^*]+?)\s*\*\/\s*}/g,
    (match, comment) => {
      return `<TabItem label="${comment.trim()}">`;
    },
  );
  // Then handle plain Tabs.Tab
  transformedContent = transformedContent.replace(/<Tabs\.Tab[^>]*>/g, (match) => {
    // Find the parent Tabs items array
    const precedingContent = transformedContent.slice(0, transformedContent.indexOf(match));
    const lastTabsIndex = precedingContent.lastIndexOf("<Tabs");
    if (lastTabsIndex === -1) return '<TabItem label="">';

    const parentTabsContent = transformedContent.slice(lastTabsIndex);
    const parentTabsMatch = /items={\[([^\]]+)\]}/.exec(parentTabsContent);
    if (!parentTabsMatch) return '<TabItem label="">';

    const items = parentTabsMatch[1].split(",").map((item) => item.trim().replace(/['"]/g, ""));

    const tabsContentBeforeThis = transformedContent.slice(
      lastTabsIndex,
      transformedContent.indexOf(match),
    );
    const tabIndex = (tabsContentBeforeThis.match(/<Tabs\.Tab/g) || []).length;

    return `<TabItem label="${items[tabIndex] || ""}">`;
  });
  transformedContent = transformedContent.replace(/<\/Tabs\.Tab>/g, "</TabItem>");

  // First pass: Store all Tabs items arrays and their scopes
  interface TabsInfo {
    items: string[];
    endIndex: number;
  }
  const tabsItemsMap = new Map<number, TabsInfo>();
  let match: RegExpExecArray | null;
  const tabsItemsRegex = /<Tabs\s+items={\[([^\]]+)\]}[^>]*>/g;
  while ((match = tabsItemsRegex.exec(transformedContent)) !== null) {
    const items = match[1].split(",").map((item) => item.trim().replace(/['"]/g, ""));

    // Find the end of this Tabs component by counting opening/closing tags
    let depth = 1;
    let pos = match.index + match[0].length;
    while (depth > 0 && pos < transformedContent.length) {
      if (transformedContent.slice(pos).startsWith("<Tabs")) {
        depth++;
      } else if (transformedContent.slice(pos).startsWith("</Tabs>")) {
        depth--;
      }
      pos++;
    }

    tabsItemsMap.set(match.index, { items, endIndex: pos });
  }

  // Second pass: Process Tabs components to remove items prop
  const tabsMapping = COMPONENT_MAPPINGS.find((m) => m.to === "Tabs");
  if (tabsMapping) {
    requiredImports.add(tabsMapping.importFrom);
    transformedContent = transformedContent.replace(
      /<Tabs\s+items={\[([^\]]+)\]}[^>]*>/g,
      "<Tabs>",
    );
  }

  // Third pass: Process Tabs.Tab components
  const tabsTabMapping = COMPONENT_MAPPINGS.find((m) => m.to === "TabItem");
  if (tabsTabMapping) {
    let tabMatch: RegExpExecArray | null;
    while ((tabMatch = tabsTabMapping.from.exec(transformedContent)) !== null) {
      requiredImports.add(tabsTabMapping.importFrom);

      const fullMatch = tabMatch[0];
      const [, content] = tabMatch;

      // Find the closest parent Tabs
      const precedingContent = transformedContent.slice(0, tabMatch.index);
      const lastTabsIndex = precedingContent.lastIndexOf("<Tabs");

      const matchIndex = tabMatch.index;
      if (typeof matchIndex !== "number") continue;

      // Find the items array for this tab's parent by checking which Tabs scope we're in
      const parentTabs = Array.from(tabsItemsMap.entries())
        .filter(([startIndex, info]) => startIndex <= lastTabsIndex && matchIndex < info.endIndex)
        .sort((a, b) => b[0] - a[0])[0];

      if (parentTabs) {
        const [parentIndex, parentInfo] = parentTabs;

        // Count Tabs.Tab elements between parent Tabs start and this tab
        const tabsContentBeforeThis = transformedContent.slice(parentIndex, tabMatch.index);
        const tabIndex = (tabsContentBeforeThis.match(/<Tabs\.Tab/g) || []).length;

        const label = parentInfo.items[tabIndex] || "";
        const replacement = `<TabItem label="${label}">${content}</TabItem>`;

        transformedContent =
          transformedContent.slice(0, tabMatch.index) +
          replacement +
          transformedContent.slice(tabMatch.index + fullMatch.length);

        tabsTabMapping.from.lastIndex = tabMatch.index + replacement.length;
      }
    }

    // Replace any remaining closing tags
    transformedContent = transformedContent.replace(/<\/Tabs\.Tab>/g, "</TabItem>");
  }

  // Transform Callouts to Asides
  const calloutMapping = COMPONENT_MAPPINGS.find((m) => m.to === "Aside");
  if (calloutMapping) {
    requiredImports.add(calloutMapping.importFrom);
    transformedContent = transformedContent.replace(
      /<Callout type="([^"]*)"[^>]*>([\s\S]*?)<\/Callout>/g,
      (match, type, content) => {
        const typeMap: Record<string, string> = {
          info: "note",
          warning: "caution",
          error: "danger",
        };
        const mappedType = typeMap[type] ?? type;
        return `<Aside type="${mappedType}">${content}</Aside>`;
      },
    );
  }

  // Transform Cards to CardGrid first, removing className attribute
  transformedContent = transformedContent
    .replace(/<Cards[^>]*(?:className="[^"]*")?[^>]*>/g, "<CardGrid>")
    .replace(/<\/Cards>/g, "</CardGrid>");

  // Transform all Card components to LinkCards
  transformedContent = transformedContent.replace(
    /<Card\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/Card>/g,
    (match, href, content) => {
      requiredImports.add("@astrojs/starlight/components");

      // Extract title and description from content
      const titleMatch = content.match(/<Card\.Title[^>]*>([\s\S]*?)<\/Card\.Title>/);
      const descMatch = content.match(/<Card\.Description[^>]*>([\s\S]*?)<\/Card\.Description>/);

      const title = titleMatch ? titleMatch[1] : "";
      const description = descMatch ? descMatch[1] : "";

      // Clean up any HTML tags and normalize whitespace
      const cleanTitle = title
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const cleanDescription = description
        .replace(/<[^>]+>/g, "") // Remove HTML tags
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

      return `<LinkCard href="${href}" title="${cleanTitle}" description={${JSON.stringify(cleanDescription)}} />`;
    },
  );

  // Transform FileTree components
  transformedContent = transformedContent.replace(
    /<FileTree[^>]*>([\s\S]*?)<\/FileTree>/g,
    (match, content) => {
      requiredImports.add("@astrojs/starlight/components");

      // Helper function to process nested components
      const processNode = (node: string, indent: number = 0): string[] => {
        const lines: string[] = [];

        // Match both Folder and File components
        const regex =
          /<FileTree\.(Folder|File)[^>]*?name="([^"]*)"[^>]*?(?:defaultOpen[^>]*)?>([\s\S]*?)(?:<\/FileTree\.\1>|\/?>)/g;
        let match;

        while ((match = regex.exec(node)) !== null) {
          const [fullMatch, type, name, children] = match;
          const indentation = "  ".repeat(indent);

          if (type === "File") {
            // For files, just add the name with current indentation
            lines.push(`${indentation}- ${name}`);
          } else {
            // For folders, add trailing slash and process children with increased indentation
            lines.push(`${indentation}- ${name}/`);

            // Process children if they exist
            const trimmedChildren = children.trim();
            if (trimmedChildren) {
              const childLines = processNode(trimmedChildren, indent + 1);
              lines.push(...childLines);
            }
          }
        }

        return lines;
      };

      const treeLines = processNode(content);
      // Add extra newlines around the content for proper markdown spacing
      const treeContent = treeLines.join("\n");
      return `<FileTree>\n\n${treeContent}\n\n</FileTree>`;
    },
  );

  // Transform Steps
  const stepsMapping = COMPONENT_MAPPINGS.find((m) => m.to === "Steps");
  if (stepsMapping) {
    requiredImports.add(stepsMapping.importFrom);
    transformedContent = transformedContent.replace(
      stepsMapping.from,
      (match: string, content: string) => {
        let stepCount = 1;
        const sections = content.split(/(?=###\s+)/);
        const transformedSections = sections
          .map((section) => {
            const trimmed = section.trim();
            if (!trimmed) return "";

            if (trimmed.startsWith("###")) {
              const [heading, ...rest] = trimmed.split("\n");
              const title = heading.replace(/^###\s+/, "").trim();
              const stepNumber = String(stepCount++);
              const stepTitle = `${stepNumber}. ${title}`;
              const indentedContent = rest
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => `    ${line}`)
                .join("\n");
              return indentedContent ? `${stepTitle}\n${indentedContent}` : stepTitle;
            }

            if (stepCount === 1) {
              const stepNumber = String(stepCount++);
              const stepTitle = `${stepNumber}. Content`;
              const indentedContent = trimmed
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => `    ${line}`)
                .join("\n");
              return indentedContent ? `${stepTitle}\n${indentedContent}` : stepTitle;
            }

            // For content between steps, indent it to match the previous step
            return trimmed
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => `    ${line}`)
              .join("\n");
          })
          .filter(Boolean)
          .join("\n\n");

        return `<Steps>\n\n${transformedSections}\n\n</Steps>`;
      },
    );
  }

  // Final cleanup pass to catch any remaining Tabs.Tab instances
  transformedContent = transformedContent.replace(
    /<Tabs\.Tab>\s*{\s*\/\*\s*([^*]+?)\s*\*\/\s*}/g,
    (match, comment) => {
      return `<TabItem label="${comment.trim()}">`;
    },
  );
  transformedContent = transformedContent.replace(/<\/Tabs\.Tab>/g, "</TabItem>");

  // Comment out imports from @components/index with proper spacing, remove RemoteCodeblock components, and remove other old component imports
  transformedContent = transformedContent
    .replace(
      /^import\s*{[^}]*}\s*from\s*['"](?:@?components\/index|components\/index)['"];?\s*$/gm,
      (match) => `\n{/* ${match.trim()} */}\n`,
    )
    .replace(/^import\s*{[^}]*}\s*from\s*['"]@components[^"']*['"];?\s*$/gm, "")
    .replace(/^import\s*{[^}]*}\s*from\s*['"]components[^"']*['"];?\s*$/gm, "")
    .replace(/^import\s*{[^}]*}\s*from\s*['"]@docs-config['"];?\s*$/gm, "")
    .replace(/<RemoteCodeblock[^>]*\/>\s*/g, "")
    .replace(/<GraphQLEditor[^>]*\/>\s*/g, (match) => `\n{/* ${match.trim()} */}\n`)
    .replace(componentImportRegex, "");

  // Extract title from first h1 heading
  const titleMatch = transformedContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "Untitled";

  // Add frontmatter and imports
  const importStatements = Array.from(requiredImports)
    .map((importFrom) => {
      const components = COMPONENT_MAPPINGS.filter(
        (m) => m.importFrom === importFrom && transformedContent.includes(`<${m.to}`),
      ).map((m) => m.to);
      // Only return import statement if we have components to import
      return components.length > 0
        ? `import { ${components.join(", ")} } from '${importFrom}';`
        : "";
    })
    .filter(Boolean) // Remove empty import statements
    .join("\n");

  // Create or update frontmatter with proper YAML formatting
  // Wrap title in quotes to handle special characters
  const frontmatter = `---
title: "${title}"
---

`;

  // Remove any existing frontmatter
  transformedContent = transformedContent.replace(/^---\n[\s\S]*?\n---\n/, "");

  // Add new frontmatter and imports
  transformedContent = `${frontmatter}${importStatements}\n\n${transformedContent}`;

  // Create the output directory structure
  const relativePath = path.relative(
    path.join(process.cwd(), "..", "..", "nextra-migration"),
    filePath,
  );
  const outputPath = path.join(outputBasePath, relativePath);

  // Ensure output path is a string
  const safeOutputPath = String(outputPath);
  console.log(`Writing to: ${safeOutputPath}`);

  // Ensure directory exists
  await fs.mkdir(path.dirname(safeOutputPath), { recursive: true });

  // Write the transformed content
  await fs.writeFile(safeOutputPath, transformedContent);
}

async function migrateFiles(): Promise<void> {
  try {
    // Get the project root directory (where the script is running from)
    const projectRoot = process.cwd();
    // Resolve paths relative to project root
    const nextraMigrationPath = path.join(projectRoot, "..", "..", "nextra-migration");
    const outputBasePath = path.join(projectRoot, "..", "..", "src/content/docs");

    console.log("Searching for MDX files in:", nextraMigrationPath);
    console.log("Output directory:", outputBasePath);

    const files = await glob("**/*.mdx", {
      cwd: nextraMigrationPath,
      absolute: true,
    });

    const fileCount = String(files.length);
    console.log(`Found ${fileCount} MDX files to process`);

    for (const file of files) {
      const relativePath = path.relative(nextraMigrationPath, file);
      await processMdxFile(file, outputBasePath);
      console.log(`Processed: ${relativePath}`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Use void operator to explicitly mark the Promise as handled
void migrateFiles();
