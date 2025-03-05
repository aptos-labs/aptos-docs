import { ImageResponse } from "@vercel/og";
import type { ReactElement } from "react";
import { html } from "satori-html";

export function generateImage(options: ConstructorParameters<typeof ImageResponse>[1]) {
  return function (template: string | TemplateStringsArray, ...expressions: unknown[]) {
    const markup = html(template, ...expressions);

    return new ImageResponse(markup as ReactElement, options);
  };
}
