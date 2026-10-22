import { allArticles, articleSlugs, readArticle } from "../../lib/articles";
import { OG_SIZE, ogCard } from "../../lib/og-card";
import { SITE } from "../../lib/site.mjs";

export const alt = "Article preview";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
	return allArticles().map(({ slug }) => ({ slug }));
}

// Per-article social card: the article's title on the shared card (lib/og-card.js).
export default async function Image({ params }) {
	const { slug } = await params;
	if (!articleSlugs().includes(slug)) return new Response("Not found", { status: 404 });
	const { meta } = readArticle(slug);
	if (meta.draft) return new Response("Not found", { status: 404 });
	return ogCard(meta.title ?? SITE.title);
}
