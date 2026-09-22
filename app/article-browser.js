"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function filterUrl(category = "", tag = "") {
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

export function PostList({ posts }) {
	return (
		<ul className="post-list">
			{posts.map((post) => (
				<li key={post.slug}>
					<div className="meta">
						<time dateTime={post.date}>{fmt(post.date)}</time> · {post.readingMinutes} min read
					</div>
					<h2><a href={`/${post.slug}`}>{post.title}</a></h2>
					<p>{post.description}</p>
					<div className="post-taxonomy" aria-label="Category and tags">
						<Link className="category-label" href={filterUrl(post.category)} scroll={false}>{post.category}</Link>
						{post.tags.map((tag) => (
							<Link key={tag} href={filterUrl("", tag)} scroll={false}>#{tag}</Link>
						))}
					</div>
				</li>
			))}
		</ul>
	);
}

export default function ArticleBrowser({ posts }) {
	const params = useSearchParams();
	const router = useRouter();
	const category = params.get("category") ?? "";
	const tag = params.get("tag") ?? "";
	const categories = [...new Set(posts.map((post) => post.category))].sort();
	const tags = [...new Set(posts.flatMap((post) => post.tags))].sort();
	const filtered = posts.filter((post) => (!category || post.category === category) && (!tag || post.tags.includes(tag)));

	return (
		<>
			<section className="article-filters" aria-label="Filter articles">
				<nav className="category-filters" aria-label="Article categories">
					<Link href={filterUrl("", tag)} scroll={false} aria-current={!category ? "page" : undefined}>All categories <span>{posts.length}</span></Link>
					{categories.map((name) => (
						<Link key={name} href={filterUrl(name, tag)} scroll={false} aria-current={category === name ? "page" : undefined}>
							{name} <span>{posts.filter((post) => post.category === name).length}</span>
						</Link>
					))}
				</nav>
				<div className="tag-filter">
					<label htmlFor="article-tag">Tag</label>
					<select id="article-tag" value={tag} onChange={(event) => router.push(filterUrl(category, event.target.value), { scroll: false })}>
						<option value="">All tags</option>
						{tag && !tags.includes(tag) ? <option value={tag}>{tag}</option> : null}
						{tags.map((name) => <option key={name} value={name}>{name}</option>)}
					</select>
					{category || tag ? <Link href="/" scroll={false}>Clear filters</Link> : null}
				</div>
				<p className="filter-summary" role="status" aria-live="polite">
					{filtered.length} {filtered.length === 1 ? "article" : "articles"}{category ? ` in ${category}` : ""}{tag ? ` tagged #${tag}` : ""} · newest first
				</p>
			</section>
			{filtered.length ? <PostList posts={filtered} /> : <p className="empty-state">No articles match these filters. <Link href="/" scroll={false}>See all articles</Link>.</p>}
		</>
	);
}
