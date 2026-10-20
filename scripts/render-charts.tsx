/* @jsxRuntime automatic @jsxImportSource react */
// Renders ```span and ```stack fences to static HTML through uipack/charts, and
// ```notes fences (clusters of cards for the site's own articles) through
// uipack/article. Called by render-diagrams.mjs with a JSON list of jobs:
// { id, kind: "span" | "stack", name } names a data file under content/data/ (no
// extension); { id, kind: "notes", label, body } carries the fence itself. `id` is
// the fence hash the article resolves. This file only maps data onto the
// components' props; layout, behaviour and validation live in uipack.
//
// Bad data fails the build: YAML syntax errors, unknown fields (usually typos),
// wrong types, and everything the library rejects (unknown layers, duplicate ids).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "yaml";
import { LayerStack, SpanChart, type LayerStackProps, type SpanChartProps, type SpanItem } from "uipack/charts";
import { LayerHead, NoteCluster, type NoteCardProps } from "uipack/article";
import { articleSlugs, readArticle, readingTime } from "../lib/articles.js";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "content", "diagrams");
const LOGOS = path.join(ROOT, "public", "logos");
type Job = { id: string; kind: "span" | "stack"; name: string } | { id: string; kind: "notes"; label: string; body: string };
const jobs: Job[] = JSON.parse(process.argv[2] ?? "[]");

type Obj = Record<string, unknown>;

class DataError extends Error {}

/* ---------- field checks ---------- */

function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Fails on any key outside `allowed`, suggesting the nearest one: a typo'd field would otherwise be silently dropped. */
function only(file: string, where: string, value: unknown, allowed: string[], required: string[] = []): Obj {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DataError(`${file}: ${where} must be a mapping`);
  const obj = value as Obj;
  for (const key of Object.keys(obj)) {
    if (allowed.includes(key)) continue;
    const near = allowed.map((k) => [k, distance(key, k)] as const).sort((x, y) => x[1] - y[1])[0];
    const hint = near && near[1] <= 2 ? ` Did you mean "${near[0]}"?` : "";
    throw new DataError(`${file}: ${where} has unknown field "${key}".${hint} Allowed: ${allowed.join(", ")}`);
  }
  for (const key of required) {
    if (obj[key] === undefined || obj[key] === null || obj[key] === "") throw new DataError(`${file}: ${where} is missing "${key}"`);
  }
  return obj;
}

function list(file: string, where: string, value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new DataError(`${file}: ${where} must be a list`);
  return value;
}

function kind(file: string, where: string, value: unknown, type: "string" | "number" | "boolean") {
  if (value !== undefined && typeof value !== type) throw new DataError(`${file}: ${where} must be a ${type}, got ${JSON.stringify(value)}`);
}

function strings(file: string, where: string, value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  const items = list(file, where, value);
  items.forEach((v, i) => kind(file, `${where}[${i}]`, v, "string"));
  return items as string[];
}

function load(file: string): Obj {
  const full = path.join(ROOT, file);
  if (!existsSync(full)) throw new DataError(`${file} does not exist (named by a chart fence)`);
  try {
    return parse(readFileSync(full, "utf8")) as Obj;
  } catch (e) {
    throw new DataError(`${file}: ${(e as Error).message}`);
  }
}

/* ---------- ```span: content/data/<name>.yaml -> SpanChart ---------- */

/** $4.3T, $17.5B, $60B, $106B, $350M. One decimal under 100, trailing .0 trimmed. */
function formatUsdB(usdB: number) {
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, "");
  if (usdB >= 999.5) return `$${trim(usdB / 1000)}T`;
  if (usdB >= 99.95) return `$${Math.round(usdB)}B`;
  if (usdB >= 0.9995) return `$${trim(usdB)}B`;
  return `$${Math.round(usdB * 1000)}M`;
}

const STATUS_KINDS = ["acquired", "pending", "licensed", "shutdown"];

/** public/logos/<id>.png or .jpg (scripts/fetch-logos.mjs), else a monogram tile. */
function logoFor(id: string) {
  const ext = ["png", "jpg"].find((e) => existsSync(path.join(LOGOS, `${id}.${e}`)));
  return ext ? `/logos/${id}.${ext}` : undefined;
}

function spanProps(name: string): SpanChartProps {
  const file = `content/data/${name}.yaml`;
  // Rows live under `companies` (the AI stack map) or `items` (any other span chart).
  const data = only(file, "the file", load(file), ["asOf", "labels", "zones", "layers", "sizeTiers", "unsizedTier", "companies", "items"], ["layers"]);
  const rows = data.companies ?? data.items;
  if (rows === undefined || (data.companies !== undefined && data.items !== undefined)) throw new DataError(`${file}: list the rows under exactly one of \`companies\` or \`items\``);
  // Wording that depends on what the rows are: the key's tag and value legends, and
  // what a row is called ("Company", "Find a company", "Show all {n} companies").
  const LABEL_KEYS = ["tagLegend", "valueLegend", "keyType", "company", "find", "noMatch", "showAll", "showFeatured"];
  const fileLabels = data.labels === undefined ? {} : only(file, "labels", data.labels, LABEL_KEYS);
  for (const key of LABEL_KEYS) kind(file, `labels.${key}`, fileLabels[key], "string");

  const zones = data.zones === undefined ? undefined : list(file, "zones", data.zones).map((z, i) => only(file, `zones[${i}]`, z, ["id", "label"], ["id", "label"]));
  // `short` is the one-word column header the chart uses at mid widths (the 56rem slot).
  const layers = list(file, "layers", data.layers).map((l, i) => only(file, `layers[${i}]`, l, ["id", "label", "short", "abbr", "zone"], ["id", "label", "abbr"]));
  const sizeTiers = data.sizeTiers === undefined ? [] : list(file, "sizeTiers", data.sizeTiers).map((t, i) => {
    const tier = only(file, `sizeTiers[${i}]`, t, ["id", "label", "range", "minB"], ["id", "label", "minB"]);
    kind(file, `sizeTiers[${i}].minB`, tier.minB, "number");
    return tier as { id: string; label: string; range?: string; minB: number };
  });
  // Tiers are listed largest first; a company takes the first tier whose floor it clears.
  for (let i = 1; i < sizeTiers.length; i++) {
    if (sizeTiers[i].minB >= sizeTiers[i - 1].minB) throw new DataError(`${file}: sizeTiers must be listed largest first (descending minB)`);
  }
  // Rows without a usable figure (no valuation, or `usdB: null`) go in this last tier.
  const unsized = data.unsizedTier === undefined ? undefined : (only(file, "unsizedTier", data.unsizedTier, ["id", "label", "range"], ["id", "label"]) as { id: string; label: string; range?: string });
  const tierFor = (usdB: number | undefined) => (usdB === undefined ? unsized?.id : sizeTiers.find((t) => usdB >= t.minB)?.id);

  const rowKey = data.companies !== undefined ? "companies" : "items";
  const items: SpanItem[] = list(file, rowKey, rows).map((c, i) => {
    const where = `${rowKey}[${i}]${c && typeof c === "object" && "id" in c ? ` (${String((c as Obj).id)})` : ""}`;
    // `valueLabel` is a plain label for charts whose value is not money (a licence, say).
    const co = only(file, where, c, ["id", "name", "domain", "primary", "also", "tags", "featured", "note", "status", "source", "valuation", "valueLabel"], ["id", "name", "primary"]);
    for (const key of ["id", "name", "domain", "primary", "note", "source", "valueLabel"]) kind(file, `${where}.${key}`, co[key], "string");
    kind(file, `${where}.featured`, co.featured, "boolean");
    const id = co.id as string;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new DataError(`${file}: ${where} id must be kebab-case`);

    let status: SpanItem["status"];
    if (co.status !== undefined) {
      const s = only(file, `${where}.status`, co.status, ["kind", "label"], ["kind"]);
      if (!STATUS_KINDS.includes(s.kind as string)) throw new DataError(`${file}: ${where}.status.kind must be one of ${STATUS_KINDS.join(", ")}, got "${String(s.kind)}"`);
      kind(file, `${where}.status.label`, s.label, "string");
      status = { kind: s.kind as NonNullable<SpanItem["status"]>["kind"], label: s.label as string | undefined };
    }

    let usdB: number | undefined;
    let display: string | undefined;
    if (co.valuation !== undefined) {
      const v = only(file, `${where}.valuation`, co.valuation, ["usdB", "basis", "asOf", "source", "display"]);
      if (v.usdB !== null && v.usdB !== undefined) {
        kind(file, `${where}.valuation.usdB`, v.usdB, "number");
        if (!Number.isFinite(v.usdB) || (v.usdB as number) < 0) throw new DataError(`${file}: ${where}.valuation.usdB must be a non-negative number`);
        usdB = v.usdB as number;
      }
      for (const key of ["basis", "asOf", "source", "display"]) kind(file, `${where}.valuation.${key}`, v[key], "string");
      display = v.display as string | undefined;
    }

    const domain = co.domain as string | undefined;
    const tags = strings(file, `${where}.tags`, co.tags);
    const also = strings(file, `${where}.also`, co.also);
    const item: SpanItem = {
      id,
      name: co.name as string,
      primary: co.primary as string,
      also: also?.length ? also : undefined,
      tags: tags?.length ? tags : undefined,
      featured: co.featured === true ? true : undefined,
      note: co.note as string | undefined,
      source: co.source as string | undefined,
      status,
      href: domain ? `https://${domain}` : undefined,
      // Only logos already on disk: the build never fetches (npm run logos does).
      logo: logoFor(id),
      tier: tierFor(usdB),
      value: usdB,
      valueLabel: display || (co.valueLabel as string | undefined) || (usdB === undefined ? undefined : formatUsdB(usdB)) || "—",
    };
    // Drop undefined keys so the props stay what the YAML said.
    return Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined)) as unknown as SpanItem;
  });

  return {
    id: name,
    zones: zones as SpanChartProps["zones"],
    layers: layers as unknown as SpanChartProps["layers"],
    tiers: sizeTiers.length || unsized ? [...sizeTiers.map(({ id, label, range }) => ({ id, label, range })), ...(unsized ? [unsized] : [])] : undefined,
    items,
    asOf: data.asOf === undefined ? undefined : String(data.asOf),
    // Defaults fit the AI stack map, whose tags are model types (image, video, voice,
    // world, robotics) and whose values are market caps; other files say their own.
    labels: { keyType: "Tag", tagLegend: "the model type, when not text", valueLegend: "market cap or valuation", ...fileLabels } as SpanChartProps["labels"],
  };
}

/* ---------- ```stack: content/data/<name>.yaml -> LayerStack ---------- */

type StackHeads = Record<string, string>;

function stackProps(name: string): { props: LayerStackProps; heads: StackHeads } {
  const file = `content/data/${name}.yaml`;
  const data = only(file, "the file", load(file), ["sectionHeads", "zones", "layers", "rails", "brackets"], ["zones", "layers"]);
  kind(file, "sectionHeads", data.sectionHeads, "boolean");
  // A zone's optional `note` is shown beside its label ("MODELS · built once per model").
  const zones = list(file, "zones", data.zones).map((z, i) => only(file, `zones[${i}]`, z, ["id", "label", "note"], ["id", "label"]));
  const layers = list(file, "layers", data.layers).map((l, i) => {
    const layer = only(file, `layers[${i}]`, l, ["id", "label", "zone", "summary", "metric", "detail", "href"], ["id", "label", "zone", "summary"]);
    if (layer.metric !== undefined) only(file, `layers[${i}].metric`, layer.metric, ["value", "label"], ["value", "label"]);
    for (const key of ["detail", "href"]) kind(file, `layers[${i}].${key}`, layer[key], "string");
    return layer;
  });
  const rails = data.rails === undefined ? undefined : list(file, "rails", data.rails).map((r, i) => only(file, `rails[${i}]`, r, ["id", "label", "short", "from", "to", "summary", "href"], ["id", "label", "from", "to"]));
  const brackets = data.brackets === undefined ? undefined : list(file, "brackets", data.brackets).map((b, i) => only(file, `brackets[${i}]`, b, ["label", "from", "to"], ["label", "from", "to"]));
  // `metric` feeds each section's header strip (below); the diagram itself shows
  // only the layers, so it never receives the numbers.
  const bands = layers.map(({ metric: _metric, detail: _detail, ...band }) => band);
  const props = { id: name, zones, layers: bands, rails, brackets } as unknown as LayerStackProps;

  // sectionHeads: a strip above each section the diagram links to, with the layer's
  // number in the stack, its zone, its key number and a link back up to the map.
  // Rails get their layer range instead of a number. Off unless every link is unique.
  const heads: StackHeads = {};
  if (data.sectionHeads === true) {
    const zoneLabel = new Map(zones.map((z) => [z.id as string, z.label as string]));
    const position = new Map(layers.map((l, i) => [l.id as string, i + 1]));
    const pad = (n: number) => String(n).padStart(2, "0");
    const add = (href: unknown, head: Parameters<typeof LayerHead>[0], where: string) => {
      if (typeof href !== "string" || !href.startsWith("#")) throw new DataError(`${file}: sectionHeads needs an in-page href on ${where}`);
      if (heads[href]) throw new DataError(`${file}: sectionHeads needs one section per link, and ${href} is used twice`);
      heads[href] = renderToStaticMarkup(<LayerHead {...head} mapHref={`#${name}`} />);
    };
    for (const l of layers) {
      const metric = l.metric as { value: string; label: string } | undefined;
      add(l.href, { index: position.get(l.id as string)!, zone: zoneLabel.get(l.zone as string), metric }, `layer ${String(l.id)}`);
    }
    // Rails sit outside the zones; the article files their sections under one heading.
    for (const r of rails ?? []) {
      const from = position.get(r.from as string), to = position.get(r.to as string);
      if (!from || !to) throw new DataError(`${file}: rail ${String(r.id)} spans unknown layers`);
      add(r.href, { index: `${pad(Math.min(from, to))}–${pad(Math.max(from, to))}`, zone: "Beside the stack" }, `rail ${String(r.id)}`);
    }
  }
  return { props, heads };
}

/* ---------- ```notes: a cluster of cards for the site's own articles ---------- */

function noteCluster(label: string, body: string): string {
  const where = `\`\`\`notes ${label || "(no label)"}`;
  if (!label) throw new DataError(`${where}: put the cluster's label after \`\`\`notes, e.g. "My notes on inference"`);
  const known = new Set(articleSlugs());
  const notes: NoteCardProps[] = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)\s*:\s*(\S.*)$/.exec(line);
      if (!m) throw new DataError(`${where}: expected "slug: kicker" on each line, got "${line}"`);
      const [, slug, kicker] = m;
      if (!known.has(slug)) throw new DataError(`${where}: there is no content/articles/${slug}.md`);
      const { meta, body: text } = readArticle(slug);
      // A draft has no public page yet: it shows as a dashed "Coming next" card.
      if (meta.draft) return { title: meta.title, description: meta.description, kicker, status: "planned" as const };
      return { href: `/${slug}`, title: meta.title, description: meta.description, date: meta.date, minutes: readingTime(text), kicker };
    });
  if (!notes.length) throw new DataError(`${where}: list at least one article`);
  // `wide` asks uipack for the 56rem figure slot; app/globals.css keeps every
  // cluster on the text column instead, so the article column has one edge.
  return renderToStaticMarkup(<NoteCluster label={label} notes={notes} wide={notes.length >= 3} />);
}

/* ---------- render ---------- */

function main() {
  let written = 0;
  for (const job of jobs) {
    if (job.kind === "notes") {
      writeFileSync(path.join(OUT, `${job.id}.html`), noteCluster(job.label, job.body) + "\n");
      written++;
      continue;
    }
    const { id, kind: k, name } = job;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new DataError(`\`\`\`${k} fence names "${name}"; expected a kebab-case data file name under content/data/ without extension`);
    let html: string;
    try {
      // headingLevel "none": the charts sit inside articles, so their group and zone
      // labels must not enter the page outline (they become role="group" labels).
      if (k === "span") html = renderToStaticMarkup(<SpanChart {...spanProps(name)} headingLevel="none" />);
      else {
        const { props, heads } = stackProps(name);
        html = renderToStaticMarkup(<LayerStack {...props} headingLevel="none" />);
        writeFileSync(path.join(OUT, `${id}.heads.json`), JSON.stringify(heads, null, 1) + "\n");
      }
    } catch (e) {
      // The library names the chart and the item; say which file to edit.
      if (e instanceof DataError) throw e;
      throw new DataError(`content/data/${name}.yaml: ${(e as Error).message}`);
    }
    writeFileSync(path.join(OUT, `${id}.html`), html + "\n");
    written++;
  }
  console.log(`charts: ${written} file(s) from ${jobs.length} span/stack/notes fence(s)`);
}

try {
  main();
} catch (e) {
  console.error(e instanceof DataError ? `\nChart data error: ${e.message}\n` : e);
  process.exit(1);
}
