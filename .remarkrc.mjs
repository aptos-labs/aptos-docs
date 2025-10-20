import remarkFormatJSXGraphQL from "./src/plugins/remark-format-jsx-graphql.js";
import remarkKeepTilde from "./src/plugins/remark-keep-tilde.js";

const config = {
  plugins: [
    ["remark-frontmatter", ["yaml"]],
    "remark-gfm",
    remarkKeepTilde,
    "remark-mdx",
    remarkFormatJSXGraphQL,
  ],
  settings: {
    bullet: "-",
    emphasis: "_",
    strong: "*",
    fence: "`",
  },
};

export default config;
