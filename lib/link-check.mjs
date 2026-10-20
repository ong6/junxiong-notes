/**
 * Internal link check, run before every build (scripts/check-links.mjs) and by
 * `npm test`. Pure (no fs), so tests can feed it fixtures.
 *
 * In every published article it finds:
 *   - Markdown links to the site: ](/slug), ](/slug#anchor), ](https://notes.junxiong.dev/slug)
 *   - same-page anchors: ](#anchor)
 *   - bare or autolinked full URLs on the site host anywhere in the prose
 *   - slugs named in ```notes fences
 * and reports any that do not resolve to a published article, a known site
 * route or, for #anchors on articles, a heading id that rehype-slug generates.
 * Other fenced and inline code is skipped, so example snippets never fail.
 */
import GithubSlugger from "github-slugger";

/** Routes served by the app or public/ that are not articles. */
export const SITE_ROUTES = new Set(["/", "/about", "/feed.xml", "/llms.txt", "/llms-full.txt", "/sitemap.xml", "/robots.txt"]);
/** Folders of generated static assets; anything under them is accepted. */
export const ASSET_PREFIXES = ["/figures/", "/logos/"];

const FENCE = /^(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)^\1[ \t]*$/gm;

/** Text of the body with fenced (and, unless keepInline, inline) code blanked out, plus the slugs in ```notes fences. */
function splitBody(body, { keepInline = false } = {}) {
	const notes = [];
	const prose = body.replace(FENCE, (_, _fence, info, inner) => {
		if (/^notes\b/.test(info.trim())) {
			for (const line of inner.split("\n")) {
				const slug = line.split(":")[0].trim();
				if (slug) notes.push(slug);
			}
		}
		return "\n";
	});
	return { prose: keepInline ? prose : prose.replace(/`[^`\n]*`/g, "``"), notes };
}

/** Heading ids as rehype-slug produces them: github-slugger over the heading's plain text, in order. */
export function headingIds(body = "") {
	const slugger = new GithubSlugger();
	const ids = new Set();
	const { prose } = splitBody(body, { keepInline: true });
	for (const m of prose.matchAll(/^#{1,6}[ \t]+(.+?)[ \t#]*$/gm)) {
		const text = m[1]
			.replace(/`([^`]*)`/g, "$1")
			.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
			.replace(/<[^>]+>/g, "")
			.replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, "$2");
		ids.add(slugger.slug(text));
	}
	return ids;
}

/**
 * @param articles every article: { slug, draft, body }
 * @param options  { siteUrl }
 * @returns broken links: { slug, link, reason }
 */
export function checkLinks(articles, { siteUrl = "" } = {}) {
	const published = new Map(articles.filter((a) => !a.draft).map((a) => [a.slug, a]));
	const drafts = new Set(articles.filter((a) => a.draft).map((a) => a.slug));
	const anchorCache = new Map();
	const anchorsOf = (slug) => {
		if (!anchorCache.has(slug)) anchorCache.set(slug, headingIds(published.get(slug).body));
		return anchorCache.get(slug);
	};
	const host = siteUrl.replace(/\/+$/, "");
	const hostRe = host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const problems = [];

	for (const article of published.values()) {
		const { prose, notes } = splitBody(article.body);
		const report = (link, reason) => problems.push({ slug: article.slug, link, reason });

		const targets = new Map(); // resolved target -> link as written
		for (const m of prose.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
			const t = m[1];
			if (t.startsWith("/") && !t.startsWith("//")) targets.set(t, t);
			else if (t.startsWith("#")) targets.set(`/${article.slug}${t}`, t);
			else if (host && (t === host || t.startsWith(`${host}/`) || t.startsWith(`${host}#`) || t.startsWith(`${host}?`))) targets.set(t, t);
		}
		if (host) {
			for (const m of prose.matchAll(new RegExp(`${hostRe}(?:[/?#][^\\s)>\\]"'\`]*)?`, "g"))) {
				const t = m[0].replace(/[.,;:!]+$/, "");
				targets.set(t, t);
			}
		}

		for (const [target, written] of targets) {
			const local = host && target.startsWith(host) ? target.slice(host.length) || "/" : target;
			const [pathAndQuery, anchor] = local.split("#");
			let pathname = pathAndQuery.split("?")[0] || "/";
			if (pathname.length > 1) pathname = pathname.replace(/\/+$/, "");

			if (SITE_ROUTES.has(pathname) || ASSET_PREFIXES.some((p) => pathname.startsWith(p))) continue;
			const raw = pathname.match(/^\/raw\/([^/]+)\.md$/);
			if (raw) {
				if (!published.has(raw[1])) report(written, drafts.has(raw[1]) ? `/raw/${raw[1]}.md is a draft` : `no article "${raw[1]}" for /raw/`);
				continue;
			}
			const slug = pathname.slice(1);
			if (!published.has(slug)) {
				report(written, drafts.has(slug) ? `"${slug}" is a draft and is not served` : `no article or route at ${pathname}`);
				continue;
			}
			if (anchor && !anchorsOf(slug).has(decodeURIComponent(anchor))) {
				report(written, `no heading with id "${anchor}" in ${slug}`);
			}
		}

		for (const slug of notes) {
			if (!published.has(slug)) report(`notes: ${slug}`, drafts.has(slug) ? `"${slug}" is a draft` : `no article "${slug}"`);
		}
	}
	return problems;
}

/** Human-readable failure message, one line per broken link. */
export function formatProblems(problems) {
	const lines = problems.map((p) => `  content/articles/${p.slug}.md: ${p.link} (${p.reason})`);
	return `Broken internal links (${problems.length}):\n${lines.join("\n")}`;
}
