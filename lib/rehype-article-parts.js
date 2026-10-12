import { visit } from "unist-util-visit";
import { linkDomain } from "uipack/article";

/**
 * Bold-label paragraphs become uipack/article parts, so the Markdown stays plain
 * (and readable at /raw/<slug>.md) while the page gets distinct blocks:
 *
 *   **Learn:** a · b · c       -> TermList (square tags)
 *   **What changed:** …        -> ChangeNote (ruled, quieter than a callout)
 *   **Self-test:** …           -> Callout, kind "selftest"
 *   **Go deeper:** a; b; c     -> LinkList: one row per item holding exactly one
 *                                 link, every other item kept inline below the rows
 *
 * The markup follows uipack's class contract (docs/article.md in uipack); the
 * site's prose CSS cannot reach it, and article.css styles it.
 */
const LABELS = { "Learn:": "learn", "What changed:": "change", "Self-test:": "selftest", "Go deeper:": "deeper" };

const el = (tagName, className, children = [], extra = {}) => ({
	type: "element",
	tagName,
	properties: { className: [className], ...extra },
	children,
});
const text = (value) => ({ type: "text", value });

function textOf(node) {
	if (node.type === "text") return node.value;
	return (node.children ?? []).map(textOf).join("");
}

/** Drops leading space and a trailing full stop, and capitalises the first letter. */
function tidy(nodes, { stop = false } = {}) {
	const out = nodes.map((n) => (n.type === "text" ? { ...n } : n));
	const first = out[0];
	if (first?.type === "text") {
		first.value = first.value.replace(/^\s+/, "");
		first.value = first.value.charAt(0).toUpperCase() + first.value.slice(1);
	}
	const last = out.at(-1);
	if (last?.type === "text") {
		last.value = last.value.replace(/\s+$/, "");
		if (stop) last.value = last.value.replace(/\.$/, "");
	}
	return out.filter((n) => n.type !== "text" || n.value);
}

/** Splits inline nodes at every ";" in their text, keeping links and emphasis whole. */
function splitItems(nodes) {
	const items = [[]];
	for (const node of nodes) {
		if (node.type !== "text") {
			items.at(-1).push(node);
			continue;
		}
		const parts = node.value.split(";");
		parts.forEach((part, i) => {
			if (i > 0) items.push([]);
			if (part) items.at(-1).push(text(part));
		});
	}
	return items.map((item) => tidy(item, { stop: true })).filter((item) => item.length);
}

function terms(rest) {
	const list = textOf({ children: rest })
		.split("·")
		.map((t) => t.trim().replace(/\.$/, ""))
		.filter(Boolean)
		.map((t) => el("li", "uipack-terms__term", [text(t)]));
	return el("div", "uipack-terms", [el("p", "uipack-terms__label", [text("Learn")]), el("ul", "uipack-terms__list", list, { role: "list" })]);
}

function links(rest) {
	const rows = [];
	const inline = [];
	for (const item of splitItems(rest)) {
		const anchors = item.filter((n) => n.type === "element" && n.tagName === "a");
		if (anchors.length !== 1) {
			if (inline.length) inline.push(text("; "));
			inline.push(...item);
			continue;
		}
		const href = String(anchors[0].properties.href);
		const domain = linkDomain(href);
		const kids = [el("span", "uipack-links__title", [text(textOf({ children: item }))])];
		if (domain) kids.push(text(" "), el("span", "uipack-links__domain", [text(domain)]));
		rows.push(el("li", "uipack-links__item", [el("a", "uipack-links__link", kids, { href })]));
	}
	const kids = [el("p", "uipack-links__label", [text("Go deeper")])];
	if (rows.length) kids.push(el("ul", "uipack-links__list", rows, { role: "list" }));
	if (inline.length) kids.push(el("div", "uipack-links__body", [...inline, text(".")]));
	return el("div", "uipack-links", kids);
}

function part(kind, rest) {
	if (kind === "learn") return terms(rest);
	if (kind === "deeper") return links(rest);
	if (kind === "change") {
		return el("div", "uipack-change", [el("p", "uipack-change__label", [text("What changed")]), el("div", "uipack-change__body", tidy(rest))]);
	}
	const callout = el("div", "uipack-callout", [el("p", "uipack-callout__label", [text("Self-test")]), el("div", "uipack-callout__body", tidy(rest))]);
	callout.properties.className.push("uipack-callout--selftest");
	return callout;
}

export default function rehypeArticleParts() {
	return (tree) => {
		visit(tree, "element", (node, index, parent) => {
			if (node.tagName !== "p" || !parent || index === null) return;
			const [first, ...rest] = node.children.filter((c) => c.type !== "text" || c.value.trim() || c !== node.children[0]);
			if (first?.type !== "element" || first.tagName !== "strong") return;
			const kind = LABELS[textOf(first).trim()];
			if (!kind || !rest.length) return;
			parent.children[index] = part(kind, rest);
			return "skip";
		});
	};
}
