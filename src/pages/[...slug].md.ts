import { getCollection } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";
import { cacheHeaders, renderDocToMarkdown } from "../lib/llms";

/**
 * Per-page Markdown mirrors the HTML site for non-draft docs only (draft pages are excluded from the public site).
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection("docs");

  return docs
    .filter((doc) => !doc.data.draft)
    .map((doc: { id: string }) => ({
      params: { slug: doc.id },
      props: { doc },
    }));
};

/**
 * API route handler to serve rendered markdown content
 * Accessible by appending .md to any documentation page URL
 */
export const GET: APIRoute = async (context) => {
  const slug = context.params.slug;
  const doc = context.props?.doc;

  if (!slug || !doc) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const content = await renderDocToMarkdown(doc, context);

    return new Response(content, {
      status: 200,
      headers: cacheHeaders("text/markdown; charset=utf-8"),
    });
  } catch (error) {
    console.error(`Error serving markdown for ${slug}:`, error);
    return new Response("Internal server error", { status: 500 });
  }
};
