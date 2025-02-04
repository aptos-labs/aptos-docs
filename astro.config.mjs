// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi'

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [
      starlight({
          title: 'Aptos Docs',
          social: {
              github: 'https://github.com/aptos-labs/',
          },
					components: {
						// Override the default `Head` component.
						PageFrame: './src/components/PageFrame.astro',
					},
          plugins: [
      			// Generate the OpenAPI documentation pages.
						starlightOpenAPI([
							{
								base: 'api',
								label: 'API',
								schema: './aptos-spec.json',
								sidebarMethodBadges: true,
							},
						], {
                            routeEntrypoint: './src/components/OpenAPI/Route.astro'
                        }),
					],
          sidebar: [
              {
                  label: 'Guides',
                  items: [
                      // Each item here is one entry in the navigation menu.
                      { label: 'Example Guide', slug: 'guides/example' },
                  ],
              },
              {
                  label: 'Reference',
                  autogenerate: { directory: 'reference' },
              },
              ...openAPISidebarGroups,
          ],
          customCss: ['./src/tailwind.css'],
      }),
      tailwind({ applyBaseStyles: false }),
	],

  adapter: vercel(),
});
