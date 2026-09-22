"use client";

import Link from "next/link";
import { useRef } from "react";
import { useSearchParams } from "next/navigation";

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
					<div className="post-meta">
						<Link className="post-category" href={filterUrl(post.category)} scroll={false}>{post.category}</Link>
						<span className="meta"><time dateTime={post.date}>{fmt(post.date)}</time><span className="reading-time">{post.readingMinutes} min read</span></span>
					</div>
					<h2><a href={`/${post.slug}`}>{post.title}</a></h2>
					<p>{post.description}</p>
				</li>
			))}
		</ul>
	);
}

export default function ArticleBrowser({ posts }) {
	const topicPicker = useRef(null);
	const params = useSearchParams();
	const category = params.get("category") ?? "";
	const tag = params.get("tag") ?? "";
	const categories = [...new Set(posts.map((post) => post.category))].sort();
	const categoryPosts = posts.filter((post) => !category || post.category === category);
	const tags = [...new Set(categoryPosts.flatMap((post) => post.tags))].sort();
	const filtered = categoryPosts.filter((post) => !tag || post.tags.includes(tag));
	const nextCategoryUrl = (name) => filterUrl(name, posts.some((p) => (!name || p.category === name) && p.tags.includes(tag)) ? tag : "");

	return (
		<>
			<section className="article-filters" aria-label="Browse articles">
				<nav className="category-filters" aria-label="Article categories">
					<Link href={nextCategoryUrl("")} scroll={false} aria-current={!category ? "page" : undefined}>All notes <span>{posts.length}</span></Link>
					{categories.map((name) => (
						<Link key={name} href={nextCategoryUrl(name)} scroll={false} aria-current={category === name ? "page" : undefined}>
							{name} <span>{posts.filter((post) => post.category === name).length}</span>
						</Link>
					))}
				</nav>
				<div className="browse-tools">
					<p className="filter-summary" role="status" aria-live="polite" aria-atomic="true">
						{filtered.length} {filtered.length === 1 ? "note" : "notes"}{category ? ` in ${category}` : ""}{tag ? ` about ${tag}` : ""}
					</p>
					<details suppressHydrationWarning className="topic-picker" key={category} ref={topicPicker} onClick={(event) => {
						if (event.target.closest("a")) {
							topicPicker.current.open = false;
							topicPicker.current.querySelector("summary").focus();
						}
					}}>
						<summary>Topics <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12"><path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></summary>
						<div className="topic-panel">
							<p>Explore {category ? category.toLowerCase() : "the notes"} by topic</p>
							<div className="topic-links">
								<Link href={filterUrl(category)} scroll={false} aria-current={!tag ? "page" : undefined}>All topics</Link>
								{tags.map((name) => <Link key={name} href={filterUrl(category, name)} scroll={false} aria-current={tag === name ? "page" : undefined}>{name}</Link>)}
							</div>
						</div>
					</details>
				</div>
				{tag ? <Link className="active-topic" href={filterUrl(category)} scroll={false} aria-label={`Remove topic filter: ${tag}`}>{tag}<span aria-hidden="true">×</span></Link> : null}
			</section>
			{filtered.length ? <PostList posts={filtered} /> : <div className="empty-state"><h2>No notes here yet</h2><p>Try another topic, or <Link href="/" scroll={false}>browse all notes</Link>.</p></div>}
		</>
	);
}
