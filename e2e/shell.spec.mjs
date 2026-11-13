// The floors the shell and the article template hold on every page (STYLE.md, "Layout" and
// "Type"; uipack docs/system/layout/README.md, "Floors"). Each test names the rule it keeps.
import { test, expect } from "@playwright/test";

const WIDTHS = [1920, 1440, 390];
const FIGURES = "/prefill-vs-decode"; // uipack figure, Vega-Lite chart, tables, code
const CHARTS = "/who-builds-the-ai-stack"; // HTML span chart, a wide table
const PLAIN = "/four-predictions-for-software-teams"; // prose only
const PAGES = ["/", "/?category=AI+systems", "/about", "/no-such-page", FIGURES, CHARTS, PLAIN];
const GROUND = { light: "rgb(255, 253, 249)", dark: "rgb(18, 17, 15)" };
const near = (a, b, by = 0.6) => Math.abs(a - b) <= by;

const phone = (width) => (width < 600 ? { hasTouch: true, isMobile: true } : {});
async function open(browser, width, options = {}) {
	const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 1000 }, ...phone(width), ...options });
	return { context, page: await context.newPage() };
}
async function articlePaths(page) {
	await page.goto("/");
	return page.locator(".post-list h2 a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
}

/** Left and right x of what is drawn: the masthead's first word and last icon, the content, the footer. */
const edges = () => {
	const box = (el) => el.getBoundingClientRect();
	const words = (el) => {
		const range = document.createRange();
		range.selectNodeContents(el);
		return range.getBoundingClientRect();
	};
	const q = (selector) => document.querySelector(selector);
	return {
		title: words(q(".site-title a")).left,
		nav: words(q(".masthead nav a")).left,
		toggleIcon: box(q(".theme-toggle svg")).right,
		toggleBox: box(q(".theme-toggle")).width,
		contentLeft: box(q("main")).left,
		contentRight: box(q("main")).right,
		footerLeft: words(q("footer .links a")).left,
		footerRight: box(q("footer")).right,
		rule: [box(q(".masthead")).left, box(q(".masthead")).right],
	};
};

test.describe("one header (floor 8): the masthead shares its content's edges, at the same x on every page", () => {
	for (const width of WIDTHS)
		for (const scheme of ["light", "dark"])
			test(`${width}px, ${scheme}`, async ({ browser }) => {
				const { context, page } = await open(browser, width, { colorScheme: scheme });
				const seen = [];
				for (const path of PAGES) {
					await page.goto(path);
					const e = await page.evaluate(edges);
					for (const start of [e.title, e.nav, e.footerLeft, e.rule[0]]) expect(near(start, e.contentLeft), `${path}: start edge ${start} vs content ${e.contentLeft}`).toBe(true);
					for (const end of [e.toggleIcon, e.footerRight, e.rule[1]]) expect(near(end, e.contentRight), `${path}: end edge ${end} vs content ${e.contentRight}`).toBe(true);
					expect(e.toggleBox).toBe(44);
					seen.push([e.title, e.toggleIcon]);
				}
				for (const [start, end] of seen) {
					expect(near(start, seen[0][0])).toBe(true);
					expect(near(end, seen[0][1])).toBe(true);
				}
				await context.close();
			});

	test("a page that does not scroll keeps the scrollbar's gutter, so the column does not move", async ({ page }) => {
		await page.goto("/no-such-page");
		expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter)).toBe("stable");
	});
});

test.describe("one reading measure; figures, charts and tables may take more", () => {
	for (const width of WIDTHS)
		test(`${width}px: every article's prose is one width, and nothing wider breaks the page`, async ({ browser }) => {
			const { context, page } = await open(browser, width);
			const measures = new Set();
			for (const path of [...(await articlePaths(page)), "/about"]) {
				await page.goto(path);
				const m = await page.evaluate(() => {
					const visible = (el) => el.getBoundingClientRect().width > 0;
					const column = document.querySelector(".prose").getBoundingClientRect();
					const wide = [...document.querySelectorAll(".fig-media, .table-scroll")].filter(visible).map((el) => {
						const b = el.getBoundingClientRect();
						return { left: b.left, right: b.right, kind: el.className };
					});
					return {
						prose: [...new Set([...document.querySelectorAll(".prose > p, .prose > ul, .prose > h2")].filter(visible).map((el) => el.getBoundingClientRect().width))],
						column: [column.left, column.right],
						wide,
						page: [document.documentElement.scrollWidth, innerWidth],
					};
				});
				expect(m.prose, `${path}: prose widths`).toHaveLength(1);
				measures.add(m.prose[0]);
				expect(m.page[0], `${path}: sideways scroll`).toBeLessThanOrEqual(m.page[1]);
				for (const box of m.wide) {
					// Never narrower than the column, centred on it, inside the window.
					expect(box.left, `${path} ${box.kind}`).toBeLessThanOrEqual(m.column[0] + 0.6);
					expect(box.right, `${path} ${box.kind}`).toBeGreaterThanOrEqual(m.column[1] - 0.6);
					expect(near(box.left - m.column[0], m.column[1] - box.right, 1), `${path} ${box.kind}: centred`).toBe(true);
					expect(box.left).toBeGreaterThanOrEqual(0);
					expect(box.right).toBeLessThanOrEqual(width);
				}
			}
			expect([...measures], "one measure across articles").toHaveLength(1);
			if (width >= 1440) expect([...measures][0]).toBe(664);
			await context.close();
		});

	test("1440px: a table wider than the column grows into the figure slot instead of scrolling", async ({ browser }) => {
		const { context, page } = await open(browser, 1440);
		let grown = 0;
		for (const path of await articlePaths(page)) {
			await page.goto(path);
			const tables = await page.locator(".table-scroll").evaluateAll((boxes) => boxes.map((box) => ({ width: box.getBoundingClientRect().width, scrolls: box.scrollWidth > box.clientWidth + 1 })));
			for (const table of tables) {
				expect(table.width, path).toBeLessThanOrEqual(960);
				if (table.width < 959) expect(table.scrolls, `${path}: a table narrower than the slot scrolls`).toBe(false);
				if (table.width > 665) grown += 1;
			}
		}
		expect(grown, "the articles have tables that need the slot").toBeGreaterThan(0);
		await context.close();
	});

	test("1440px: figures take the 960px slot, or the width their smallest label needs", async ({ browser }) => {
		const { context, page } = await open(browser, 1440);
		await page.goto(FIGURES);
		const widths = await page.locator(".fig-media").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
		expect(widths.length).toBeGreaterThan(1);
		for (const w of widths) expect(w).toBe(960);
		await page.goto("/job-search-numbers");
		const wide = await page.locator(".fig-diagram .fig-media").first().evaluate((el) => el.getBoundingClientRect().width);
		expect(wide).toBeGreaterThan(960);
		expect(wide).toBeLessThanOrEqual(1400);
		await context.close();
	});
});

test.describe("one type spec, four line heights, one corner rule", () => {
	const ROLES = {
		"site title": ".site-title", tagline: ".masthead-tagline", navigation: ".masthead nav a", "page title": "main article h1", dek: ".dek",
		meta: "article header .meta", "body text": ".prose > p", "section heading": ".prose h2", "list title": ".post-list :is(h2, h3)",
		"list description": ".post-list p", taxonomy: ".post-taxonomy a", caption: ".fig figcaption", "table cell": ".prose td", "contents link": ".toc a",
		"agent note": ".agent-note", footer: "footer", "revision line": ".updated",
	};
	const readRoles = (roles) => {
		const out = {};
		for (const [role, selector] of Object.entries(roles)) {
			const specs = new Set();
			for (const el of document.querySelectorAll(selector)) {
				if (!el.getBoundingClientRect().width) continue;
				const s = getComputedStyle(el);
				specs.add([s.fontFamily.split(",")[0], s.fontSize, s.lineHeight, s.fontWeight, s.letterSpacing].join(" "));
			}
			if (specs.size) out[role] = [...specs];
		}
		return out;
	};

	for (const width of [1440, 390])
		test(`${width}px: each role is set one way on every page`, async ({ browser }) => {
			const { context, page } = await open(browser, width);
			const specs = {};
			for (const path of PAGES) {
				await page.goto(path);
				for (const [role, found] of Object.entries(await page.evaluate(readRoles, ROLES))) (specs[role] ??= new Set()).add(found.join(" | "));
			}
			expect(Object.keys(specs).length).toBe(Object.keys(ROLES).length);
			for (const [role, found] of Object.entries(specs)) expect([...found], role).toHaveLength(1);
			await context.close();
		});

	test("the site's own text uses four line heights and its frames two radii", async ({ browser }) => {
		const { context, page } = await open(browser, 1440);
		const leadings = new Set();
		const radii = new Set();
		for (const path of [...PAGES, "/?tag=inference", "/council-skill"]) {
			await page.goto(path);
			await page.locator(".topic-picker summary").click({ timeout: 2000 }).catch(() => {});
			const found = await page.evaluate(() => {
				const leadings = [];
				const radii = [];
				for (const el of document.querySelectorAll("body *")) {
					// Live parts (uipack charts, article parts, drawings) keep their own.
					if (el.closest("svg, [class*='uipack-']") || !el.getBoundingClientRect().width) continue;
					const s = getComputedStyle(el);
					if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) leadings.push((parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2));
					const drawn = s.backgroundColor !== "rgba(0, 0, 0, 0)" || s.borderTopWidth !== "0px";
					if (drawn && s.borderTopLeftRadius !== "0px") radii.push(s.borderTopLeftRadius);
				}
				return { leadings, radii };
			});
			found.leadings.forEach((v) => leadings.add(v));
			found.radii.forEach((v) => radii.add(v));
		}
		expect([...leadings].sort()).toEqual(["1.25", "1.40", "1.60", "1.70"]);
		expect([...radii].sort()).toEqual(["4px", "50%", "6px"]);
		await context.close();
	});
});

test.describe("one name per page", () => {
	test("the index is Notes: its nav label, the site title's link and the way back from a missing page", async ({ page }) => {
		await page.goto("/no-such-page");
		await expect(page.locator("main a[href='/']")).toHaveText("All notes");
		await expect(page.locator("h1")).toHaveText("Page not found");
		await expect(page).toHaveTitle(/^Page not found — /);
		await expect(page.locator(".masthead nav a[href='/']")).toHaveText("Notes");
		await page.goto("/");
		await expect(page).toHaveTitle("Ong Jun Xiong — Notes");
		await expect(page.locator("h1")).toHaveText("Ong Jun Xiong — Notes");
		await expect(page.locator(".category-filters a").first()).toContainText("All notes");
		await expect(page.locator(".masthead nav a[aria-current='page']")).toHaveText("Notes");
	});

	test("About is About: the nav label, the title and the h1", async ({ page }) => {
		await page.goto("/about");
		await expect(page.locator(".masthead nav a[aria-current='page']")).toHaveText("About");
		await expect(page.locator("h1")).toHaveText("About");
		await expect(page).toHaveTitle(/^About — /);
	});

	test("the product is UiPack wherever an article names it in words", async ({ page }) => {
		await page.goto("/");
		const paths = await page.locator(".post-list h2 a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
		for (const path of paths) {
			await page.goto(path);
			// Words, not code: the package, its imports and its class names stay `uipack`.
			const words = await page.evaluate(() => {
				const main = document.querySelector("main").cloneNode(true);
				main.querySelectorAll("code, pre, svg, script, style, [class*='uipack-']").forEach((el) => el.remove());
				return main.textContent;
			});
			expect(words, path).not.toMatch(/\b(uipack|Uipack|UIPack|UI Pack|Ui Pack)\b/);
		}
	});

	test("the shell never misspells UiPack", async ({ page }) => {
		for (const path of ["/", "/about", "/no-such-page", PLAIN]) {
			await page.goto(path);
			const shell = await page.evaluate(() => [".masthead", "footer", ".agent-note", ".related-notes", "article header"].map((s) => document.querySelector(s)?.innerText ?? "").join("\n"));
			expect(shell).not.toMatch(/\b(uipack|Uipack|UIPack|UI Pack|Ui Pack)\b/);
		}
	});
});

test.describe("a page change never flashes", () => {
	for (const scheme of ["light", "dark"])
		test(`the document has its ground before any stylesheet or script: system ${scheme}`, async ({ browser }) => {
			const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: scheme });
			const page = await context.newPage();
			await page.route(/\.css(\?|$)/, (route) => route.abort());
			await page.goto(FIGURES, { waitUntil: "commit" });
			await expect.poll(() => page.locator("html").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(GROUND[scheme]);
			expect(await page.locator("html").evaluate((el) => getComputedStyle(el).colorScheme)).toBe(scheme);
			await context.close();
		});

	for (const [stored, system] of [["dark", "light"], ["light", "dark"]])
		test(`the reader's stored ${stored} wins over system ${system} on the document itself`, async ({ browser }) => {
			const context = await browser.newContext({ colorScheme: system });
			const page = await context.newPage();
			await page.addInitScript((value) => localStorage.setItem("notes-appearance", value), stored);
			await page.route(/\.(css|js)(\?|$)/, (route) => route.abort());
			await page.goto(PLAIN, { waitUntil: "commit" });
			await expect.poll(() => page.locator("html").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(GROUND[stored]);
			await context.close();
		});

	for (const scheme of ["light", "dark"])
		test(`the inline ground is the stylesheet's paper: ${scheme}`, async ({ browser }) => {
			const context = await browser.newContext({ colorScheme: scheme });
			const page = await context.newPage();
			for (const path of ["/", FIGURES]) {
				await page.goto(path);
				const painted = await page.evaluate(() => [getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor]);
				expect(painted).toEqual([GROUND[scheme], GROUND[scheme]]);
			}
			await context.close();
		});

	test("the index arrives whole: tabs, count and Topics are in the document, and nothing moves when the script runs", async ({ browser }) => {
		const still = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
		const before = await still.newPage();
		await before.goto("/");
		await expect(before.locator(".category-filters a").first()).toBeVisible();
		await expect(before.locator(".topic-picker summary")).toBeVisible();
		const firstTitle = (p) => p.locator(".post-list h2").first().evaluate((el) => el.getBoundingClientRect().top);
		const top = await firstTitle(before);
		await still.close();
		const live = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
		const after = await live.newPage();
		await after.goto("/", { waitUntil: "networkidle" });
		await expect(after.locator(".theme-toggle")).toBeEnabled();
		expect(await firstTitle(after)).toBe(top);
		await live.close();
	});

	test("the appearance toggle is drawn in its state before the script runs", async ({ browser }) => {
		const read = (p) => p.locator(".theme-toggle").evaluate((el) => getComputedStyle(el).color);
		const still = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark" });
		const before = await still.newPage();
		await before.goto("/about");
		const first = await read(before);
		await still.close();
		const live = await browser.newContext({ colorScheme: "dark" });
		const after = await live.newPage();
		await after.goto("/about");
		await expect(after.locator(".theme-toggle")).toHaveAttribute("aria-pressed", "true");
		await after.mouse.move(0, 0);
		expect(await read(after)).toBe(first);
		expect(first).toBe("rgb(240, 133, 79)");
		await live.close();
	});
});

test.describe("the theme follows the reader's last choice, then the system", () => {
	const ground = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

	test("no choice stored: the system's setting, live", async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: "dark" });
		const page = await context.newPage();
		await page.goto("/");
		expect(await ground(page)).toBe(GROUND.dark);
		await page.emulateMedia({ colorScheme: "light" });
		await expect.poll(() => ground(page)).toBe(GROUND.light);
		await context.close();
	});

	test("a choice is kept on every page and across a reload, against the system", async ({ browser }) => {
		const context = await browser.newContext({ colorScheme: "light" });
		const page = await context.newPage();
		await page.goto("/");
		await expect(page.locator(".theme-toggle")).toBeEnabled();
		await page.locator(".theme-toggle").click();
		expect(await ground(page)).toBe(GROUND.dark);
		expect(await page.evaluate(() => localStorage.getItem("notes-appearance"))).toBe("dark");
		for (const path of [FIGURES, "/about", "/no-such-page", "/"]) {
			await page.goto(path);
			expect(await ground(page), path).toBe(GROUND.dark);
			// The drawings follow the choice too: only the dark copy of a figure shows.
			if (path === FIGURES) expect(await page.locator(".fig-light").evaluateAll((els) => els.filter((el) => el.getBoundingClientRect().width).length)).toBe(0);
		}
		await page.emulateMedia({ colorScheme: "dark" });
		await page.emulateMedia({ colorScheme: "light" });
		expect(await ground(page)).toBe(GROUND.dark);
		await page.locator(".theme-toggle").click();
		await page.reload();
		expect(await ground(page)).toBe(GROUND.light);
		await context.close();
	});
});

test.describe("phones: 44px targets, no sideways scroll, charts that can be read", () => {
	test("390px: every standalone control is a 44px target and no page scrolls sideways", async ({ browser }) => {
		const { context, page } = await open(browser, 390);
		for (const path of [...PAGES, "/?tag=inference"]) {
			await page.goto(path);
			await expect(page.locator(".theme-toggle")).toBeEnabled();
			const found = await page.evaluate(() => {
				const small = [];
				// Links inside a sentence are text, not standalone controls; uipack's charts own their controls.
				const inSentence = "p, li, td, th, figcaption, .agent-note, .updated, .dek, footer > div:not(.links), [class*='uipack-']";
				for (const el of document.querySelectorAll("a, button, summary")) {
					const b = el.getBoundingClientRect();
					if (!b.width || el.closest(inSentence) || el.classList.contains("skip-link")) continue;
					if (b.width < 43.5 || b.height < 43.5) small.push(`${el.className || el.tagName} "${el.textContent.trim().slice(0, 30)}" ${Math.round(b.width)}x${Math.round(b.height)}`);
				}
				return { small, page: [document.documentElement.scrollWidth, innerWidth] };
			});
			expect(found.small, path).toEqual([]);
			expect(found.page[0], `${path}: sideways scroll`).toBeLessThanOrEqual(found.page[1]);
		}
		await context.close();
	});

	for (const width of WIDTHS)
		test(`${width}px: no label in a drawing or a chart is under 11px, on any article`, async ({ browser }) => {
			const { context, page } = await open(browser, width);
			for (const path of await articlePaths(page)) {
				await page.goto(path);
				const small = await page.evaluate(() => {
					const out = [];
					for (const svg of document.querySelectorAll(".fig svg")) {
						const drawn = svg.getBoundingClientRect().width;
						const natural = svg.viewBox.baseVal.width;
						if (!drawn || !natural) continue;
						for (const label of svg.querySelectorAll("text")) {
							if (!label.textContent.trim() || !label.getBoundingClientRect().width) continue;
							const px = (parseFloat(getComputedStyle(label).fontSize) * drawn) / natural;
							if (px < 10.95) out.push(`${label.textContent.trim().slice(0, 24)} ${px.toFixed(1)}px`);
						}
					}
					for (const el of document.querySelectorAll(".fig-html *")) {
						if (!el.getBoundingClientRect().width || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
						const px = parseFloat(getComputedStyle(el).fontSize);
						if (px < 11) out.push(`${el.textContent.trim().slice(0, 24)} ${px}px`);
					}
					return out;
				});
				expect(small, path).toEqual([]);
			}
			await context.close();
		});

	for (const width of [768, 1024])
		test(`${width}px: no drawing's labels are under 11px (it scrolls in its frame) and no page scrolls sideways`, async ({ browser }) => {
			const { context, page } = await open(browser, width);
			for (const path of await articlePaths(page)) {
				await page.goto(path);
				const found = await page.evaluate(() => {
					const small = [];
					for (const svg of document.querySelectorAll(".fig svg")) {
						const drawn = svg.getBoundingClientRect().width;
						const natural = svg.viewBox.baseVal.width;
						if (!drawn || !natural) continue;
						const sizes = [...svg.querySelectorAll("text")].filter((t) => t.textContent.trim() && t.getBoundingClientRect().width).map((t) => (parseFloat(getComputedStyle(t).fontSize) * drawn) / natural);
						if (sizes.length && Math.min(...sizes) < 10.95) small.push(Math.min(...sizes).toFixed(1));
					}
					return { small, page: [document.documentElement.scrollWidth, innerWidth] };
				});
				expect(found.small, path).toEqual([]);
				expect(found.page[0], path).toBeLessThanOrEqual(found.page[1]);
			}
			await context.close();
		});

	test("768px: a drawing with no phone composition scrolls inside its frame rather than shrink", async ({ browser }) => {
		const { context, page } = await open(browser, 768);
		await page.goto(FIGURES);
		const box = page.locator(".fig-scroll").first();
		await expect(box).toHaveAttribute("tabindex", "0");
		expect(await box.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
		await expect(page.locator(".fig-swipe").first()).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
		await context.close();
	});
});
