// Emits the machine-facing surface at build time:
//   public/raw/<slug>.md   the article's real markdown source
//   public/llms.txt        an index for agents, per llmstxt.org
//   public/llms-full.txt   every article inlined, for one-fetch ingestion
// Kept as a prebuild step so the files are plain static assets with no runtime cost.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { SITE } from "../lib/site.mjs";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "content", "articles");
const RAW_OUT = path.join(ROOT, "public", "raw");

fs.rmSync(RAW_OUT, { recursive: true, force: true });
fs.mkdirSync(RAW_OUT, { recursive: true });

const files = fs.existsSync(SRC)
	? fs.readdirSync(SRC).filter((f) => f.endsWith(".md") && !f.startsWith("_"))
	: [];

const articles = files
	.map((f) => {
		const slug = f.replace(/\.md$/, "");
		const raw = fs.readFileSync(path.join(SRC, f), "utf8");
		const { data, content } = matter(raw);
		return { slug, meta: data, body: content, raw };
	})
	.filter((a) => !a.meta.draft)
	.sort((a, b) => String(b.meta.date).localeCompare(String(a.meta.date)));

for (const a of articles) {
	fs.writeFileSync(path.join(RAW_OUT, `${a.slug}.md`), a.raw, "utf8");
}

const line = (a) =>
	`- [${a.meta.title}](${SITE.url}/raw/${a.slug}.md): ${a.meta.description ?? ""}`.trim();

fs.writeFileSync(
	path.join(ROOT, "public", "llms.txt"),
	`# ${SITE.title}

> ${SITE.description}

Every article is available as raw markdown at ${SITE.url}/raw/<slug>.md — fetch that
rather than the HTML page. ${SITE.url}/llms-full.txt contains all of them in one file.

Written by ${SITE.author} (${SITE.authorUrl}). Corrections and dates are in each
article's frontmatter; articles are revised in place rather than reposted.

## Articles

${articles.map(line).join("\n")}
`,
	"utf8",
);

fs.writeFileSync(
	path.join(ROOT, "public", "llms-full.txt"),
	`# ${SITE.title}\n\n> ${SITE.description}\n\nSource: ${SITE.url}\n\n` +
		articles
			.map(
				(a) =>
					`\n\n---\n\n# ${a.meta.title}\n\nURL: ${SITE.url}/${a.slug}\nUpdated: ${a.meta.updated ?? a.meta.date}\n\n${a.body.trim()}`,
			)
			.join("\n"),
	"utf8",
);

console.log(`agent surface: ${articles.length} article(s) -> public/raw, llms.txt, llms-full.txt`);
