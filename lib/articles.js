import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import rehypeChart from "./rehype-chart.js";
import rehypeFigures from "./rehype-figures.js";
import GithubSlugger from "github-slugger";

const DIR = path.join(process.cwd(), "content", "articles");

/**
 * YAML parses an unquoted `2026-08-28` into a Date, not a string. Everything
 * downstream (rendering, RSS pubDate, sitemap lastmod) wants YYYY-MM-DD, so
 * normalise once here rather than guessing at each call site.
 */
export function isoDate(v) {
	if (!v) return undefined;
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	return String(v).slice(0, 10);
}

export function articleSlugs() {
	if (!fs.existsSync(DIR)) return [];
	return fs
		.readdirSync(DIR)
		.filter((f) => f.endsWith(".md") && !f.startsWith("_"))
		.map((f) => f.replace(/\.md$/, ""));
}

export function readArticle(slug) {
	const raw = fs.readFileSync(path.join(DIR, `${slug}.md`), "utf8");
	const { data, content } = matter(raw);
	const meta = { ...data, date: isoDate(data.date), updated: isoDate(data.updated) };
	return { slug, meta, body: content, raw };
}

/** Every article, newest first. Drafts are excluded from listings and feeds. */
export function allArticles({ includeDrafts = false } = {}) {
	return articleSlugs()
		.map((s) => {
			const { meta, body } = readArticle(s);
			return { slug: s, ...meta, readingMinutes: readingTime(body) };
		})
		.filter((a) => includeDrafts || !a.draft)
		.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function readingTime(body) {
	// Strip code blocks, link targets and bare URLs first: counting them makes a
	// link-heavy article claim several minutes it does not take to read.
	const prose = body
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/\]\([^)]*\)/g, "]")
		.replace(/https?:\/\/\S+/g, " ");
	const words = prose.split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / 225));
}

export async function renderMarkdown(body) {
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeSlug)
		.use(rehypeAutolinkHeadings, {
			behavior: "wrap",
			properties: { className: "heading-anchor" },
		})
		.use(rehypeChart)
		.use(rehypeFigures)
		.use(rehypeHighlight, { detect: true, ignoreMissing: true })
		.use(rehypeStringify)
		.process(body);
	// Wide tables get their own scroll container; the page body must never scroll sideways.
	return String(file).replace(
		/<table>/g,
		'<div class="table-scroll"><table>',
	).replace(/<\/table>/g, "</table></div>");
}

/**
 * Headings for the in-page table of contents. Uses the same slugger as
 * rehype-slug so the anchors it emits and the links here cannot drift apart.
 */
export function tableOfContents(body) {
	const slugger = new GithubSlugger();
	const out = [];
	let inFence = false;
	for (const line of body.split("\n")) {
		if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
		if (inFence) continue;
		const m = /^(#{2,3})\s+(.*)$/.exec(line);
		if (!m) continue;
		const text = m[2].replace(/[*`_]/g, "").trim();
		out.push({ depth: m[1].length, text, id: slugger.slug(text) });
	}
	return out;
}
