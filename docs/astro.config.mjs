import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://oolashyn.github.io',
	base: '/power-pages-lookup-to-select',
	integrations: [
		starlight({
			title: 'Power Pages Lookup to Select',
			social: {
				github: 'https://github.com/OOlashyn/power-pages-lookup-to-select',
			},
			sidebar: [
				{
					label: 'Start Here',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Installation', link: '/guides/installation/' },
						{ label: 'Basic Usage', link: '/guides/basicusage/' },
					],
				},
				{
					label: 'Recipes',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Available data sources', link: '/recipes/data-sources/' },
						{ label: 'Retrieving selection', link: '/recipes/getting-selection/' },
						{ label: 'Custom rendering', link: '/recipes/custom-rendering/' },
						{ label: 'Result manipulations', link: '/recipes/result-manipulation/' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
