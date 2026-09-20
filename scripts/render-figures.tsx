// Renders ```uipack fences to SVG through uipack/static. Called by
// render-diagrams.mjs with a JSON list of { id, name } pairs: `name` is a
// module under content/figures/, `id` the fence hash the article resolves.
// Light and dark files are written like the charts, and the article surface
// shows through (no painted canvas), so a figure sits in the column like text.
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { renderStatic } from "uipack/static";
import { THEMES, type NotesFigure } from "../content/figures/_shared";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "content", "diagrams");
const jobs: { id: string; name: string }[] = JSON.parse(process.argv[2] ?? "[]");

async function main() {
let rendered = 0;
for (const { id, name } of jobs) {
  const file = path.join(ROOT, "content", "figures", `${name}.tsx`);
  if (!existsSync(file)) throw new Error(`uipack fence names "${name}" but content/figures/${name}.tsx does not exist`);
  const mod = (await import(pathToFileURL(file).href)) as { default: NotesFigure };
  const fig = mod.default;
  const [, , w, h] = fig.viewBox.split(/\s+/).map(Number);
  if (w < 900 || w > 1150 || h > 800) throw new Error(`${name}: viewBox ${w}x${h} is outside the 900–1150 wide, under 800 tall target (docs-figures.md)`);
  for (const mode of ["light", "dark"] as const) {
    const svg = renderStatic(fig, { theme: THEMES[mode], motion: true, frame: false, background: false });
    writeFileSync(path.join(OUT, `${id}.${mode}.svg`), svg);
    rendered++;
    const mobileFile = path.join(OUT, `${id}.mobile.${mode}.svg`);
    if (fig.mobile) {
      const [, , mw, mh] = fig.mobile.viewBox.split(/\s+/).map(Number);
      if (mw < 320 || mw > 600 || mh > 900) throw new Error(`${name}: mobile viewBox ${mw}x${mh} is outside the 320–600 wide, under 900 tall target`);
      const mobileSvg = renderStatic(fig.mobile, { theme: THEMES[mode], motion: true, frame: false, background: false });
      writeFileSync(mobileFile, mobileSvg);
      rendered++;
    } else if (existsSync(mobileFile)) {
      unlinkSync(mobileFile);
    }
  }
}
console.log(`figures: ${rendered} files from ${jobs.length} uipack fence(s)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
