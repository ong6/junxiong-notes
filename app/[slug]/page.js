import { notFound } from "next/navigation";
// Styles for ```span and ```stack charts (uipack/charts). Imported here rather
// than in the layout so pages without articles skip it.
import "uipack/charts.css";
import "uipack/article.css";
import ArticleContent from "../article-content";
import { PostList } from "../post-list";
import {
	allArticles,
	articleSlugs,
	readArticle,
	renderMarkdown,
	tableOfContents,
	readingTime,
	relatedFor,
} from "../../lib/articles";
import { OPEN_GRAPH, SITE } from "../../lib/site.mjs";

export function generateStaticParams() {
	return allArticles().map(({ slug }) => ({ slug }));
}

function load(slug) {
	if (!articleSlugs().includes(slug)) return null;
	const article = readArticle(slug);
	return article.meta.draft ? null : article;
}

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const a = load(slug);
	if (!a) return {};
	const { meta } = a;
	return {
		title: meta.title,
		description: meta.description,
		alternates: {
			canonical: `/${slug}`,
			// The article's markdown source, per llmstxt.org's link-relation proposal.
			types: { "text/markdown": `/raw/${slug}.md` },
		},
		openGraph: {
			...OPEN_GRAPH,
			type: "article",
			title: meta.title,
			description: meta.description,
			url: `${SITE.url}/${slug}`,
			publishedTime: meta.date,
			modifiedTime: meta.updated ?? meta.date,
			authors: [SITE.author],
			tags: meta.tags ?? [],
		},
		twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
	};
}

function fmt(d) {
	if (!d || Number.isNaN(Date.parse(`${d}T00:00:00Z`))) return "";
	return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});
}

export default async function Article({ params }) {
	const { slug } = await params;
	const a = load(slug);
	if (!a) notFound();
	const { meta, body } = a;
	const html = await renderMarkdown(body);
	const toc = tableOfContents(body);
	// Top 4 by shared tags, links and category (lib/related.mjs), minus any
	// article this one already shows in its own ```notes cluster.
	const related = relatedFor(slug);

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "TechArticle",
		headline: meta.title,
		description: meta.description,
		datePublished: meta.date,
		dateModified: meta.updated ?? meta.date,
		author: { "@type": "Person", name: SITE.author, url: SITE.authorUrl },
		publisher: { "@type": "Person", name: SITE.author, url: SITE.authorUrl },
		mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE.url}/${slug}` },
		inLanguage: "en",
		keywords: (meta.tags ?? []).join(", "),
		articleSection: meta.category,
		isPartOf: { "@id": `${SITE.url}#blog` },
	};

	return (
		<main id="main-content" tabIndex={-1}>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<article>
				<header>
					<div className="meta">
						<time dateTime={meta.date}>{fmt(meta.date)}</time> · {readingTime(body)} min read
					</div>
					<h1>{meta.title}</h1>
					{meta.description ? <p className="dek">{meta.description}</p> : null}
					<div className="post-taxonomy" aria-label="Category and tags">
						<a className="category-label" href={`/?${new URLSearchParams({ category: meta.category })}`}>{meta.category}</a>
						{meta.tags.map((tag) => <a key={tag} href={`/?${new URLSearchParams({ tag })}`}>#{tag}</a>)}
					</div>
					{meta.project ? (
						<a className="project-link" href={meta.project.href}>
							<span className="project-link-kicker">Project page</span>
							<span className="project-link-name">
								{meta.project.name}
								<span className="project-link-arrow" aria-hidden="true">↗</span>
							</span>
							{meta.project.detail ? <span className="project-link-detail">{meta.project.detail}</span> : null}
						</a>
					) : null}
				</header>

				{/* `toc: false` in frontmatter: an article whose opening figure is its own
				    map (a ```stack with sectionHeads) needs no second contents list. */}
				{toc.length > 2 && meta.toc !== false ? (
					<nav className="toc" aria-label="Table of contents">
						<p>Contents</p>
						<ul>
							{toc.map((h) => (
								<li key={h.id} className={`d${h.depth}`}>
									<a href={`#${h.id}`}>{h.text}</a>
								</li>
							))}
						</ul>
					</nav>
				) : null}

				<ArticleContent html={html} />

				<p className="updated">
					{!fmt(meta.date)
						? ""
						: meta.updated && meta.updated !== meta.date
							? `Published ${fmt(meta.date)}, last revised ${fmt(meta.updated)}.`
							: `Published ${fmt(meta.date)}.`}{" "}
					Revised in place rather than reposted — the date above is the one that matters.
				</p>
			</article>

			{related.length ? (
				<section className="related-notes" aria-labelledby="related-notes-heading">
					<h2 id="related-notes-heading">Related notes</h2>
					<PostList posts={related} headingLevel={3} />
				</section>
			) : null}

			<div className="agent-note">
				Markdown source for this article: <a href={`/raw/${slug}.md`}>/raw/{slug}.md</a>
			</div>
		</main>
	);
}
