import { notFound } from "next/navigation";
import {
	allArticles,
	articleSlugs,
	readArticle,
	renderMarkdown,
	tableOfContents,
	readingTime,
} from "../../lib/articles";
import { SITE } from "../../lib/site.mjs";

export function generateStaticParams() {
	return articleSlugs().map((slug) => ({ slug }));
}

function load(slug) {
	if (!articleSlugs().includes(slug)) return null;
	return readArticle(slug);
}

export async function generateMetadata({ params }) {
	const { slug } = await params;
	const a = load(slug);
	if (!a) return {};
	const { meta } = a;
	return {
		title: meta.title,
		description: meta.description,
		alternates: { canonical: `/${slug}` },
		openGraph: {
			type: "article",
			title: meta.title,
			description: meta.description,
			url: `${SITE.url}/${slug}`,
			publishedTime: meta.date,
			modifiedTime: meta.updated ?? meta.date,
			authors: [SITE.author],
			tags: meta.tags ?? [],
		},
		twitter: { card: "summary", title: meta.title, description: meta.description },
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
	const related = allArticles()
		.filter((p) => p.slug !== slug)
		.map((p) => ({
			...p,
			overlap: (p.tags ?? []).filter((t) => (meta.tags ?? []).includes(t)).length,
		}))
		.sort((x, y) => y.overlap - x.overlap)
		.slice(0, 3)
		.filter((p) => p.overlap > 0);

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
		isPartOf: { "@id": `${SITE.url}#blog` },
	};

	return (
		<main>
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
				</header>

				{toc.length > 2 ? (
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

				<div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

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
				<section>
					<h2 style={{ fontSize: "1.1rem", marginTop: "2.5rem" }}>Related</h2>
					<ul className="post-list">
						{related.map((p) => (
							<li key={p.slug}>
								<h2>
									<a href={`/${p.slug}`}>{p.title}</a>
								</h2>
								<p>{p.description}</p>
							</li>
						))}
					</ul>
				</section>
			) : null}

			<div className="agent-note">
				Markdown source for this article: <a href={`/raw/${slug}.md`}>/raw/{slug}.md</a>
			</div>
		</main>
	);
}
