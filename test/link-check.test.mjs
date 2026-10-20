import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLinks, headingIds, formatProblems } from "../lib/link-check.mjs";
import { loadArticles } from "../scripts/check-links.mjs";
import { SITE } from "../lib/site.mjs";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";

const HOST = "https://notes.junxiong.dev";
const art = (slug, body, draft = false) => ({ slug, body, draft });
const links = (problems) => problems.map((p) => `${p.slug} ${p.link}`).sort();

test("heading ids match rehype-slug, including duplicates and inline markup", () => {
	const ids = headingIds("## 5. Human approval, scaled by risk\n\n## The `CLAUDE.md` file\n\n### A [linked](/x) *term*\n\n## Notes\n\n## Notes\n\n```md\n## Not a heading\n```\n");
	assert.deepEqual([...ids], ["5-human-approval-scaled-by-risk", "the-claudemd-file", "a-linked-term", "notes", "notes-1"]);
});

test("valid links pass: relative, absolute, anchors, notes fences, site routes", () => {
	const list = [
		art("a", [
			"See [b](/b), [b's section](/b#the-section), [absolute](https://notes.junxiong.dev/b) and <https://notes.junxiong.dev/b#the-section>.",
			"Also [here](#intro), [raw](/raw/b.md), [feed](/feed.xml), [llms](/llms.txt), [home](/?category=AI+systems), [figure](/figures/x.svg).",
			"External [site](https://junxiong.dev/missing) is ignored.",
			"## Intro",
			"```notes Cards\nb: Label\n```",
		].join("\n\n")),
		art("b", "## The section\n\ntext"),
	];
	assert.deepEqual(checkLinks(list, { siteUrl: HOST }), []);
});

test("broken links are reported with file and link", () => {
	const list = [
		art("a", [
			"[gone](/missing) [draft](/d) [bad anchor](/b#nope) [self anchor](#nope)",
			"[abs](https://notes.junxiong.dev/missing-too) [raw](/raw/d.md)",
			"```notes Cards\nghost: Label\n```",
			"Code is skipped: `[x](/inline-missing)`",
			"```md\n[y](/fenced-missing)\n```",
		].join("\n\n")),
		art("b", "## The section"),
		art("d", "draft body", true),
		art("e", "[draft articles are not checked](/missing)", true),
	];
	const problems = checkLinks(list, { siteUrl: HOST });
	assert.deepEqual(links(problems), [
		"a #nope", "a /b#nope", "a /d", "a /missing", "a /raw/d.md",
		"a https://notes.junxiong.dev/missing-too", "a notes: ghost",
	].sort());
	assert.match(formatProblems(problems), /content\/articles\/a\.md: \/d \("d" is a draft and is not served\)/);
});

test("every internal link in content/articles resolves", () => {
	const problems = checkLinks(loadArticles(), { siteUrl: SITE.url });
	assert.deepEqual(problems, [], problems.length ? formatProblems(problems) : "");
});

test("heading ids agree with rehype-slug on every article", async () => {
	for (const a of loadArticles()) {
		const html = String(await unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeSlug).use(rehypeStringify).process(a.body));
		const real = [...html.matchAll(/<h[1-6] id="([^"]+)"/g)].map((m) => m[1]);
		assert.deepEqual([...headingIds(a.body)], real, a.slug);
	}
});
