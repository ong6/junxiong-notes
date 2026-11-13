import { Suspense } from "react";
import ArticleBrowser, { ArticleBrowserView } from "./article-browser";
import { allArticles } from "../lib/articles";
import { OPEN_GRAPH, SITE } from "../lib/site.mjs";

export const metadata = {
	title: { absolute: SITE.title },
	alternates: {
		canonical: "/",
		// The index as markdown, the same relation articles use for /raw/<slug>.md.
		types: { "text/markdown": "/llms.txt" },
	},
	openGraph: {
		...OPEN_GRAPH,
		type: "website",
		url: "/",
		title: SITE.title,
		description: SITE.description,
	},
};

export default function Home() {
	const posts = allArticles();
	return (
		<main id="main-content" tabIndex={-1}>
			{posts.length === 0 ? (
				<p className="meta">No notes published yet.</p>
			) : (
				// The prerendered page is the unfiltered browser (tabs, count, Topics and the
				// list), so nothing is added above the list when the script arrives; the
				// address's filters apply then.
				<Suspense fallback={<ArticleBrowserView posts={posts} />}>
					<ArticleBrowser posts={posts} />
				</Suspense>
			)}
			<div className="agent-note">
				<strong>Reading this as an agent?</strong> Every article is plain markdown at{" "}
				<code>/raw/&lt;slug&gt;.md</code>. <a href="/llms.txt">/llms.txt</a> indexes them;{" "}
				<a href="/llms-full.txt">/llms-full.txt</a> is the whole site in one file.
			</div>
		</main>
	);
}
