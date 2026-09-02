import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { articleSlugs, readArticle } from "../../lib/articles";
import { SITE } from "../../lib/site.mjs";

export const alt = "Article preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
	return articleSlugs().map((slug) => ({ slug }));
}

/**
 * Per-article social card. Rendered at build time via Satori, so there is no
 * runtime cost and no external image service. Deliberately typographic: the
 * title is the image, which is what actually gets read at thumbnail size.
 */
export default async function Image({ params }) {
	const { slug } = await params;
	if (!articleSlugs().includes(slug)) notFound();
	const { meta } = readArticle(slug);
	const title = meta.title ?? SITE.title;
	// Long titles need to step down or they overflow the card.
	const fontSize = title.length > 64 ? 60 : title.length > 44 ? 70 : 82;

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					background: "#fffdf9",
					padding: "72px 80px",
					fontFamily: "sans-serif",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
					<div style={{ width: 14, height: 14, borderRadius: 7, background: "#9a3412" }} />
					<div style={{ fontSize: 26, color: "#6b6459", letterSpacing: 1 }}>
						{SITE.name}
					</div>
				</div>

				<div
					style={{
						display: "flex",
						fontSize,
						lineHeight: 1.12,
						color: "#14110d",
						fontWeight: 700,
						letterSpacing: -1.5,
						maxWidth: 1000,
					}}
				>
					{title}
				</div>

				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
					<div style={{ fontSize: 26, color: "#6b6459" }}>{SITE.author}</div>
					<div style={{ display: "flex", gap: 10 }}>
						<div style={{ width: 60, height: 6, background: "#2a78d6" }} />
						<div style={{ width: 60, height: 6, background: "#eb6834" }} />
						<div style={{ width: 60, height: 6, background: "#1baf7a" }} />
					</div>
				</div>
			</div>
		),
		{ ...size },
	);
}
