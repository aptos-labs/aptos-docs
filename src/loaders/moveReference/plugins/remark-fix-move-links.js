import { slug } from "github-slugger";
import { visit } from "unist-util-visit";

/**
 * A more aggressive remark plugin to fix internal Move reference links.
 * Converts any link with .md extension to just the hash part.
 * Also removes the 0x1_ prefix and module name from the hash.
 * For example: "jwks.md#0x1_jwks_JWK" -> "#JWK"
 * Uses GitHub Slugger for consistent slug generation.
 */
export default function remarkFixMoveLinks() {
  return (tree, file) => {
    // Debug the file path
    // console.log('Processing file:', file.path);

    // Extract the module name from the file path if possible
    let moduleName = "";
    if (file.path) {
      const parts = file.path.split("/");
      const filename = parts[parts.length - 1];
      if (filename.endsWith(".md")) {
        moduleName = filename.slice(0, -3); // Remove .md extension
      }
    }

    // Function to clean hash by removing 0x1_ prefix and module name
    const cleanHash = (hash, moduleName) => {
      // Make sure we're working with a string that starts with a single #
      let cleanedHash = hash;

      // If the hash doesn't start with #, add it
      if (!cleanedHash.startsWith("#")) {
        cleanedHash = `#${cleanedHash}`;
      }

      // If the hash has multiple # at the beginning, reduce to one
      while (cleanedHash.startsWith("##")) {
        cleanedHash = cleanedHash.substring(1);
      }

      // Remove 0x1_ prefix if present
      const oxMatch = cleanedHash.match(/#0x[0-9a-f]+_(.+)$/);
      if (oxMatch) {
        cleanedHash = `#${oxMatch[1]}`;
      }

      // Remove module_ prefix if present
      // This handles cases like #jwks_UnsupportedJWK -> #UnsupportedJWK
      if (moduleName) {
        const modulePrefix = new RegExp(`^#${moduleName}_(.+)$`);
        const moduleMatch = cleanedHash.match(modulePrefix);
        if (moduleMatch) {
          cleanedHash = `#${moduleMatch[1]}`;
        }
      }

      // Also try to match any module_Identifier pattern
      // This is a more general case when we don't know the module name
      const generalModuleMatch = cleanedHash.match(/#([a-z0-9_]+)_([A-Za-z0-9_]+)$/);
      if (generalModuleMatch) {
        // Check if the first part looks like a module name (all lowercase)
        const possibleModule = generalModuleMatch[1];
        const identifier = generalModuleMatch[2];

        // If the possible module is all lowercase and the identifier starts with uppercase,
        // it's likely a module_Identifier pattern
        if (/^[a-z0-9_]+$/.test(possibleModule) && /^[A-Z]/.test(identifier)) {
          cleanedHash = `#${identifier}`;
        }
      }

      // Final check to ensure we don't have multiple # at the beginning
      while (cleanedHash.startsWith("##")) {
        cleanedHash = cleanedHash.substring(1);
      }

      // Extract the text part (without the # symbol) for slugging
      const textPart = cleanedHash.substring(1);

      // Only apply GitHub slugger if there's actual content
      if (textPart.trim()) {
        // Generate a GitHub-style slug and restore the # prefix
        return `#${slug(textPart)}`;
      }

      return cleanedHash;
    };

    // Visit all link nodes in the tree
    visit(tree, "link", (node) => {
      if (!node.url) return;

      // Debug the link URL
      // console.log("Found link:", node.url);

      // Check if the URL contains .md
      if (node.url.includes(".md")) {
        // Extract the hash part (everything after #)
        const hashIndex = node.url.indexOf("#");
        if (hashIndex !== -1) {
          let hash = node.url.substring(hashIndex);

          // Debug the extracted hash
          // console.log('Extracted hash:', hash, 'from URL:', node.url);

          // Clean the hash
          hash = cleanHash(hash, moduleName);
          // console.log('Cleaned hash to:', hash);

          // Replace the URL with just the hash part
          node.url = hash;

          // Debug the updated URL
          // console.log('Updated link to:', node.url);
        } else {
          // If there's no hash, just use #
          node.url = "#";
          // console.log('No hash found, updated link to #');
        }
      } else if (node.url.startsWith("#")) {
        // Also process standalone hash links
        const originalHash = node.url;
        node.url = cleanHash(node.url, moduleName);
        if (originalHash !== node.url) {
          // console.log('Cleaned standalone hash from:', originalHash, 'to:', node.url);
        }
      }
    });

    // Also visit all HTML nodes to catch any links that might be in HTML
    visit(tree, "html", (node) => {
      if (!node.value) return;

      // Replace any occurrences of href="*.md#*" with href="#*"
      let newValue = node.value.replace(/href="[^"]*\.md(#[^"]*)?"/g, (_match, hash) => {
        if (!hash) return 'href="#"';
        return `href="${cleanHash(hash, moduleName)}"`;
      });

      // Also process standalone hash links in HTML
      newValue = newValue.replace(/href="#[^"]+"/g, (match) => {
        // Extract the hash without the href=" and " parts
        const fullHash = match.substring(6, match.length - 1);
        // The hash already includes the # character, so don't add another one
        return `href="${cleanHash(fullHash, moduleName)}"`;
      });

      // Update the node value if it changed
      if (newValue !== node.value) {
        node.value = newValue;
        // console.log('Updated HTML node');
      }
    });
  };
}
