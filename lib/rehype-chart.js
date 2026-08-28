import { visit } from "unist-util-visit";

/**
 * Renders a ```chart fence into an inline SVG bar chart at build time.
 *
 * The fence holds plain JSON, so the numbers stay legible to anything reading
 * /raw/<slug>.md — the machine-facing copy of the article — while humans get
 * the drawn version. No runtime JS, and the labels are real SVG text nodes so
 * crawlers and screen readers can read them.
 *
 * Palette: slots 1–3 of the validated categorical set, checked against this
 * site's own surfaces with the data-viz validator. Light mode falls below 3:1
 * contrast, so every bar carries a visible direct label (the relief rule).
 */
const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

const esc = (s) => String(s);

function barChart(spec) {
	const data = spec.series ?? [];
	if (!data.length) return null;

	const rowH = 34;
	const gap = 8;
	const padT = spec.title ? 44 : 14;
	const padB = spec.note ? 40 : 16;
	const labelW = Math.min(
		220,
		Math.max(90, ...data.map((d) => String(d.label).length * 7.4)),
	);
	const valueW = 74;
	const width = 720;
	const plotW = width - labelW - valueW - 24;
	const height = padT + data.length * rowH + (data.length - 1) * gap + padB;
	const max = Math.max(...data.map((d) => Math.abs(d.value)));

	const children = [];

	if (spec.title) {
		children.push({
			type: "element",
			tagName: "text",
			properties: { x: 0, y: 18, class: "vz-title" },
			children: [{ type: "text", value: esc(spec.title) }],
		});
	}

	data.forEach((d, i) => {
		const y = padT + i * (rowH + gap);
		const w = max === 0 ? 0 : Math.max(2, (Math.abs(d.value) / max) * plotW);
		const fill = SERIES[(d.slot ?? 0) % SERIES.length];

		children.push({
			type: "element",
			tagName: "text",
			properties: { x: labelW - 12, y: y + rowH / 2 + 4, class: "vz-label" },
			children: [{ type: "text", value: esc(d.label) }],
		});
		// Track, so a short bar still reads as a proportion of the row.
		children.push({
			type: "element",
			tagName: "rect",
			properties: {
				x: labelW, y: y + 8, width: plotW, height: rowH - 16,
				rx: 3, class: "vz-track",
			},
			children: [],
		});
		children.push({
			type: "element",
			tagName: "rect",
			properties: {
				x: labelW, y: y + 8, width: w, height: rowH - 16,
				rx: 4, fill, class: "vz-bar",
			},
			children: [
				{
					type: "element",
					tagName: "title",
					properties: {},
					children: [
						{ type: "text", value: `${d.label}: ${d.value}${spec.unit ? " " + spec.unit : ""}` },
					],
				},
			],
		});
		children.push({
			type: "element",
			tagName: "text",
			properties: { x: labelW + w + 10, y: y + rowH / 2 + 4, class: "vz-value" },
			children: [
				{
					type: "text",
					value: `${d.display ?? d.value.toLocaleString("en-GB")}${spec.unit ? " " + spec.unit : ""}`,
				},
			],
		});
	});

	if (spec.note) {
		children.push({
			type: "element",
			tagName: "text",
			properties: { x: 0, y: height - 14, class: "vz-note" },
			children: [{ type: "text", value: esc(spec.note) }],
		});
	}

	return {
		type: "element",
		tagName: "figure",
		properties: { class: "vz-figure" },
		children: [
			{
				type: "element",
				tagName: "svg",
				properties: {
					viewBox: `0 0 ${width} ${height}`,
					role: "img",
					"aria-label": spec.title ?? "chart",
					class: "vz-svg",
					xmlns: "http://www.w3.org/2000/svg",
				},
				children,
			},
		],
	};
}

export default function rehypeChart() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "pre" || !parent || index === null) return;
			const code = node.children?.find((c) => c.tagName === "code");
			const cls = code?.properties?.className ?? [];
			if (!Array.isArray(cls) || !cls.includes("language-chart")) return;
			const raw = code.children?.map((c) => c.value ?? "").join("") ?? "";
			let spec;
			try {
				spec = JSON.parse(raw);
			} catch {
				// A malformed chart must fail loudly at build rather than render blank.
				throw new Error(`Invalid JSON in a \`\`\`chart block:\n${raw.slice(0, 200)}`);
			}
			const fig = barChart(spec);
			if (fig) parent.children[index] = fig;
		});
	};
}
