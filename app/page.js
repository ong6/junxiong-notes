import { allArticles } from "../lib/articles";
import { SITE } from "../lib/site.mjs";

export const metadata = {
	title: SITE.title,
	alternates: { canonical: "/" },
};

function fmt(d) {
	return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		timeZone: "UTC",
	});
}

export default function Home() {
	const posts = allArticles();
	return (
		<main>
			{posts.length === 0 ? (
				<p className="meta">No articles published yet.</p>
			) : (
				<ul className="post-list">
					{posts.map((p) => (
						<li key={p.slug}>
							<div className="meta">
								<time dateTime={p.date}>{fmt(p.date)}</time> · {p.readingMinutes} min read
							</div>
							<h2>
								<a href={`/${p.slug}`}>{p.title}</a>
							</h2>
							<p>{p.description}</p>
						</li>
					))}
				</ul>
			)}
			<div className="agent-note">
				<strong>Reading this as an agent?</strong> Every article is plain markdown at{" "}
				<code>/raw/&lt;slug&gt;.md</code>. <a href="/llms.txt">/llms.txt</a> indexes them;{" "}
				<a href="/llms-full.txt">/llms-full.txt</a> is the whole site in one file.
			</div>
		</main>
	);
}
