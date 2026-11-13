import { defineConfig } from "@playwright/test";

// Browser tests for the shell and the article template (e2e/). They run against the
// production build: `npm run build`, then `npm run test:e2e`.
const PORT = 3217;

export default defineConfig({
	testDir: "e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? "github" : "list",
	use: { baseURL: `http://localhost:${PORT}`, browserName: "chromium" },
	webServer: {
		command: `npx next start -p ${PORT}`,
		url: `http://localhost:${PORT}/about`,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
