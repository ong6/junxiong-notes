import { SITE } from "../lib/site.mjs";

export default function robots() {
	return {
		rules: [{ userAgent: "*", allow: "/" }],
		sitemap: `${SITE.url}/sitemap.xml`,
		host: SITE.url,
	};
}
