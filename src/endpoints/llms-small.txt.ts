import type { APIRoute } from "astro";
import {
  cacheHeaders,
  generateLlmsDocument,
  getEnglishDocs,
  LLMS_SMALL_DOC_IDS,
  orderDocs,
} from "../lib/llms";

export const prerender = true;

export const GET: APIRoute = async (context) => {
  const docs = orderDocs(await getEnglishDocs(), LLMS_SMALL_DOC_IDS).filter((doc) =>
    LLMS_SMALL_DOC_IDS.includes(doc.id),
  );

  const body = await generateLlmsDocument(docs, context, {
    minify: true,
    description:
      "This is the curated low-token Aptos developer documentation set for AI agents and IDE assistants.",
  });

  return new Response(body, {
    status: 200,
    headers: cacheHeaders(),
  });
};
