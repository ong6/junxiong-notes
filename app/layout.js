import Link from "next/link";
import SiteNavigation from "./site-navigation";
import "./globals.css";
import { AUTHOR_LD, OPEN_GRAPH, SITE } from "../lib/site.mjs";

export const metadata = {
	metadataBase: new URL(SITE.url),
	title: { default: SITE.title, template: `%s — ${SITE.name}` },
	description: SITE.description,
	authors: [{ name: SITE.author, url: SITE.authorUrl }],
	alternates: {
		types: { "application/rss+xml": `${SITE.url}/feed.xml` },
	},
	// No og:url here: a page that inherited it would claim to be the index.
	openGraph: {
		...OPEN_GRAPH,
		type: "website",
		title: SITE.title,
		description: SITE.description,
	},
	twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
	robots: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
};

// Runs before first paint: apply a saved appearance choice (written by the
// toggle in site-navigation.js) so a stored dark choice never flashes light.
// With no saved choice, CSS follows the OS until the toggle syncs.
const THEME_SCRIPT = `try{var t=localStorage.getItem("notes-appearance");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Blog",
		"@id": `${SITE.url}#blog`,
		name: SITE.title,
		description: SITE.description,
		url: SITE.url,
		inLanguage: "en",
		author: AUTHOR_LD,
	};
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
				<link rel="alternate" type="application/rss+xml" title={SITE.title} href="/feed.xml" />
				{/* The agent index that covers every page here (llmstxt.org link relations). */}
				<link rel="describedby" type="text/markdown" href="/llms.txt" />
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
