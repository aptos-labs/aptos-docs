import type { APIRoute } from "astro";
import { cacheHeaders, generateLlmsDocument, getEnglishDocs, orderDocs } from "../lib/llms";
import { FULL_PRIORITY_DOC_IDS } from "../lib/llms-curated-ids";

export const prerender = true;

export const GET: APIRoute = async (context) => {
  const docs = orderDocs(await getEnglishDocs(), FULL_PRIORITY_DOC_IDS);

  const body = await generateLlmsDocument(docs, context, {
    description: "This is the full Aptos developer documentation corpus in rendered Markdown.",
  });

  return new Response(body, {
    status: 200,
    headers: cacheHeaders(),
  });
};
