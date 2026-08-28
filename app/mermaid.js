"use client";

import { useEffect } from "react";

/**
 * Renders any ```mermaid fence on the page.
 *
 * Mermaid is imported dynamically and only when the page actually contains a
 * diagram, so articles without one never pay for the bundle. Until it loads,
 * the raw diagram source stays visible in the DOM — which is also what a
 * crawler or an agent reading the HTML sees, and it matches the markdown
 * served at /raw/<slug>.md.
 */
export default function Mermaid() {
	useEffect(() => {
		const blocks = document.querySelectorAll("pre.mermaid-src");
		if (!blocks.length) return;
		let cancelled = false;

		const dark =
			document.documentElement.dataset.theme === "dark" ||
			(document.documentElement.dataset.theme !== "light" &&
				window.matchMedia("(prefers-color-scheme: dark)").matches);

		import("mermaid").then(({ default: mermaid }) => {
			if (cancelled) return;
			const css = getComputedStyle(document.body);
			const v = (n, f) => css.getPropertyValue(n).trim() || f;
			mermaid.initialize({
				startOnLoad: false,
				securityLevel: "strict",
				theme: "base",
				fontFamily: v("--sans", "system-ui, sans-serif"),
				themeVariables: {
					background: v("--bg", "#fff"),
					primaryColor: v("--surface", "#f6f2ea"),
					primaryTextColor: v("--text", "#14110d"),
					primaryBorderColor: dark ? "#3987e5" : "#2a78d6",
					lineColor: v("--muted", "#6b6459"),
					secondaryColor: v("--accent-soft", "#f0e5dc"),
					tertiaryColor: v("--bg", "#fff"),
					fontSize: "14px",
				},
			});
			blocks.forEach(async (el, i) => {
				const src = el.textContent ?? "";
				try {
					const { svg } = await mermaid.render(`mmd-${i}`, src);
					if (cancelled) return;
					const fig = document.createElement("figure");
					fig.className = "mermaid-figure";
					fig.innerHTML = svg;
					const cap = el.dataset.caption;
					if (cap) {
						const fc = document.createElement("figcaption");
						fc.textContent = cap;
						fig.appendChild(fc);
					}
					el.replaceWith(fig);
				} catch {
					// Leave the source block in place: a broken diagram should still
					// show its own definition rather than vanishing.
					el.classList.add("mermaid-failed");
				}
			});
		});

		return () => {
			cancelled = true;
		};
	}, []);

	return null;
}
