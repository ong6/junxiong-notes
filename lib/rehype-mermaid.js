import { visit } from "unist-util-visit";

/**
 * Marks ```mermaid fences for client-side rendering.
 *
 * The diagram source is left in the document as text. That keeps the HTML
 * meaningful without JavaScript, and keeps it identical to what an agent reads
 * in /raw/<slug>.md. A caption can be given as the fence's meta string.
 */
export default function rehypeMermaid() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "pre") return;
			const code = node.children?.find((c) => c.tagName === "code");
			const cls = code?.properties?.className ?? [];
			if (!Array.isArray(cls) || !cls.includes("language-mermaid")) return;
			const src = code.children?.map((c) => c.value ?? "").join("") ?? "";
			node.properties = { ...node.properties, className: ["mermaid-src"] };
			if (code.data?.meta) node.properties["data-caption"] = code.data.meta;
			node.children = [{ type: "text", value: src }];
		});
	};
}
