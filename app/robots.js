import { SITE } from "../lib/site.mjs";

// Everything here is public and written to be read and cited, so every crawler
// is welcome. The named groups make that stance explicit for the search,
// answer-engine and training crawlers that check for their own token
// (OpenAI, Anthropic, Perplexity, Google-Extended, Common Crawl), rather than
// leaving it implied by `*`. To opt out of one later, flip its group to
// `disallow: "/"`; the others are unaffected.
const AI_CRAWLERS = [
	"OAI-SearchBot",
	"ChatGPT-User",
	"GPTBot",
	"Claude-SearchBot",
	"Claude-User",
	"ClaudeBot",
	"PerplexityBot",
	"Perplexity-User",
	"Google-Extended",
	"CCBot",
];

export default function robots() {
	return {
		rules: [
			{ userAgent: "*", allow: "/" },
			{ userAgent: AI_CRAWLERS, allow: "/" },
		],
		sitemap: `${SITE.url}/sitemap.xml`,
	};
}
