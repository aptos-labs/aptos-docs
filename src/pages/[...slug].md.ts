import { getCollection } from "astro:content";
import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute, GetStaticPaths } from "astro";

// Cache control settings
const CACHE_CONTROL_TTL = 60 * 60; // 1 hour for markdown files

/**
 * Get static paths for all documentation pages
 * This generates .md endpoints for every docs page
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection("docs");

  return docs.map((doc: { id: string }) => ({
    params: { slug: doc.id },
    props: { doc },
  }));
};

/**
 * API route handler to serve raw markdown content
 * Accessible by appending .md to any documentation page URL
 */
export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;

  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  try {
    // Construct the path to the MDX file
    const mdxPath = path.resolve(process.cwd(), "src/content/docs", `${slug}.mdx`);

    // Try to read the MDX file
    let content: string;
    try {
      content = await fs.readFile(mdxPath, "utf-8");
    } catch {
      // Try with /index.mdx for directory-style routes
      const indexPath = path.resolve(process.cwd(), "src/content/docs", slug, "index.mdx");
      try {
        content = await fs.readFile(indexPath, "utf-8");
      } catch {
        return new Response(`Markdown file not found for: ${slug}`, { status: 404 });
      }
    }

    // Return the raw markdown/MDX content
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": `public, max-age=${String(CACHE_CONTROL_TTL)}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(`Error serving markdown for ${slug}:`, error);
    return new Response("Internal server error", { status: 500 });
  }
};
