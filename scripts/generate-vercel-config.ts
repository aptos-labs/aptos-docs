import fs from "fs";
import { cspDirectives } from "./csp.config";

const additionalScriptHashes = [
  // paste in any new hashes here or load from a JSON dump
  "sha256-tS7/WqSwEFaHIQmDc9NqlnAXlhA4+mtXnP7s6/KeUO4=",
  "sha256-VWo5Wp4aqSj6nSgMpeAp9cKieaoIfwFUAunAVugI5gA=",
  "sha256-ofb9Jn5JRACjZKN7P7zCh8nlYwlP8SkfxBrX4g/VAsU=",
  "sha256-4v8AR1EZcV8agyO8U4L/s1+HVKW29L2Pr9BL7j+Btas=",
  "sha256-GkZBRnvSuhtx/cvzvukVkX2JJZW+DdPlVr7BX8Tefqo=",
  "sha256-wX2yOADeV+NMngflD5uYi3vl50SHC4sfM1EmylVjlX4=",
  "sha256-7eCV4jtsr4t4knb3c4FCRPeu7GGZeOUGE3XvWix0XOQ=",
  "sha256-fAwP2oQRkAG94pQnpau74vjmuRUn+mJAP8WX5fDnolY=",
  "sha256-ijttFDel9I45Iy4QIFEAjeSz8jIoT+BkBu2/ERAo6DY=",
  "sha256-w78n7W12c94ck4KhBCBA4NrjqkbDvSutqee+u+no0Tg=",
  "sha256-d1kaX3kG/emdxgvS2H8kt/gUsDvymE0S0L7wSZDJiJM=",
  "sha256-e0QYafnYzcPKvBYJPt/t5hUpK9lXloNyQ4ee73jhrhE=",
  "sha256-G75LZQEWCToKly7XSvJqpGw++ijRtwCQQtrxTUltZCU=",
  "sha256-8JLcQFZQruxl3jMUwogr3y5/GMmZPAc+j2mNi7gywmw=",
  "sha256-tDEbgwVdXhlcXwHr9CI2t73bYM8h+5YG16wOi/U0trg=",
  "sha256-y/2c5blbFZvd6Y6GDPrj00Dsqw5zX5nZSpCYWtivtOI=",
];

const scriptSrc = cspDirectives["script-src"] || [];
cspDirectives["script-src"] = [...scriptSrc, ...additionalScriptHashes.map((h) => `'${h}'`)];

const cspHeader = Object.entries(cspDirectives)
  .map(([key, value]) => `${key} ${value.join(" ")}`)
  .join("; ");

const headers = [
  {
    source: "/(.*)",
    headers: [
      {
        key: "Content-Security-Policy",
        value: cspHeader,
      },
      {
        key: "Permissions-Policy",
        value:
          "accelerometer=(), autoplay=(), camera=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(self), usb=(), web-share=(self), xr-spatial-tracking=(), clipboard-read=(self), clipboard-write=(self), gamepad=(), hid=(self), idle-detection=(), serial=()",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Cross-Origin-Resource-Policy",
        value: "cross-origin",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Access-Control-Allow-Origin",
        value:
          "https://preview.aptos.dev, https://aptos.dev, https://aptos-docs-git-security-vercel-csp-aptoslabs.vercel.app",
      },
      {
        key: "Access-Control-Allow-Methods",
        value: "GET, POST, OPTIONS",
      },
      {
        key: "Access-Control-Allow-Headers",
        value: "Content-Type, Authorization",
      },
    ],
  },
];

fs.writeFileSync(
  "./vercel.json",
  JSON.stringify(
    {
      trailingSlash: false,
      headers,
    },
    null,
    2,
  ) + "\n",
);

console.log("vercel.json CSP and headers written.");
