/**
 * @type {() => import('astro').AstroIntegration}
 */
const onDemandDirective = () => ({
  name: "client:on-demand",
  hooks: {
    "astro:config:setup": ({ addClientDirective }) => {
      addClientDirective({
        name: "on-demand",
        entrypoint: "./src/integrations/client-on-demand/on-demand.js",
      });
    },
  },
});

export default onDemandDirective;
