/* @jsxRuntime automatic @jsxImportSource react */
// Renders ```span and ```stack fences to static HTML through uipack/charts.
// Called by render-diagrams.mjs with a JSON list of { id, kind, name } jobs:
// `name` is a data file under content/data/ (no extension), `id` the fence hash
// the article resolves. This file only maps the YAML onto the components' props;
// layout, behaviour and validation of the chart itself live in uipack.
//
// Bad data fails the build: YAML syntax errors, unknown fields (usually typos),
// wrong types, and everything the library rejects (unknown layers, duplicate ids).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { parse } from "yaml";
import { LayerStack, SpanChart, type LayerStackProps, type SpanChartProps, type SpanItem } from "uipack/charts";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "content", "diagrams");
const LOGOS = path.join(ROOT, "public", "logos");
const jobs: { id: string; kind: "span" | "stack"; name: string }[] = JSON.parse(process.argv[2] ?? "[]");

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
  const data = only(file, "the file", load(file), ["asOf", "zones", "layers", "sizeTiers", "unsizedTier", "companies"], ["layers", "companies"]);

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

  const items: SpanItem[] = list(file, "companies", data.companies).map((c, i) => {
    const where = `companies[${i}]${c && typeof c === "object" && "id" in c ? ` (${String((c as Obj).id)})` : ""}`;
    const co = only(file, where, c, ["id", "name", "domain", "primary", "also", "tags", "featured", "note", "status", "source", "valuation"], ["id", "name", "primary"]);
    for (const key of ["id", "name", "domain", "primary", "note", "source"]) kind(file, `${where}.${key}`, co[key], "string");
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
      valueLabel: display || (usdB === undefined ? undefined : formatUsdB(usdB)) || "—",
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
    // Tags in this data are model types (image, video, voice, world, robotics).
    labels: { tagLegend: "model type" },
  };
}

/* ---------- ```stack: content/data/<name>.yaml -> LayerStack ---------- */

function stackProps(name: string): LayerStackProps {
  const file = `content/data/${name}.yaml`;
  const data = only(file, "the file", load(file), ["zones", "layers", "rails", "brackets"], ["zones", "layers"]);
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
  return { id: name, zones, layers, rails, brackets } as unknown as LayerStackProps;
}

/* ---------- render ---------- */

function main() {
  let written = 0;
  for (const { id, kind: k, name } of jobs) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new DataError(`\`\`\`${k} fence names "${name}"; expected a kebab-case data file name under content/data/ without extension`);
    let html: string;
    try {
      // headingLevel "none": the charts sit inside articles, so their group and zone
      // labels must not enter the page outline (they become role="group" labels).
      html =
        k === "span"
          ? renderToStaticMarkup(<SpanChart {...spanProps(name)} headingLevel="none" />)
          : renderToStaticMarkup(<LayerStack {...stackProps(name)} headingLevel="none" />);
    } catch (e) {
      // The library names the chart and the item; say which file to edit.
      if (e instanceof DataError) throw e;
      throw new DataError(`content/data/${name}.yaml: ${(e as Error).message}`);
    }
    writeFileSync(path.join(OUT, `${id}.html`), html + "\n");
    written++;
  }
  console.log(`charts: ${written} file(s) from ${jobs.length} span/stack fence(s)`);
}

try {
  main();
} catch (e) {
  console.error(e instanceof DataError ? `\nChart data error: ${e.message}\n` : e);
  process.exit(1);
}
