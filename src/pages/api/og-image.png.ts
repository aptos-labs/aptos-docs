import { z } from "astro:schema";
import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";
import { generateImage } from "~/lib/og-image/generateImage";
import { parseTokenOptions } from "~/lib/og-image/parseTokenOptions";

const CACHE_CONTROL_TTL = 24 * 60 * 60; // 24 hours
const OPTIONS_SCHEMA = z.object({ title: z.string(), siteTitle: z.string() });
const FONTS = [
  {
    name: "Atkinson Hyperlegible",
    data: await fs.readFile(path.resolve("public/fonts/AtkinsonHyperlegibleNext-SemiBold.ttf")),
    weight: 600,
    style: "normal",
  } as const,
];

export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const { siteTitle, title } = await parseTokenOptions(
    url.searchParams.get("token"),
    OPTIONS_SCHEMA,
  );

  return generateImage({
    width: 2400,
    height: 1260,
    fonts: FONTS,
    headers: {
      "Cache-Control": `public, max-age=${String(CACHE_CONTROL_TTL)}`,
    },
  })`
    <div style="
      height: 100%;
      width: 100%;
      padding: 80px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-between;
      gap: 40px;
      background-color: #121417;
      font-family: Atkinson Hyperlegible, sans-serif;
      font-weight: 600;
      color: white;
    ">
        <h1 style="
          flex-grow: 1;
          display: flex;
          align-items: center;
          font-size: 160px;
          line-height: 1.1;
          word-break: keep-all; /* Prevents breaking within words for CJK text */
          overflow-wrap: break-word; /* Allows breaks between words */
          text-wrap: balance;
        ">
          ${title}
        </h1>
        <div style="
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 80px;
          letter-spacing: -1px;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 120 120">
            <mask id="a" width="120" height="120" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:luminance">
              <path fill="#fff" d="M0 0h120v120H0V0Z"/>
            </mask>
            <g mask="url(#a)">
              <path fill="#fff" d="M83.606 45.738H75.97c-.849 0-1.697-.386-2.315-1.001l-3.085-3.468c-.926-1.001-2.391-1.078-3.471-.23l-.232.23-2.623 3.004c-.849 1.002-2.16 1.542-3.471 1.542H19.038A44.98 44.98 0 0 0 16.8 56.447h39.498c.694 0 1.388-.308 1.85-.77l3.704-3.852c.462-.463 1.08-.771 1.774-.771h.154c.694 0 1.389.308 1.852.847l3.086 3.467c.616.694 1.465 1.079 2.314 1.079H103.2a44.95 44.95 0 0 0-2.237-10.633H83.606v-.076ZM58.302 67.001l-3.085-3.466c-.926-1.002-2.392-1.08-3.472-.232l-.231.23-2.7 3.005c-.849 1.002-2.083 1.541-3.395 1.541H17.418c.694 3.699 1.928 7.32 3.548 10.787h19.672c.694 0 1.31-.309 1.85-.771l3.704-3.852c.462-.462 1.08-.77 1.774-.77h.154c.694 0 1.389.308 1.852.847l3.086 3.467c.616.694 1.465 1.079 2.314 1.079h43.662c1.62-3.39 2.855-7.01 3.549-10.787H60.619c-.926 0-1.775-.384-2.315-1.078h-.002Zm15.12-33.591 3.703-3.853c.463-.461 1.08-.77 1.774-.77h.154c.695 0 1.389.309 1.852.77l3.086 3.467c.617.694 1.466 1.001 2.314 1.001h8.332c-14.503-19.104-41.735-22.88-60.943-8.473a44.176 44.176 0 0 0-8.485 8.475h46.363c.77.154 1.388-.154 1.85-.617ZM43.569 89.499c-.926 0-1.775-.385-2.315-1.002l-3.085-3.466a2.45 2.45 0 0 0-3.471-.155l-.155.154-2.7 3.005c-.849 1.001-2.083 1.541-3.394 1.541h-.155c16.278 17.412 43.818 18.259 61.329 1.85.695-.618 1.311-1.31 2.006-2.004h-48.06v.077Z"/>
              <path stroke="url(#b)" stroke-width="4" d="M114 60c0 29.824-24.176 54-54 54S6 89.824 6 60 30.176 6 60 6s54 24.176 54 54Z"/>
            </g>
            <defs>
              <linearGradient id="b" x1="5.018" x2="122.243" y1="5.018" y2="109.795" gradientUnits="userSpaceOnUse">
                <stop stop-color="#61DD89"/>
                <stop offset="1" stop-color="#05EEEF"/>
              </linearGradient>
            </defs>
          </svg>
          ${siteTitle}
        </span>
      </div>
  `;
};
