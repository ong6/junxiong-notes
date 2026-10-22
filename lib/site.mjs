export const SITE = {
	url: "https://notes.junxiong.dev",
	title: "Ong Jun Xiong — Notes",
	name: "notes.junxiong.dev",
	tagline: "Working notes on software, AI and building a career around both.",
	description:
		"Working notes on software, AI systems and engineering careers, about things I build, try and want to understand.",
	author: "Ong Jun Xiong",
	authorUrl: "https://junxiong.dev",
	github: "https://github.com/ong6",
	locale: "en",
};

// Open Graph fields every page shares. Next replaces a parent's openGraph
// wholesale rather than merging it, so each page spreads these and adds its
// own url, which must come from the route (never the site root).
export const OPEN_GRAPH = {
	siteName: SITE.title,
	locale: "en_SG",
};
