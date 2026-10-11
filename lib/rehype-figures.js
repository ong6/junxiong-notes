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

/** "caption text | Source: …" as figcaption children, the source as its own credit line. */
function captionKids(caption) {
	const [captionText, ...rest] = caption.split("|");
	const source = rest.join("|").trim();
	const kids = [text(captionText.trim())];
	if (source) kids.push(el("span", { className: ["fig-source"] }, [text(source)]));
	return kids;
}

function walk(node, fn) {
	fn(node);
	for (const child of node.children ?? []) walk(child, fn);
}

/**
 * ```span and ```stack fences: responsive HTML charts (uipack/charts) rendered
 * by scripts/render-charts.tsx. They reflow instead of scaling, so they get no
 * swipe box, full-size link or motion control; the caption stays outside the
 * component, in the site's usual figcaption.
 */
function chartFigure(lang, id, caption) {
	const file = `${id}.html`;
	if (!fs.existsSync(path.join(DIR, file))) {
		throw new Error(`\`\`\`${lang} fence: content/diagrams/${file} is missing. Run \`npm run diagrams\`.`);
	}
	const chart = svgTree(read(file));
	const figureKids = [el("div", { className: ["fig-media"] }, chart)];
	if (caption) figureKids.push(el("figcaption", {}, captionKids(caption)));
	return el("div", { className: ["fig", "fig-html", `fig-${lang}`] }, [el("figure", {}, figureKids)]);
}

/**
 * Every in-page link inside a chart must land on an element of the rendered
 * article (rehype-slug heading ids, or the chart's own ids), and no chart id may
 * collide with one outside it. Either mistake would ship a dead or wrong link.
 */
function checkCharts(tree, charts) {
	const outside = new Set();
	const inside = new Set();
	const chartNodes = new Set();
	for (const chart of charts) walk(chart, (n) => chartNodes.add(n));
	walk(tree, (n) => {
		const id = n.properties?.id;
		if (!id) return;
		(chartNodes.has(n) ? inside : outside).add(String(id));
	});
	for (const chart of charts) {
		const name = chart.children[0]?.children[0]?.children?.find((c) => c.properties?.id)?.properties.id ?? "chart";
		walk(chart, (n) => {
			const id = n.properties?.id;
			if (id && outside.has(String(id))) throw new Error(`Chart "${name}": id "${id}" is also used elsewhere in the article. Rename the data file or the heading.`);
			const href = n.properties?.href;
			if (typeof href !== "string" || !href.startsWith("#")) return;
			const target = decodeURIComponent(href.slice(1));
			if (!outside.has(target) && !inside.has(target)) {
				throw new Error(`Chart "${name}": link "${href}" matches no heading in the article. Headings: ${[...outside].map((h) => `#${h}`).join(", ")}`);
			}
		});
	}
}

export default function rehypeFigures() {
	return (tree) => {
		const charts = [];
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "pre" || !parent || index === null) return;
			const code = node.children?.find((c) => c.tagName === "code");
			const cls = code?.properties?.className ?? [];
			if (!Array.isArray(cls)) return;
			const chartLang = ["span", "stack"].find((lang) => cls.includes(`language-${lang}`));
			if (chartLang) {
				const body = code.children?.map((c) => c.value ?? "").join("") ?? "";
				const figure = chartFigure(chartLang, hash(chartLang + body), code.data?.meta?.trim());
				parent.children[index] = figure;
				charts.push(figure);
				return "skip";
			}
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
				figureKids.push(el("figcaption", {}, captionKids(caption)));
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
		if (charts.length) checkCharts(tree, charts);
	};
}
