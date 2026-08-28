import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { visit } from "unist-util-visit";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";

/**
 * Swaps ```d2 and ```vega-lite fences for the SVG that scripts/render-diagrams.mjs
 * already produced. Reading a committed file keeps this step synchronous, and a
 * missing file is a build error rather than a silently blank figure.
 *
 * Vega-Lite is rendered twice, once per theme; both are inlined and CSS shows
 * the right one. D2 carries both palettes inside a single SVG already.
 */
const DIR = path.join(process.cwd(), "content", "diagrams");
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);

function svgTree(file) {
	const raw = fs.readFileSync(path.join(DIR, file), "utf8");
	const frag = fromHtmlIsomorphic(raw, { fragment: true });
	return frag.children.filter((c) => c.type === "element");
}

export default function rehypeFigures() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "pre" || !parent || index === null) return;
			const code = node.children?.find((c) => c.tagName === "code");
			const cls = code?.properties?.className ?? [];
			if (!Array.isArray(cls)) return;
			const isD2 = cls.includes("language-d2");
			const isVL = cls.includes("language-vega-lite");
			if (!isD2 && !isVL) return;

			const body = code.children?.map((c) => c.value ?? "").join("") ?? "";
			const id = hash((isD2 ? "d2" : "vega-lite") + body);
			const caption = code.data?.meta?.trim();

			let children;
			if (isD2) {
				children = [
					{
						type: "element",
						tagName: "div",
						properties: { className: ["fig-svg", `d2-${id}`] },
						children: svgTree(`${id}.svg`),
					},
				];
			} else {
				children = [
					{ type: "element", tagName: "div", properties: { className: ["fig-svg", "fig-light"] }, children: svgTree(`${id}.light.svg`) },
					{ type: "element", tagName: "div", properties: { className: ["fig-svg", "fig-dark"] }, children: svgTree(`${id}.dark.svg`) },
				];
			}

			if (caption) {
				// "caption text | Source: …" — the part after the pipe is rendered as a
				// separate credit line so every figure can be traced without the
				// citation competing with the point the figure is making.
				const [text, ...rest] = caption.split("|");
				const source = rest.join("|").trim();
				const capKids = [{ type: "text", value: text.trim() }];
				if (source) {
					capKids.push({
						type: "element",
						tagName: "span",
						properties: { className: ["fig-source"] },
						children: [{ type: "text", value: source }],
					});
				}
				children.push({
					type: "element",
					tagName: "figcaption",
					properties: {},
					children: capKids,
				});
			}

			parent.children[index] = {
				type: "element",
				tagName: "figure",
				properties: { className: ["fig", isD2 ? "fig-diagram" : "fig-chart"] },
				children,
			};
		});
	};
}
