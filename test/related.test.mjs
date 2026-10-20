import { test } from "node:test";
import assert from "node:assert/strict";
import { relatedArticles, linkedSlugs, clusteredSlugs } from "../lib/related.mjs";

const a = (slug, tags, category, date, body = "") => ({ slug, tags, category, date, body });

test("rare shared tags outrank common ones", () => {
	const list = [
		a("self", ["common", "rare"], "AI", "2026-01-10"),
		a("common-1", ["common"], "AI", "2026-01-09"),
		a("rare-1", ["rare"], "AI", "2026-01-01"),
		a("common-2", ["common"], "AI", "2026-01-08"),
		a("common-3", ["common"], "AI", "2026-01-07"),
	];
	assert.equal(relatedArticles(list, "self")[0].slug, "rare-1");
});

test("a link in either direction adds a bonus, same category a small one", () => {
	const list = [
		a("self", ["x"], "AI", "2026-01-10", "See [that](/linked)."),
		a("plain", ["x"], "AI", "2026-01-09"),
		a("linked", ["x"], "AI", "2026-01-01"),
		a("back", ["x"], "AI", "2026-01-02", "Read [this](https://notes.junxiong.dev/self#top)."),
		a("other-cat", ["x"], "Career", "2026-01-09"),
		a("unrelated", ["y"], "Career", "2026-01-09"),
	];
	const slugs = relatedArticles(list, "self", { siteUrl: "https://notes.junxiong.dev" }).map((r) => r.slug);
	assert.deepEqual(slugs, ["back", "linked", "plain", "other-cat"]);
});

test("a tag every article carries does not count as overlap", () => {
	const list = [a("self", ["all"], "AI", "2026-01-10"), a("b", ["all"], "Career", "2026-01-09")];
	assert.deepEqual(relatedArticles(list, "self"), []);
});

test("excludes self and excluded slugs, ties go newest first, fills from category", () => {
	const list = [
		a("self", ["x"], "AI", "2026-01-10"),
		a("old", ["x"], "AI", "2026-01-01"),
		a("new", ["x"], "AI", "2026-01-05"),
		a("hidden", ["x"], "AI", "2026-01-06"),
		a("cat-old", [], "AI", "2025-01-01"),
		a("cat-new", [], "AI", "2025-06-01"),
		a("cat-newest", [], "AI", "2025-07-01"),
		a("elsewhere", [], "Career", "2026-02-01"),
	];
	const out = relatedArticles(list, "self", { exclude: new Set(["hidden"]) });
	assert.deepEqual(out.map((r) => r.slug), ["new", "old", "cat-newest", "cat-new"]);
	assert.deepEqual(out.map((r) => r.reason), ["overlap", "overlap", "category", "category"]);
	assert.ok(!("body" in out[0]));
});

test("notes fences count as links and as clustered slugs", () => {
	const body = "Text\n\n```notes My notes\nfoo-bar: Kicker\nbaz: Other\n```\n";
	assert.deepEqual([...clusteredSlugs(body)], ["foo-bar", "baz"]);
	assert.ok(linkedSlugs(body + "[x](/qux)").has("qux"));
	assert.ok(!linkedSlugs("[x](https://example.com/qux)", "https://notes.junxiong.dev").has("qux"));
});
