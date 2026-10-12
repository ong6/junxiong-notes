// Fetches a logo for each company in a ```span data file that has a `domain`
// and no logo in public/logos/ yet. Run by hand (`npm run logos`) after adding
// companies, then look at the new files before committing them. The build never
// fetches; render-charts.tsx only links logos already on disk, and a company
// without one gets a monogram tile.
//
//   npm run logos                 every content/data/*.yaml with `companies:` or `items:`
//   npm run logos -- ai-stack     one data file
//   npm run logos -- --force      re-fetch logos that already exist
//
// A logo you looked at and deleted (wrong company, unreadable) goes in
// content/data/logo-rejects.txt, one id per line, so it is not fetched again.
//
// Downloads are untrusted: each lands in a fresh temp directory and must parse as
// a PNG (signature + IHDR) or a baseline/progressive JPEG (SOI + SOF) of sane
// size, and must not be the service's generic globe, before it is copied to
// public/logos/<id>.png (or .jpg: the service rasterises SVG favicons to JPEG).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { parse } from "yaml";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "content", "data");
const REJECTS = path.join(DATA, "logo-rejects.txt");
const OUT = path.join(ROOT, "public", "logos");
const EXTS = ["png", "jpg"];
const SERVICE = (domain) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
const ALLOWED_HOSTS = /(^|\.)(google\.com|gstatic\.com)$/;
const MAX_BYTES = 200 * 1024;
// Shown in a 20px tile (40 device px on a 2x screen). The service's "no icon"
// globe and many old favicons are 16px, which upscale into mush; a monogram
// reads better.
const MIN_SIDE = 24;
const MAX_SIDE = 512;
const CONCURRENCY = 6;

const args = process.argv.slice(2);
const force = args.includes("--force");
const names = args.filter((a) => !a.startsWith("--"));

const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

/** { ext, width, height } from a PNG's IHDR, or null if `buf` is not a PNG. */
function pngSize(buf) {
	const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	if (buf.length < 33 || !buf.subarray(0, 8).equals(SIG)) return null;
	// The first chunk must be IHDR, 13 bytes long.
	if (buf.readUInt32BE(8) !== 13 || buf.toString("latin1", 12, 16) !== "IHDR") return null;
	return { ext: "png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** { ext, width, height } from a JPEG's first SOF segment, or null if `buf` is not a JPEG. */
function jpegSize(buf) {
	if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
	let i = 2;
	while (i + 9 < buf.length) {
		if (buf[i] !== 0xff) return null;
		const marker = buf[i + 1];
		if (marker === 0xff) { i++; continue; }
		const len = buf.readUInt16BE(i + 2);
		if (len < 2) return null;
		// SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC).
		if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
			return { ext: "jpg", height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
		}
		if (marker === 0xda || marker === 0xd9) return null; // scan data or end before any frame header
		i += 2 + len;
	}
	return null;
}

async function download(url) {
	const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
	const host = new URL(res.url).hostname;
	if (!ALLOWED_HOSTS.test(host)) throw new Error(`redirected off the favicon service to ${host}`);
	const len = Number(res.headers.get("content-length") ?? 0);
	if (len > MAX_BYTES) throw new Error(`${len} bytes, over the ${MAX_BYTES} limit`);
	const buf = Buffer.from(await res.arrayBuffer());
	if (buf.length > MAX_BYTES) throw new Error(`${buf.length} bytes, over the ${MAX_BYTES} limit`);
	return { status: res.status, buf };
}

function companies() {
	const files = fs.readdirSync(DATA).filter((f) => f.endsWith(".yaml"));
	const out = [];
	for (const file of files) {
		const name = file.replace(/\.yaml$/, "");
		if (names.length && !names.includes(name)) continue;
		const data = parse(fs.readFileSync(path.join(DATA, file), "utf8"));
		const rows = data?.companies ?? data?.items;
		if (!Array.isArray(rows)) continue;
		for (const c of rows) {
			if (typeof c?.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.id)) throw new Error(`${file}: company id ${JSON.stringify(c?.id)} is not kebab-case`);
			if (typeof c.domain !== "string" || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(c.domain)) continue;
			out.push({ id: c.id, name: c.name, domain: c.domain.toLowerCase() });
		}
	}
	return out;
}

const existing = (id) => EXTS.map((ext) => path.join(OUT, `${id}.${ext}`)).filter((f) => fs.existsSync(f));

async function main() {
	fs.mkdirSync(OUT, { recursive: true });
	const rejected = new Set(
		fs.existsSync(REJECTS)
			? fs.readFileSync(REJECTS, "utf8").split("\n").map((l) => l.replace(/#.*/, "").trim()).filter(Boolean)
			: [],
	);
	const todo = companies().filter((c) => !rejected.has(c.id) && (force || !existing(c.id).length));
	if (!todo.length) {
		console.log("logos: nothing to fetch");
		return;
	}
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "notes-logos-"));
	try {
		// The service's fallback for a domain with no icon: a generic globe.
		const globe = await download(SERVICE(`no-such-site-${crypto.randomUUID().slice(0, 8)}.invalid`));
		const globeHash = sha(globe.buf);

		const results = { saved: [], skipped: [] };
		const queue = [...todo];
		const worker = async () => {
			for (let c = queue.shift(); c; c = queue.shift()) {
				try {
					const { status, buf } = await download(SERVICE(c.domain));
					if (status !== 200) throw new Error(`HTTP ${status} (no icon)`);
					const staged = path.join(tmp, `${c.id}.download`);
					fs.writeFileSync(staged, buf);
					const bytes = fs.readFileSync(staged);
					if (sha(bytes) === globeHash) throw new Error("generic globe");
					const image = pngSize(bytes) ?? jpegSize(bytes);
					if (!image) throw new Error("neither PNG nor JPEG");
					const { ext, width, height } = image;
					const side = Math.min(width, height);
					if (side < MIN_SIDE) throw new Error(`too small (${width}x${height})`);
					if (Math.max(width, height) > MAX_SIDE) throw new Error(`too large (${width}x${height})`);
					if (Math.max(width, height) / side > 1.25) throw new Error(`not square enough (${width}x${height})`);
					for (const old of existing(c.id)) fs.unlinkSync(old);
					fs.copyFileSync(staged, path.join(OUT, `${c.id}.${ext}`));
					results.saved.push(`${c.id}.${ext} (${width}x${height})`);
				} catch (e) {
					results.skipped.push(`${c.id} [${c.domain}]: ${e.message}`);
				}
			}
		};
		await Promise.all(Array.from({ length: CONCURRENCY }, worker));
		console.log(`logos: ${results.saved.length} saved to public/logos/, ${results.skipped.length} skipped`);
		for (const s of results.skipped.sort()) console.log(`  skipped ${s}`);
		if (results.saved.length) console.log("Look at the new files before committing; delete any that are wrong and list them in content/data/logo-rejects.txt.");
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true });
	}
}

main().catch((e) => {
	console.error(`logos: ${e.message}`);
	process.exit(1);
});
