import Link from "next/link";

export function filterUrl(category = "", tag = "") {
	const params = new URLSearchParams();
	if (category) params.set("category", category);
	if (tag) params.set("tag", tag);
	return params.size ? `/?${params}` : "/";
}

function fmt(date) {
	if (!date || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return "";
	return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
		day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
	});
}

/**
 * The article card list: the index uses it, and so does "Related notes" under
 * each article, so both share one look. `headingLevel` keeps the outline right
 * where the list sits under its own heading.
 */
export function PostList({ posts, headingLevel = 2 }) {
	const Heading = `h${headingLevel}`;
	return (
		<ul className="post-list">
			{posts.map((post) => (
				<li key={post.slug}>
					<div className="post-meta">
						<Link className="post-category" href={filterUrl(post.category)} scroll={false}>{post.category}</Link>
						<span className="meta"><time dateTime={post.date}>{fmt(post.date)}</time><span className="reading-time">{post.readingMinutes} min read</span></span>
					</div>
					<Heading><a href={`/${post.slug}`}>{post.title}</a></Heading>
					<p>{post.description}</p>
				</li>
			))}
		</ul>
	);
}
