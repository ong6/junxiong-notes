import { allArticles, articleSlugs, readArticle } from "../../../lib/articles";
import { ogCard } from "../../../lib/og-card";
import { SITE } from "../../../lib/site.mjs";

// Per-article social card: the article's title on the shared card (lib/og-card.js).
// A route handler rather than the opengraph-image.js file convention, whose `alt`
// is one string for every article; generateMetadata in ../page.js links this URL
// with a per-article og:image:alt. Same URL as before.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
	return allArticles().map(({ slug }) => ({ slug }));
}

export async function GET(_request, { params }) {
	const { slug } = await params;
	if (!articleSlugs().includes(slug)) return new Response("Not found", { status: 404 });
	const { meta } = readArticle(slug);
	if (meta.draft) return new Response("Not found", { status: 404 });
	return ogCard(meta.title ?? SITE.title);
}
