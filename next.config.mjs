import fs from "node:fs";

// uipack is pinned to a git commit but keeps version 0.1.0, and webpack's
// persistent cache (which Vercel restores between deploys) treats node_modules
// as unchanged while their package versions match. Without this, a re-pin can
// ship the previous commit's uipack/charts.css. Key the cache on the commit.
const uipackCommit = (() => {
	try {
		return JSON.parse(fs.readFileSync("package-lock.json", "utf8")).packages["node_modules/uipack"].resolved.split("#")[1];
	} catch {
		return "unknown";
	}
})();

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
	webpack(config) {
		if (config.cache && typeof config.cache === "object") {
			config.cache.version = `${config.cache.version ?? ""}|uipack@${uipackCommit}`;
		}
		return config;
	},
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
