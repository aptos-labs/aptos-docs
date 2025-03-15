import type { CollectionEntry } from 'astro:content';

export const groupPagesByLang = <T extends CollectionEntry<'docs'>>(pages: T[]) =>
	pages.reduce<Record<string, T[]>>(
		(pages, page) => {
			const lang = page.id.split('/')[0];
			if (!pages[lang]) pages[lang] = [];
			pages[lang].push(page);
			return pages;
		},
		{}
	);