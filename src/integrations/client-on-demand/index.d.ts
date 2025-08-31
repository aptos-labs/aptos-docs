import "astro";

declare module "astro" {
  interface AstroClientDirectives {
    "client:on-demand"?: string;
  }
}
