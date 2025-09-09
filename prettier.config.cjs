/** @type {import("prettier").Config} */
module.exports = {
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  plugins: [require.resolve("prettier-plugin-astro")],
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
