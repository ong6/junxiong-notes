import { Suspense } from "react";
import ArticleBrowser, { PostList } from "./article-browser";
import { allArticles } from "../lib/articles";
import { SITE } from "../lib/site.mjs";

export const metadata = {
	title: { absolute: SITE.title },
	alternates: { canonical: "/" },
};

export default function Home() {
	const posts = allArticles();
	return (
		<main>
			{posts.length === 0 ? (
				<p className="meta">No articles published yet.</p>
			) : (
				<Suspense fallback={<PostList posts={posts} />}>
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
