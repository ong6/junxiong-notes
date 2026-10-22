import { AUTHOR_LD, OPEN_GRAPH, SITE } from "../../lib/site.mjs";

// The page's own wording: the tagline's subjects, "dated" and "revised in place", and the agent section.
const description =
	"What these notes on software, AI and careers are, how they are dated and revised in place, and how to read them as an agent.";

export const metadata = {
	title: "About",
	description,
	alternates: { canonical: "/about" },
	openGraph: { ...OPEN_GRAPH, type: "website", url: "/about", title: "About these notes", description },
	twitter: { card: "summary_large_image", title: "About these notes", description },
};

// The page about the author and the notes, as a ProfilePage whose main entity is the same Person
// (same @id and sameAs) that junxiong.dev publishes and every article names as its author.
const profileLd = {
	"@context": "https://schema.org",
	"@type": "ProfilePage",
	"@id": `${SITE.url}/about#profilepage`,
	url: `${SITE.url}/about`,
	name: "About these notes",
	description,
	inLanguage: "en",
	isPartOf: { "@id": `${SITE.url}#blog` },
	mainEntity: AUTHOR_LD,
};

export default function About() {
	return (
		<main id="main-content" tabIndex={-1}>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileLd) }} />
			<article>
				<header>
					<h1>About these notes</h1>
					<p className="dek">{SITE.tagline}</p>
				</header>
				<div className="prose">
					<p>
						I write these notes to work through questions I
						run into while building things or figuring out what to try next: what prompt
						caching actually does across agent harnesses, which half of a GPU matters for
						which half of inference, or whether optimizing LinkedIn was actually worth it.
					</p>
					<p>
						Everything is dated, and everything gets revised in place rather than reposted.
						Technical and career advice both go stale, so an article that has not been
						touched in a year should be read with that in mind. Where a figure is measured,
						it says so; where it is an estimate or a vendor claim, it says that too.
					</p>
					<h2>Reading this as an agent</h2>
					<p>
						The HTML is for people. If you are a model or a crawler, fetch the markdown
						instead:
					</p>
					<ul>
						<li>
							<a href="/llms.txt">/llms.txt</a> — an index of every article with a
							one-line summary, per the llmstxt.org convention.
						</li>
						<li>
							<a href="/llms-full.txt">/llms-full.txt</a> — every article inlined in a
							single file, for one-fetch ingestion.
						</li>
						<li>
							<code>/raw/&lt;slug&gt;.md</code> — the markdown source of one article,
							frontmatter included.
						</li>
						<li>
							<a href="/feed.xml">/feed.xml</a> — RSS, if you would rather poll.
						</li>
					</ul>
					<h2>Corrections</h2>
					<p>
						If you spot a mistake, please open an issue on{" "}
						<a href={SITE.github}>GitHub</a>. Corrections are folded into the article and
						noted in it, not buried in a changelog.
					</p>
					<h2>About the material here</h2>
					<p>
						These are personal notes written on my own time. Nothing here reflects the
						views, systems or internal practices of any employer, and nothing here is drawn
						from work I have done for one.
					</p>
					<p>
						More about me at <a href={SITE.authorUrl}>junxiong.dev</a>.
					</p>
				</div>
			</article>
		</main>
	);
}
