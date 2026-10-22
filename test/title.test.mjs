import { test } from "node:test";
import assert from "node:assert/strict";
import { pageTitle, TITLE_MAX, TITLE_SUFFIX } from "../lib/site.mjs";

test("a title that fits with the suffix keeps the layout template", () => {
	assert.equal(pageTitle("Why I optimize LinkedIn once a year"), "Why I optimize LinkedIn once a year");
	const fits = "x".repeat(TITLE_MAX - TITLE_SUFFIX.length);
	assert.equal(pageTitle(fits), fits);
});

test("a title that would run past the limit drops the suffix, never its own words", () => {
	const long = "x".repeat(TITLE_MAX - TITLE_SUFFIX.length + 1);
	assert.deepEqual(pageTitle(long), { absolute: long });
	const longer = "Claude Code, DeepSeek Harness and Hermes are built three different ways";
	assert.deepEqual(pageTitle(longer), { absolute: longer });
});
