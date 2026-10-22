import { OG_SIZE, ogCard } from "../../lib/og-card";
import { SITE } from "../../lib/site.mjs";

// A segment's opengraph-image does not cascade to child routes, so /about
// carries its own copy of the site card.
export const alt = SITE.title;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
	return ogCard(SITE.tagline);
}
