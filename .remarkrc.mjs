const config = {
  plugins: [["remark-frontmatter", ["yaml"]], "remark-mdx"],
  settings: {
    bullet: "-",
    emphasis: "_",
    strong: "*",
    fence: "`",
  },
};

export default config;
