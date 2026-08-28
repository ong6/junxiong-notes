import { allArticles } from "../lib/articles";
import { SITE } from "../lib/site.mjs";

export default function sitemap() {
	const posts = allArticles();
	const newest = posts[0]?.updated ?? posts[0]?.date ?? "2026-08-28";
	return [
		{ url: `${SITE.url}/`, lastModified: newest, changeFrequency: "weekly", priority: 1 },
		{ url: `${SITE.url}/about`, lastModified: newest, changeFrequency: "yearly", priority: 0.5 },
		...posts.map((p) => ({
			url: `${SITE.url}/${p.slug}`,
			lastModified: p.updated ?? p.date,
			changeFrequency: "monthly",
			priority: 0.8,
		})),
	];
}
