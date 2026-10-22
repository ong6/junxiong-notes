import { ImageResponse } from "next/og";
import { SITE } from "./site.mjs";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * The social card shared by articles and the site's own pages. Rendered at
 * build time via Satori, so there is no runtime cost and no external image
 * service. Deliberately typographic: the title is the image, which is what
 * actually gets read at thumbnail size.
 */
export function ogCard(title) {
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
		{ ...OG_SIZE },
	);
}
