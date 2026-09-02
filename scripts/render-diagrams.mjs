/**
 * Pre-renders every ```d2 and ```vega-lite fence to a committed SVG.
 *
 * Rendering happens once here rather than inside the markdown pipeline, so
 * page builds stay synchronous and fast, and so an upstream layout change in
 * D2 shows up as a reviewable diff instead of silently redrawing the site.
 * Output is keyed by a hash of the fence body: edit the source, get a new file.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { D2 } from "@terrastruct/d2";
import * as vega from "vega";
import { compile } from "vega-lite";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "content", "articles");
const OUT = path.join(ROOT, "content", "diagrams");
fs.mkdirSync(OUT, { recursive: true });

const hash = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 16);

/* ---------- palette, shared with globals.css ---------- */
const INK = { light: "#14110d", dark: "#ece7de" };
const MUTED = { light: "#6b6459", dark: "#9d9488" };
const FAINT = { light: "#d9d2c5", dark: "#3a352f" };
const SERIES = {
	light: ["#2a78d6", "#eb6834", "#1baf7a"],
	dark: ["#3987e5", "#d95926", "#199e70"],
};
const SERIES_SOFT = {
	light: ["#e4edf9", "#fbe8de", "#e0f4ec"],
	dark: ["#1b2b3f", "#3a2117", "#12302a"],
};
const SANS =
	"ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, Helvetica, Arial, sans-serif";

/* ---------- D2 ---------- */
const d2 = new D2();

/**
 * D2 paints an opaque page background and ships its own webfont. Both fight
 * the site, so strip them and let the article's surface show through.
 */
function cleanD2(svg, id) {
	let out = svg;
	// D2 ships its own webfont as base64 and paints an opaque white page rect.
	// Both fight the article surface, so drop them.
	out = out.replace(/@font-face\s*{[^}]*}/g, "");
	out = out.replace(/<rect[^>]*class="[^"]*fill-N7[^"]*"[^>]*stroke-width="0"[^>]*\/>/g, "");
	// The inner <svg> carries a fixed width/height that pins the diagram to its
	// layout size; removing them lets the outer viewBox scale it to the column.
	out = out.replace(/(<svg class="[^"]*d2-svg"[^>]*?)\s+width="\d+"\s+height="\d+"/, "$1");
	// Three rules ship unscoped and would leak into the rest of the page.
	for (const rule of ["shape", "connection", "blend"]) {
		out = out.replace(new RegExp(`(^|[},])\\s*\\.${rule}\\s*{`, "gm"), `$1 .fig-diagram .${rule} {`);
	}
	// Force the site's own type onto every label, overriding the stripped webfont.
	const fontRule = `<style type="text/css"><![CDATA[
.fig-diagram text, .fig-diagram .text, .fig-diagram .text-bold, .fig-diagram .text-italic {
  font-family: ${SANS} !important;
}
.fig-diagram .text-bold { font-weight: 600; }
.fig-diagram .text-italic { font-style: italic; font-weight: 400; }
]]></style>`;
	out = out.replace("</svg>", `${fontRule}</svg>`);
	return out;
}

/**
 * Every figure is displayed at one width, so a narrow diagram gets upscaled more
 * than a wide one and its labels come out visibly bigger — 23px next to 17px.
 * Widening the viewBox horizontally (and only horizontally) equalises the scale
 * factor without adding the dead vertical space a uniform pad would.
 */
const D2_CANVAS = 1080;

function normaliseWidth(svg) {
	const m = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
	if (!m) return svg;
	const w = Number(m[1]);
	if (w >= D2_CANVAS) return svg;
	const dx = (D2_CANVAS - w) / 2;
	// Shift the origin left by half the gap so the drawing stays centred.
	return svg.replace(m[0], `viewBox="${-dx} 0 ${D2_CANVAS} ${m[2]}"`);
}

async function renderD2(src, id) {
	const r = await d2.compile(src, { layout: "elk", themeID: 0, darkThemeID: 200 });
	const svg = await d2.render(r.diagram, {
		...r.renderOptions,
		themeID: 0,
		darkThemeID: 200,
		noXMLTag: true,
		pad: 8,
		salt: id,
	});
	return normaliseWidth(cleanD2(svg, id));
}

/* ---------- Vega-Lite ---------- */
/**
 * One config for every chart so they read as a set. Colours are the validated
 * categorical slots; the light steps fall below 3:1 on this site's surface, so
 * charts must carry direct labels or a visible axis rather than relying on hue.
 */
function vlConfig(mode) {
	const ink = INK[mode];
	const muted = MUTED[mode];
	return {
		background: null,
		font: SANS,
		padding: 6,
		view: { stroke: null },
		range: { category: SERIES[mode] },
		axis: {
			labelColor: muted, titleColor: muted, domainColor: FAINT[mode],
			tickColor: FAINT[mode], gridColor: FAINT[mode], gridOpacity: 0.55,
			labelFontSize: 14, titleFontSize: 14, titleFontWeight: 500, labelFont: SANS,
			titleFont: SANS, titlePadding: 16,
			// 0 disables truncation. An elided label ("Claude 3.5 Sonnet (base 87…")
			// is worse than a narrower plot, and autosize gives the labels their room.
			labelLimit: 0,
		},
		legend: {
			labelColor: ink, titleColor: muted, labelFontSize: 13.5, titleFontSize: 13,
			labelFont: SANS, titleFont: SANS, symbolType: "square", symbolSize: 100,
			labelLimit: 0,
			// Anchored bottom-left: the default top-right corner sits inside the plot
			// and covered the longest bar's value label on every grouped chart.
			orient: "bottom", direction: "horizontal", columns: 0,
			offset: 14, labelOffset: 6, symbolStrokeWidth: 0, titlePadding: 0,
		},
		title: {
			color: ink, fontSize: 17, fontWeight: 600, font: SANS,
			anchor: "start", offset: 18, subtitleColor: muted, subtitleFontSize: 13, subtitleLineHeight: 18,
			subtitleFont: SANS,
		},
		// A channel-level axis config beats the shared `axis` block, so labelLimit
		// has to be repeated here or long y-labels truncate mid-word regardless.
		// A channel-level axis config beats the shared `axis` block, so this has to
		// be repeated here or long y-labels truncate regardless of the above.
		axisY: { labelLimit: 0, labelFont: SANS, labelFontSize: 14, labelColor: ink, labelPadding: 10 },
		axisX: { labelLimit: 0 },
		text: { color: ink, font: SANS, fontSize: 14 },
		bar: { cornerRadiusEnd: 3, height: 30 },
		point: { size: 70, filled: true },
		line: { strokeWidth: 2 },
	};
}

/**
 * Wraps a long title or subtitle onto multiple lines.
 *
 * With autosize "fit", the title is part of the width budget: a 210-character
 * subtitle demands ~1100px inside a 620px chart, and Vega resolves that by
 * collapsing the plot area to zero width — the bars silently vanish while the
 * axis and labels still draw. Wrapping keeps the budget satisfiable.
 */
function wrapTitle(t, max) {
	if (typeof t !== "string" || t.length <= max) return t;
	const lines = [];
	let line = "";
	for (const word of t.split(" ")) {
		if ((line + " " + word).trim().length > max) { lines.push(line.trim()); line = word; }
		else line += " " + word;
	}
	if (line.trim()) lines.push(line.trim());
	return lines;
}

async function renderVegaLite(spec, mode) {
	const title =
		spec.title && typeof spec.title === "object"
			? { ...spec.title, text: wrapTitle(spec.title.text, 88), subtitle: wrapTitle(spec.title.subtitle, 118) }
			: wrapTitle(spec.title, 88);
	const merged = {
		width: 900,
		autosize: { type: "fit", contains: "padding" },
		...spec,
		...(title ? { title } : {}),
		config: { ...vlConfig(mode), ...(spec.config ?? {}) },
	};
	const vgSpec = compile(merged).spec;
	const view = new vega.View(vega.parse(vgSpec), { renderer: "none" });
	const svg = await view.toSVG();
	// A chart whose plot area collapsed still renders its axes and labels, so the
	// failure is invisible in a build log and easy to miss in review. Catch it here.
	const bars = svg.match(/aria-roledescription="bar"[^>]*/g) ?? [];
	const flat = bars.filter((b) => /d="M0,0h0v[\d.]+h0Z"/.test(b));
	if (bars.length && flat.length === bars.length) {
		throw new Error(
			`Every bar rendered zero-width in "${spec.title?.text ?? spec.title ?? "untitled"}" (${mode}). ` +
				`The plot area collapsed — usually a title or subtitle too long for the width budget.`,
		);
	}
	return svg;
}

/* ---------- walk ---------- */
const FENCE = /^```(d2|vega-lite)(?:[ \t]+([^\n]*))?\n([\s\S]*?)^```/gm;
const seen = new Set();
let rendered = 0;
let cached = 0;

const files = fs.existsSync(SRC) ? fs.readdirSync(SRC) : [];
for (const file of files.filter((f) => f.endsWith(".md") && !f.startsWith("_"))) {
	const text = fs.readFileSync(path.join(SRC, file), "utf8");
	for (const m of text.matchAll(FENCE)) {
		const [, lang, , body] = m;
		const id = hash(lang + body);
		if (lang === "d2") {
			seen.add(`${id}.svg`);
			if (fs.existsSync(path.join(OUT, `${id}.svg`))) { cached++; continue; }
			fs.writeFileSync(path.join(OUT, `${id}.svg`), await renderD2(body, id));
			rendered++;
		} else {
			let spec;
			try { spec = JSON.parse(body); }
			catch (e) { throw new Error(`Invalid JSON in a vega-lite block in ${file}: ${e.message}`); }
			for (const mode of ["light", "dark"]) {
				const name = `${id}.${mode}.svg`;
				seen.add(name);
				if (fs.existsSync(path.join(OUT, name))) { cached++; continue; }
				fs.writeFileSync(path.join(OUT, name), await renderVegaLite(spec, mode));
				rendered++;
			}
		}
	}
}

// Drop SVGs whose source fence is gone, so the directory never accumulates orphans.
let pruned = 0;
for (const f of fs.readdirSync(OUT).filter((f) => f.endsWith(".svg"))) {
	if (!seen.has(f)) { fs.unlinkSync(path.join(OUT, f)); pruned++; }
}

console.log(`diagrams: ${rendered} rendered, ${cached} cached, ${pruned} pruned`);
// The D2 wasm worker keeps the event loop alive; without this the build hangs.
process.exit(0);
