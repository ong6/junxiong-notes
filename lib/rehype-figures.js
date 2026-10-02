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
 * Vega-Lite and uipack are rendered twice, once per theme; both are inlined and
 * CSS shows the right one. D2 carries both palettes inside a single SVG already.
 */
const DIR = path.join(process.cwd(), "content", "diagrams");
const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);

// On phones a wide drawing keeps its layout and scrolls sideways inside its own
// box, at whatever width brings its smallest label up to this size.
const PHONE_LABEL_FLOOR = 11;

function svgTree(raw) {
	const frag = fromHtmlIsomorphic(raw, { fragment: true });
	return frag.children.filter((c) => c.type === "element");
}

const read = (file) => fs.readFileSync(path.join(DIR, file), "utf8");
const el = (tagName, properties, children = []) => ({ type: "element", tagName, properties, children });
const text = (value) => ({ type: "text", value });

/** Width (px) at which the smallest label in `raw` renders at the floor. */
function phoneWidth(raw) {
	const vb = raw.match(/viewBox="[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+[\d.]+"/);
	const sizes = [...raw.matchAll(/font-size(?:="|:\s*)([\d.]+)/g)].map((m) => Number(m[1])).filter((n) => n > 0);
	if (!vb || !sizes.length) return null;
	return Math.ceil((Number(vb[1]) * PHONE_LABEL_FLOOR) / Math.min(...sizes));
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
			const isUI = cls.includes("language-uipack");
			if (!isD2 && !isVL && !isUI) return;

			const body = code.children?.map((c) => c.value ?? "").join("") ?? "";
			const id = hash((isD2 ? "d2" : isUI ? "uipack" : "vega-lite") + body);
			const caption = code.data?.meta?.trim();

			// Desktop drawings, then (for uipack figures that have one) the phone
			// composition. CSS shows exactly one: the theme's, at the viewport's width.
			const desktopFiles = isD2 ? [[`${id}.svg`, []]] : [[`${id}.light.svg`, ["fig-light"]], [`${id}.dark.svg`, ["fig-dark"]]];
			const hasMobile = isUI && fs.existsSync(path.join(DIR, `${id}.mobile.light.svg`));
			const desktopRaw = desktopFiles.map(([file]) => read(file));
			const drawings = desktopFiles.map(([, theme], i) =>
				el("div", { className: ["fig-svg", ...theme, ...(hasMobile ? ["fig-desktop"] : [])] }, svgTree(desktopRaw[i])),
			);

			let media;
			let swipe = null;
			if (hasMobile) {
				drawings.push(
					el("div", { className: ["fig-svg", "fig-light", "fig-mobile"] }, svgTree(read(`${id}.mobile.light.svg`))),
					el("div", { className: ["fig-svg", "fig-dark", "fig-mobile"] }, svgTree(read(`${id}.mobile.dark.svg`))),
				);
				media = el("div", { className: ["fig-media"] }, drawings);
			} else {
				// No phone composition: scroll sideways on phones rather than shrink labels.
				const minWidth = phoneWidth(desktopRaw[0]);
				media = el("div", { className: ["fig-media"] }, [
					el("div", { className: ["fig-scroll"], ...(minWidth ? { style: `--fig-phone-w: ${minWidth}px` } : {}) }, drawings),
				]);
				swipe = el("div", { className: ["fig-swipe"], ariaHidden: "true" }, [text(`Swipe to see the whole ${isVL ? "chart" : "diagram"} →`)]);
			}

			const figureKids = [media];
			if (swipe) figureKids.push(swipe);
			if (caption) {
				// "caption text | Source: …" — the part after the pipe is rendered as a
				// separate credit line so every figure can be traced without the
				// citation competing with the point the figure is making.
				const [captionText, ...rest] = caption.split("|");
				const source = rest.join("|").trim();
				const capKids = [text(captionText.trim())];
				if (source) capKids.push(el("span", { className: ["fig-source"] }, [text(source)]));
				figureKids.push(el("figcaption", {}, capKids));
			}

			// Controls sit after the <figure>, so the caption stays directly under the
			// drawing and remains the figure's last child. A narrow preview must not be
			// the only way to read a dense figure: link the full-size file in the
			// reader's current theme (CSS hides the other link).
			const actions = desktopFiles.map(([file, theme]) =>
				el("a", { className: ["figure-fullsize", ...theme], href: `/figures/${file}` }, [text("Open full-size figure")]),
			);
			if (desktopRaw[0].includes("<animate")) {
				actions.push(el("button", { type: "button", disabled: true, className: ["figure-motion"], "data-figure-motion": "" }, [text("Pause diagram")]));
			}

			// uipack figures are themed like charts (two files) and sized like diagrams.
			const kind = isD2 ? ["fig-diagram"] : isUI ? ["fig-diagram", "fig-themed"] : ["fig-chart", "fig-themed"];
			parent.children[index] = el("div", { className: ["fig", ...kind] }, [
				el("figure", {}, figureKids),
				el("div", { className: ["fig-actions"] }, actions),
			]);
		});
	};
}
