/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
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
