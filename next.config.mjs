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

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	webpack(config) {
		if (config.cache && typeof config.cache === "object") {
			config.cache.version = `${config.cache.version ?? ""}|uipack@${uipackCommit}`;
		}
		return config;
	},
	async headers() {
		return [
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
