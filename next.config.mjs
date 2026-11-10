// Every page is static and self-hosted: no analytics, embeds, webfonts or
// third-party images. 'unsafe-inline' scripts cover Next's inline payload and
// the theme, TOC and JSON-LD scripts (a static site has no per-request nonce);
// inline styles cover the pre-rendered SVG/HTML figures. `next dev` needs eval.
const CSP = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob:",
	"font-src 'self'",
	"connect-src 'self'",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
	{ key: "Content-Security-Policy", value: CSP },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
	{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	// Builds use Turbopack, whose build cache is keyed on file content, so a
	// uipack re-pin needs no cache-version hook (webpack's cache did).
	// AGENTS.md is hand-written; stop `next dev` adding its managed block.
	agentRules: false,
	async headers() {
		return [
			// First, so the per-path rules below win if they ever set the same key
			// (Next applies every matching rule; a later duplicate key overrides).
			{ source: "/(.*)", headers: SECURITY_HEADERS },
			{
				// Raw markdown is the agent-facing surface: let anything read it.
				source: "/raw/:path*",
				headers: [
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{ key: "Content-Type", value: "text/markdown; charset=utf-8" },
				],
			},
			{
				source: "/llms.txt",
				headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
			},
			{
				source: "/llms-full.txt",
				headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
			},
		];
	},
};
export default nextConfig;
