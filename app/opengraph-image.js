import { OG_SIZE, ogCard } from "../lib/og-card";
import { SITE } from "../lib/site.mjs";

// The card for the index and /about: the site's tagline on the shared card.
export const alt = SITE.title;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
	return ogCard(SITE.tagline);
}
