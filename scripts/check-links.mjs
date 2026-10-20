// Fails the build when an article links to a missing or draft article, an
// unknown site route, or a #anchor with no matching heading. See lib/link-check.mjs.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { checkLinks, formatProblems } from "../lib/link-check.mjs";
import { SITE } from "../lib/site.mjs";

export function loadArticles(dir = path.join(process.cwd(), "content", "articles")) {
	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith(".md") && !f.startsWith("_"))
		.map((f) => {
			const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
			return { slug: f.replace(/\.md$/, ""), draft: Boolean(data.draft), body: content };
		});
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const articles = loadArticles();
	const problems = checkLinks(articles, { siteUrl: SITE.url });
	if (problems.length) {
		console.error(formatProblems(problems));
		process.exit(1);
	}
	console.log(`Link check: ${articles.filter((a) => !a.draft).length} articles, all internal links resolve.`);
}
