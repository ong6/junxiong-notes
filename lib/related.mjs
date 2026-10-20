/**
 * "Related notes" under each article, computed at build time from frontmatter
 * and bodies only. Pure (no fs), so scripts and tests can call it directly.
 *
 * Score for a candidate against the current article:
 *   sum over shared tags of ln(N / df(tag))   (IDF: rare tags count more, a tag on every article counts 0)
 * + LINK_BONUS when either article links to the other in its body
 *   (a Markdown link to /slug or a ```notes fence line naming it)
 * + CATEGORY_BONUS when both share a category.
 * A candidate needs a shared tag or a link to count as related; if fewer than
 * `limit` do, the list is filled from the same category, newest first.
 * Ties go to the newer article.
 */

export const LINK_BONUS = 2;
export const CATEGORY_BONUS = 0.5;
const NOTES_FENCE = /^```notes[^\n]*\n([\s\S]*?)^```/gm;

/** Slugs listed in this body's ```notes fences (cards it already shows). */
export function clusteredSlugs(body = "") {
	return new Set(
		[...body.matchAll(NOTES_FENCE)].flatMap((m) =>
			m[1].split("\n").map((line) => line.split(":")[0].trim()).filter(Boolean),
		),
	);
}

/** Every site article this body points at: Markdown links to /slug (relative or absolute on `siteUrl`) and ```notes cards. */
export function linkedSlugs(body = "", siteUrl = "") {
	const out = clusteredSlugs(body);
	const host = siteUrl.replace(/\/+$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const link = new RegExp(`\\]\\(\\s*(?:${host || "(?!)"})?/([a-z0-9]+(?:-[a-z0-9]+)*)/?(?:[#?][^)\\s]*)?(?:\\s+"[^"]*")?\\s*\\)`, "g");
	for (const m of body.matchAll(link)) out.add(m[1]);
	return out;
}

const newestFirst = (a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")) || a.slug.localeCompare(b.slug);

/**
 * @param articles published articles: { slug, tags, category, date, body }
 * @param slug     the article being rendered
 * @param options  { limit = 4, exclude = Set of slugs, siteUrl }
 * @returns the chosen articles, each with `score` and `reason` ("overlap" | "category")
 */
export function relatedArticles(articles, slug, { limit = 4, exclude = new Set(), siteUrl = "" } = {}) {
	const self = articles.find((a) => a.slug === slug);
	if (!self) return [];
	const n = articles.length;
	const df = new Map();
	for (const a of articles) for (const t of new Set(a.tags ?? [])) df.set(t, (df.get(t) ?? 0) + 1);
	const links = new Map(articles.map((a) => [a.slug, linkedSlugs(a.body, siteUrl)]));
	const selfTags = new Set(self.tags ?? []);

	const candidates = articles
		.filter((a) => a.slug !== slug && !exclude.has(a.slug))
		.map((a) => {
			const tagScore = (a.tags ?? []).filter((t) => selfTags.has(t)).reduce((s, t) => s + Math.log(n / df.get(t)), 0);
			const linked = links.get(slug).has(a.slug) || links.get(a.slug).has(slug);
			const sameCategory = a.category === self.category;
			const score = tagScore + (linked ? LINK_BONUS : 0) + (sameCategory ? CATEGORY_BONUS : 0);
			return { ...a, score: Math.round(score * 1000) / 1000, overlap: tagScore > 0 || linked, sameCategory };
		});

	const ranked = candidates
		.filter((a) => a.overlap)
		.sort((a, b) => b.score - a.score || newestFirst(a, b))
		.slice(0, limit)
		.map((a) => ({ ...a, reason: "overlap" }));
	if (ranked.length < limit) {
		const fill = candidates
			.filter((a) => !a.overlap && a.sameCategory)
			.sort(newestFirst)
			.slice(0, limit - ranked.length)
			.map((a) => ({ ...a, reason: "category" }));
		ranked.push(...fill);
	}
	return ranked.map(({ overlap, sameCategory, body, ...a }) => a);
}
