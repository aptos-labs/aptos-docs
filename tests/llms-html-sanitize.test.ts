import { describe, expect, it } from "vitest";
import { htmlToLlmsMarkdown, stripHtmlForLlmsExport } from "../src/lib/llms-html-sanitize";

describe("LLMs HTML sanitization and Markdown export", () => {
  it("removes script, style, svg, button, and sr-only spans", () => {
    const html = `
      <p>Visible</p>
      <script>alert(1)</script>
      <style>.x{}</style>
      <button>Click</button>
      <span class="sr-only">Skip</span>
      <svg><path /></svg>
    `;
    const out = stripHtmlForLlmsExport(html, false);
    expect(out).toContain("Visible");
    expect(out).not.toMatch(/script/i);
    expect(out).not.toMatch(/<style/i);
    expect(out).not.toMatch(/<button/i);
    expect(out).not.toMatch(/sr-only/);
    expect(out).not.toMatch(/<svg/i);
  });

  it("when minifying, strips Starlight note/tip asides and details", () => {
    const html = `
      <p>Keep</p>
      <aside class="starlight-aside starlight-aside--note">Note</aside>
      <aside class="starlight-aside starlight-aside--tip">Tip</aside>
      <details><summary>x</summary>y</details>
    `;
    const out = stripHtmlForLlmsExport(html, true);
    expect(out).toContain("Keep");
    expect(out).not.toContain("Note");
    expect(out).not.toContain("Tip");
    expect(out).not.toContain("details");
  });

  it("converts simple HTML to Markdown", () => {
    const md = htmlToLlmsMarkdown("<h1>Title</h1><p>Body <strong>bold</strong>.</p>", false);
    expect(md).toContain("# Title");
    expect(md).toMatch(/bold/);
  });

  it("collapses whitespace when minify is true", () => {
    const md = htmlToLlmsMarkdown("<p>One</p>\n\n<p>Two</p>", true);
    expect(md).not.toMatch(/\n\n/);
  });
});
