import { allArticles } from "../../lib/articles";
import { SITE } from "../../lib/site.mjs";

export const dynamic = "force-static";

const esc = (s = "") =>
	String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

export function GET() {
	const posts = allArticles();
	const updated = posts[0]?.updated ?? posts[0]?.date;
	const items = posts
		.map(
			(p) => `		<item>
			<title>${esc(p.title)}</title>
			<link>${SITE.url}/${p.slug}</link>
			<guid isPermaLink="true">${SITE.url}/${p.slug}</guid>
			<description>${esc(p.description)}</description>
			<pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
${(p.tags ?? []).map((t) => `			<category>${esc(t)}</category>`).join("\n")}
		</item>`,
		)
		.join("\n");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>${esc(SITE.title)}</title>
		<link>${SITE.url}</link>
		<description>${esc(SITE.description)}</description>
		<language>en</language>
		<atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml" />
${updated ? `		<lastBuildDate>${new Date(`${updated}T00:00:00Z`).toUTCString()}</lastBuildDate>` : ""}
${items}
	</channel>
</rss>
`;
	return new Response(xml, {
		headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
	});
}
