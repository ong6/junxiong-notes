/**
 * Pre-renders every ```d2 and ```vega-lite fence to a committed SVG, ```uipack
 * fences through scripts/render-figures.tsx, and ```span / ```stack chart fences
 * to committed HTML through scripts/render-charts.tsx.
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
import { execFileSync } from "node:child_process";

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
	// The light green is the diagrams' green (--fig-accent): #1baf7a was 2.77:1
	// on the paper, under the 3:1 a mark needs; #0f7a55 is 5.25:1.
	light: ["#2a78d6", "#eb6834", "#0f7a55"],
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
		// Flat ends, like the span chart and the diagrams' square marks.
		bar: { cornerRadiusEnd: 0, height: 30 },
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

/* ---------- phone drawings of charts ---------- */
/**
 * Every chart also gets a phone drawing, laid out for the 350px column a 390px
 * phone gives the article (lib/rehype-figures.js shows it at 600px and below),
 * so nothing needs a sideways swipe. The data, marks and colours are the
 * desktop spec's; only the layout changes:
 *
 * - Bar and dot charts with a category axis lose the label column: each
 *   category's label sits above its bar (or group of bars), so the plot gets
 *   the whole width, and the value stays at the bar's end.
 * - Charts with two numeric axes keep their layout at the phone width; point
 *   labels on the right half of the plot are set right-aligned so they stay
 *   inside it.
 * - Legends become one item per line, under the chart.
 *
 * A chart whose phone drawing still does not fit (see phoneFits) keeps the
 * desktop drawing and scrolls sideways, as before.
 */
const PHONE = { width: 350, title: 34, subtitle: 48, label: 20, bar: 20, sub: 18, gap: 18 };

const clone = (o) => JSON.parse(JSON.stringify(o));
const layersOf = (spec) => spec.layer ?? [spec];

/** The category (y) field of a horizontal chart: nominal y, numeric x. */
function categoryAxis(spec) {
	for (const layer of [spec, ...(spec.layer ?? [])]) {
		const enc = layer.encoding ?? {};
		if (enc.y?.type === "nominal" && enc.y.field) return { y: enc.y, x: enc.x ?? spec.encoding?.x };
	}
	return null;
}

function phoneCategorySpec(spec, mode) {
	const out = clone(spec);
	const { y, x } = categoryAxis(out);
	// "-x" / "x" sorts by the bar's value; the label layer has no x field, so it
	// names the field to sort by instead.
	const labelSort = typeof y.sort === "string" && /^-?x$/.test(y.sort) ? { field: x.field, op: "sum", order: y.sort.startsWith("-") ? "descending" : "ascending" } : (y.sort ?? null);
	const enc = out.encoding ?? {};
	// A grouped chart (yOffset) draws one bar per series inside each category.
	const offset = [out, ...(out.layer ?? [])].map((l) => l.encoding?.yOffset).find((o) => o?.field);
	const data = out.data?.values ?? out.layer?.flatMap((l) => l.data?.values ?? []) ?? [];
	const groups = offset ? Math.max(1, new Set(data.map((d) => d[offset.field]).filter((v) => v !== undefined)).size) : 1;
	const barsH = offset ? groups * PHONE.sub : PHONE.bar;
	const step = PHONE.label + barsH + PHONE.gap;
	const top = PHONE.label + 2; // where the bars start inside each band

	// Bands with no padding; the label, the bars and a gap share each one.
	const yScale = { ...(y.scale ?? {}), paddingInner: 0, paddingOuter: 0 };
	for (const layer of [out, ...(out.layer ?? [])]) {
		const e = layer.encoding;
		if (e?.y && e.y.field === y.field) e.y = { ...e.y, axis: null, scale: yScale };
		if (layer.mark && (layer.mark.type ?? layer.mark) === "bar") {
			layer.mark = { ...(typeof layer.mark === "object" ? layer.mark : { type: "bar" }), height: offset ? PHONE.sub - 4 : PHONE.bar };
		}
	}
	if (offset) {
		// Bars of a group sit under the label, one per series.
		const range = [top, top + barsH];
		for (const layer of [out, ...(out.layer ?? [])]) {
			const e = layer.encoding;
			if (e?.yOffset?.field) e.yOffset = { ...e.yOffset, scale: { ...(e.yOffset.scale ?? {}), range, paddingInner: 0.15 } };
		}
	} else {
		// One bar: centre it below the label, through a pixel offset on every mark
		// that sits on the category axis (bars, values, dots).
		const shift = top + PHONE.bar / 2 - step / 2;
		for (const layer of [out, ...(out.layer ?? [])]) {
			if (!layer.mark) continue;
			layer.encoding = { ...(layer.encoding ?? {}), yOffset: { value: shift } };
		}
	}
	// The category label above each band, at the plot's left edge.
	const labelData = out.data ? undefined : { values: [...new Map(data.filter((d) => d[y.field] !== undefined).map((d) => [d[y.field], d])).values()] };
	const label = {
		...(labelData ? { data: labelData } : {}),
		mark: { type: "text", align: "left", baseline: "top", fontSize: 14, fontWeight: 500, color: INK[mode] },
		encoding: {
			// Text sits on the band's centre (or, in a chart with a yOffset field, on
			// the band's start); the offset moves it to the band's top.
			yOffset: { value: offset ? 2 : 2 - step / 2 },
			y: { field: y.field, type: "nominal", sort: labelSort, axis: null, scale: yScale },
			x: { value: 0 },
			text: { field: y.field, type: "nominal" },
		},
	};
	const layers = out.layer ?? [{ mark: out.mark, encoding: {} }];
	if (!out.layer) delete out.mark;
	out.layer = [...layers, label];
	// "for: position": with a yOffset the plain step would size each sub-bar instead.
	out.height = { step, for: "position" };
	if (enc.y) enc.y = { ...enc.y, axis: null, scale: yScale };
	return out;
}

function phoneNumericSpec(spec) {
	const out = clone(spec);
	const x = out.encoding?.x;
	const dom = x?.scale?.domain;
	if (!out.layer || !Array.isArray(dom)) return out;
	const mid = (dom[0] + dom[1]) / 2;
	out.layer = out.layer.flatMap((layer) => {
		const m = layer.mark;
		if (typeof m !== "object" || m.type !== "text" || m.align !== "left") return [layer];
		const right = { ...layer, mark: { ...m, align: "right", dx: -(m.dx ?? 0) }, transform: [...(layer.transform ?? []), { filter: `datum['${x.field}'] > ${mid}` }] };
		const left = { ...layer, transform: [...(layer.transform ?? []), { filter: `datum['${x.field}'] <= ${mid}` }] };
		return [left, right];
	});
	return out;
}

function phoneSpec(spec, mode) {
	const out = categoryAxis(spec) ? phoneCategorySpec(spec, mode) : phoneNumericSpec(spec);
	delete out.width;
	return out;
}

/** A phone drawing must be phone-sized and keep at least 45% of the width for its plot. */
function phoneFits(view, svg) {
	const w = Number(svg.match(/<svg[^>]*\swidth="([\d.]+)"/)?.[1] ?? Infinity);
	return w <= PHONE.width + 1 && view.width() >= PHONE.width * 0.45;
}

async function renderVegaLite(input, mode, phone = false) {
	const spec = phone ? phoneSpec(input, mode) : input;
	const wrap = phone ? PHONE : { title: 88, subtitle: 118 };
	const title =
		spec.title && typeof spec.title === "object"
			? { ...spec.title, text: wrapTitle(spec.title.text, wrap.title), subtitle: wrapTitle(spec.title.subtitle, wrap.subtitle) }
			: wrapTitle(spec.title, wrap.title);
	const config = { ...vlConfig(mode), ...(spec.config ?? {}) };
	// One legend item per line, so long series names never run off the phone.
	// The title sits on the plot's left edge (frame "group"), the same edge as the
	// category labels.
	if (phone) {
		config.legend = { ...config.legend, orient: "bottom", direction: "vertical", columns: 1 };
		config.title = { ...config.title, frame: "group" };
		// A long axis title starts at the plot's left edge instead of centring, so
		// it never widens the chart past the plot.
		config.axisX = { ...config.axisX, titleAnchor: "start", titleAlign: "left" };
	}
	const merged = {
		width: phone ? PHONE.width : 900,
		autosize: { type: "fit", contains: "padding" },
		...spec,
		...(phone ? { width: PHONE.width } : {}),
		...(title ? { title } : {}),
		config,
	};
	if (phone) {
		// Legends set on an encoding override the config; make those vertical too.
		for (const layer of [merged, ...(merged.layer ?? [])]) {
			const c = layer.encoding?.color;
			if (c?.legend) c.legend = { ...c.legend, orient: "bottom", direction: "vertical", columns: 1 };
		}
	}
	const vgSpec = compile(merged).spec;
	const view = new vega.View(vega.parse(vgSpec), { renderer: "none" });
	const svg = await view.toSVG();
	// A chart whose plot area collapsed still renders its axes and labels, so the
	// failure is invisible in a build log and easy to miss in review. Catch it here.
	const bars = svg.match(/aria-roledescription="bar"[^>]*/g) ?? [];
	const flat = bars.filter((b) => /d="M0,0h0v[\d.]+h0Z"/.test(b));
	if (bars.length && flat.length === bars.length) {
		if (phone) return null;
		throw new Error(
			`Every bar rendered zero-width in "${spec.title?.text ?? spec.title ?? "untitled"}" (${mode}). ` +
				`The plot area collapsed — usually a title or subtitle too long for the width budget.`,
		);
	}
	if (phone && !phoneFits(view, svg)) return null;
	return svg;
}

/* ---------- walk ---------- */
const FENCE = /^```(d2|vega-lite|uipack|span|stack|notes)(?:[ \t]+([^\n]*))?\n([\s\S]*?)^```/gm;
const figureJobs = [];
const chartJobs = [];
const seen = new Set();
let rendered = 0;
let cached = 0;

const files = fs.existsSync(SRC) ? fs.readdirSync(SRC) : [];
for (const file of files.filter((f) => f.endsWith(".md") && !f.startsWith("_"))) {
	const text = fs.readFileSync(path.join(SRC, file), "utf8");
	// A chart's id is its data file's name, and ids must be unique on a page.
	const chartNames = new Set();
	for (const m of text.matchAll(FENCE)) {
		const [, lang, meta, body] = m;
		const id = hash(lang + body);
		if (lang === "notes") {
			// A cluster of note cards: the label is the fence's caption, each body line is
			// `slug: kicker`. Always rendered, because titles and descriptions come from
			// the linked articles' frontmatter, which the hash cannot see.
			seen.add(`${id}.html`);
			chartJobs.push({ id, kind: "notes", label: (meta ?? "").trim(), body });
			continue;
		}
		if (lang === "span" || lang === "stack") {
			// The body names a data file under content/data/; scripts/render-charts.tsx
			// renders it to responsive HTML (uipack/charts) after the walk. Always
			// rendered, like uipack figures: the hash cannot see an edit to the YAML.
			const name = body.trim();
			if (chartNames.has(name)) throw new Error(`${file}: two chart fences name "${name}"; each data file can appear once per article`);
			chartNames.add(name);
			seen.add(`${id}.html`);
			// A stack whose data sets `sectionHeads` also writes one header strip per
			// section it links to (empty for other stacks).
			if (lang === "stack") seen.add(`${id}.heads.json`);
			chartJobs.push({ id, kind: lang, name });
			continue;
		}
		if (lang === "uipack") {
			// The body names a module under content/figures/; both themes are
			// rendered by scripts/render-figures.tsx (uipack/static) after the walk.
			// Always rendered: the fence body is only a module name, so the hash
			// cannot see an edit inside content/figures/. Rendering is deterministic
			// and fast, so a stale file never ships.
			const name = body.trim();
			for (const mode of ["light", "dark"]) seen.add(`${id}.${mode}.svg`);
			figureJobs.push({ id, name });
			continue;
		}
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
				if (fs.existsSync(path.join(OUT, name))) cached++;
				else { fs.writeFileSync(path.join(OUT, name), await renderVegaLite(spec, mode)); rendered++; }
				// The phone drawing. A chart with none keeps scrolling on phones.
				const phone = `${id}.mobile.${mode}.svg`;
				seen.add(phone);
				if (fs.existsSync(path.join(OUT, phone))) { cached++; continue; }
				let svg = null;
				try { svg = await renderVegaLite(spec, mode, true); }
				catch (e) { console.warn(`diagrams: phone layout failed: ${e.message.split("\n")[0]}`); }
				if (svg) { fs.writeFileSync(path.join(OUT, phone), svg); rendered++; }
				else console.warn(`diagrams: no phone drawing for "${spec.title?.text ?? spec.title ?? id}" (${mode}); it scrolls on phones`);
			}
		}
	}
}

if (figureJobs.length) {
	execFileSync("npx", ["tsx", "scripts/render-figures.tsx", JSON.stringify(figureJobs)], { stdio: "inherit", cwd: ROOT });
	for (const { id } of figureJobs) {
		for (const mode of ["light", "dark"]) {
			const mobile = `${id}.mobile.${mode}.svg`;
			if (fs.existsSync(path.join(OUT, mobile))) seen.add(mobile);
		}
	}
	rendered += figureJobs.length * 2;
}

if (chartJobs.length) {
	try {
		execFileSync("npx", ["tsx", "scripts/render-charts.tsx", JSON.stringify(chartJobs)], { stdio: "inherit", cwd: ROOT });
	} catch {
		// render-charts.tsx already printed which data file and field is wrong.
		process.exit(1);
	}
	rendered += chartJobs.length;
}

// Drop files whose source fence is gone, so the directory never accumulates orphans.
let pruned = 0;
for (const f of fs.readdirSync(OUT).filter((f) => f.endsWith(".svg") || f.endsWith(".html") || f.endsWith(".heads.json"))) {
	if (!seen.has(f)) { fs.unlinkSync(path.join(OUT, f)); pruned++; }
}

console.log(`diagrams: ${rendered} rendered, ${cached} cached, ${pruned} pruned`);
// The D2 wasm worker keeps the event loop alive; without this the build hangs.
process.exit(0);
