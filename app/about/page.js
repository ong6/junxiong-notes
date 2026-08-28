import { SITE } from "../../lib/site.mjs";

export const metadata = {
	title: "About",
	description: `About ${SITE.title} — what these notes are, how they are maintained, and how to read them as an agent.`,
	alternates: { canonical: "/about" },
};

export default function About() {
	return (
		<main>
			<article>
				<header>
					<h1>About these notes</h1>
					<p className="dek">{SITE.tagline}</p>
				</header>
				<div className="prose">
					<p>
						This is a working notebook, not a magazine. Each article covers one question I
						had to answer properly for my own systems — what prompt caching actually does
						across different agent harnesses, which half of a GPU matters for which half of
						inference, what a quantization step really costs in quality.
					</p>
					<p>
						Everything is dated, and everything gets revised in place rather than reposted.
						Numbers in this field go stale in months, so an article that has not been
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
						If something here is wrong, it is worth telling me — open an issue on{" "}
						<a href={SITE.github}>GitHub</a>. Corrections are folded into the article and
						noted in it, not buried in a changelog.
					</p>
					<h2>The usual disclaimer, and it is a real one</h2>
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
