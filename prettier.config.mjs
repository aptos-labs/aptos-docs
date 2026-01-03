/* eslint-disable */
/** @type {import("prettier").Config} */
export default {
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  plugins: ["prettier-plugin-astro"],
  endOfLine: "lf",
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
    {
      files: ["*.md", "*.mdx"],
      options: {
        parser: "mdx",
        printWidth: 80,
      },
    },
  ],
};
