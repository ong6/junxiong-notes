"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The masthead's site name. On the index it is the page's one visible h1 (the
 * index has no title of its own); every other page has its own h1, so there it
 * stays a paragraph. Same look either way (.site-title in globals.css).
 */
export default function SiteTitle({ children }) {
	const Tag = usePathname() === "/" ? "h1" : "p";
	return <Tag className="site-title"><Link href="/">{children}</Link></Tag>;
}

/**
 * The masthead's tagline. Article pages hide it on phones (CSS: .masthead-tagline
 * [data-article]), so the article's title comes up sooner; the index and About keep it.
 */
export function SiteTagline({ children }) {
	const path = usePathname();
	const article = path !== "/" && path !== "/about";
	return <p className="masthead-tagline" data-article={article ? "" : undefined}>{children}</p>;
}
