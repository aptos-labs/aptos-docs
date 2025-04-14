import remarkFormatJSXGraphQL from "./src/plugins/remark-format-jsx-graphql.js";

const config = {
  plugins: [["remark-frontmatter", ["yaml"]], "remark-mdx", remarkFormatJSXGraphQL],
  settings: {
    bullet: "-",
    emphasis: "_",
    strong: "*",
    fence: "`",
  },
};

export default config;
