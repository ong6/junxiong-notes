import Link from "next/link";
import SiteNavigation from "./site-navigation";
import "./globals.css";
import { SITE } from "../lib/site.mjs";

export const metadata = {
	metadataBase: new URL(SITE.url),
	title: { default: SITE.title, template: `%s — ${SITE.name}` },
	description: SITE.description,
	authors: [{ name: SITE.author, url: SITE.authorUrl }],
	alternates: {
		types: { "application/rss+xml": `${SITE.url}/feed.xml` },
	},
	openGraph: {
		type: "website",
		siteName: SITE.title,
		url: SITE.url,
		title: SITE.title,
		description: SITE.description,
		locale: "en_SG",
	},
	twitter: { card: "summary", title: SITE.title, description: SITE.description },
	robots: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
};

export default function RootLayout({ children }) {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Blog",
		"@id": `${SITE.url}#blog`,
		name: SITE.title,
		description: SITE.description,
		url: SITE.url,
		inLanguage: "en",
		author: {
			"@type": "Person",
			name: SITE.author,
			url: SITE.authorUrl,
			sameAs: [SITE.authorUrl, SITE.github],
		},
	};
	return (
		<html lang="en">
			<head>
				<link rel="alternate" type="application/rss+xml" title={SITE.title} href="/feed.xml" />
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</head>
			<body>
				<a className="skip-link" href="#main-content">Skip to content</a>
				<div className="wrap">
					<header className="masthead">
						<p className="site-title">
							<Link href="/">{SITE.title}</Link>
						</p>
						<p>{SITE.tagline}</p>
						<SiteNavigation />
					</header>
					{children}
					<footer>
						<div className="links">
							<a href="/feed.xml">RSS</a>
							<a href="/llms.txt">llms.txt</a>
							<a href="/llms-full.txt">llms-full.txt</a>
							<a href={SITE.github}>GitHub</a>
						</div>
						<div>
							Written by <a href={SITE.authorUrl}>{SITE.author}</a>. Personal notes —
							nothing here represents any employer. Corrections welcome on GitHub.
						</div>
					</footer>
				</div>
			</body>
		</html>
	);
}
