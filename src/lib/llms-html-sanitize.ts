import TurndownService from "turndown";

const turndown = new TurndownService({
  codeBlockStyle: "fenced",
  headingStyle: "atx",
});

turndown.remove(["script", "style", "button"]);
turndown.keep(["table"]);

/** Strip noisy HTML before Turndown (shared by .md exports and tests). */
export function stripHtmlForLlmsExport(html: string, shouldMinify: boolean): string {
  let sanitizedHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<button[\s\S]*?<\/button>/gi, "")
    .replace(/<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>[\s\S]*?<\/span>/gi, "");

  if (shouldMinify) {
    sanitizedHtml = sanitizedHtml
      .replace(/<aside[^>]*starlight-aside--note[^>]*>[\s\S]*?<\/aside>/gi, "")
      .replace(/<aside[^>]*starlight-aside--tip[^>]*>[\s\S]*?<\/aside>/gi, "")
      .replace(/<details[\s\S]*?<\/details>/gi, "");
  }

  return sanitizedHtml;
}

export function htmlToLlmsMarkdown(html: string, shouldMinify = false): string {
  const sanitizedHtml = stripHtmlForLlmsExport(html, shouldMinify);
  let markdown = turndown.turndown(sanitizedHtml).trim();
  if (shouldMinify) {
    // Collapse horizontal whitespace only; keep newlines so fenced code, lists, and headings stay valid Markdown.
    markdown = markdown.replace(/[ \t]+/g, " ");
  }
  return markdown;
}
