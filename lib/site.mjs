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
	linkedin: "https://www.linkedin.com/in/junx6/",
	locale: "en",
};

// Result pages cut titles at about 60 characters. The layout's template adds this suffix; a page
// whose title would run past the limit with it drops the suffix instead (the site name still shows
// beside the result, from og:site_name and the Blog node). Titles are never cut or reworded.
export const TITLE_SUFFIX = ` — ${SITE.name}`;
export const TITLE_MAX = 60;

/** A page's metadata title: suffixed while it fits in TITLE_MAX characters, else the bare title. */
export function pageTitle(title) {
	return `${title}${TITLE_SUFFIX}`.length <= TITLE_MAX ? title : { absolute: title };
}

// Open Graph fields every page shares. Next replaces a parent's openGraph
// wholesale rather than merging it, so each page spreads these and adds its
// own url, which must come from the route (never the site root).
export const OPEN_GRAPH = {
	siteName: SITE.title,
	locale: "en_SG",
};

// The author as structured data. The @id is the Person node on junxiong.dev's
// own JSON-LD, so search and answer engines join these notes to that profile;
// sameAs mirrors the profile's list.
export const AUTHOR_LD = {
	"@type": "Person",
	"@id": `${SITE.authorUrl}/#person`,
	name: SITE.author,
	url: SITE.authorUrl,
	sameAs: [SITE.authorUrl, SITE.github, SITE.linkedin],
};
