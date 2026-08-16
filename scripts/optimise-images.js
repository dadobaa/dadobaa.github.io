#!/usr/bin/env node
/**
 * Optimises everything in img/ for the web.
 *
 *   npm run optimise:img
 *
 * For each source JPEG/PNG it writes an .avif, a .webp and a resized fallback
 * in the original format, so the <picture> elements on the site can serve the
 * smallest thing each browser understands.
 *
 * Originals are moved to img/_originals/ (gitignored) the first time a file is
 * processed, and are always re-read from there — so running this repeatedly
 * never recompresses an already-compressed file.
 */
const sharp = require('sharp');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ORIGINALS = path.join(ROOT, 'img', '_originals');

// Display widths. Product cards render ~300px, so 800 covers a 2x screen.
const WIDTHS = {
  'img/Banner-2': 2000,
  'img/Banner': 1200,
  'img/Banner-1': 1200,
  'img/Banner-product': 900,
  'img/about': 800,
  'img/video-poster': 720,
  'img/Brand-logo': 480,
  'img/Brand-logo-sm': 216
};
const DEFAULT_WIDTH = 800; // everything in img/products/

const QUALITY = { avif: 55, webp: 80, jpeg: 80 };

function fmt(b) {
  return b > 1048576 ? (b / 1048576).toFixed(1) + 'MB' : (b / 1024).toFixed(0) + 'KB';
}

function targetWidth(relNoExt) {
  return WIDTHS[relNoExt] != null ? WIDTHS[relNoExt] : DEFAULT_WIDTH;
}

/**
 * A record of which files this script has already produced, so it never
 * re-compresses its own output.
 *
 * This is needed because img/_originals is deliberately not committed. On a
 * fresh checkout (a CI run, or a new machine) there are no pristine copies, so
 * without this the script would re-compress an already-compressed file and lose
 * a little quality on every run. The manifest IS committed.
 */
const MANIFEST = path.join(ROOT, 'img', '.optimised.json');

function loadManifest() {
  try { return JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (e) { return {}; }
}

function hashOf(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

async function processOne(rel) {
  const abs = path.join(ROOT, rel);
  const dir = path.dirname(abs);
  const ext = path.extname(abs);
  const base = path.basename(abs, ext);
  const relNoExt = rel.slice(0, -ext.length);

  // Keep a pristine copy so repeat runs stay lossless-from-source.
  const originalPath = path.join(ORIGINALS, rel);
  const hadOriginal = fs.existsSync(originalPath);

  // If the file on disk is exactly what we produced last time, there is nothing
  // to do — whether or not a pristine original happens to be available.
  if (manifest[rel] === hashOf(abs)) return null;

  fs.mkdirSync(path.dirname(originalPath), { recursive: true });
  if (!hadOriginal) fs.copyFileSync(abs, originalPath);

  const before = fs.statSync(originalPath).size;
  const width = targetWidth(relNoExt);
  const isPng = /\.png$/i.test(ext);

  const pipe = () => sharp(originalPath, { failOn: 'none' })
    .rotate()                                     // bake in EXIF orientation
    .resize({ width, withoutEnlargement: true });

  await pipe().avif({ quality: QUALITY.avif, effort: 4 }).toFile(path.join(dir, base + '.avif'));
  await pipe().webp({ quality: QUALITY.webp, effort: 5 }).toFile(path.join(dir, base + '.webp'));

  const tmp = abs + '.tmp';
  if (isPng) {
    await pipe().png({ compressionLevel: 9, palette: true }).toFile(tmp);
  } else {
    await pipe().jpeg({ quality: QUALITY.jpeg, mozjpeg: true, progressive: true }).toFile(tmp);
  }
  fs.renameSync(tmp, abs);

  manifest[rel] = hashOf(abs);       // remember our own output
  return { rel, before, after: fs.statSync(abs).size };
}

// Files like Banner-2-1000.jpg are generated responsive variants, not sources.
const VARIANT = /-\d{3,4}\.(jpe?g|png)$/i;

function collect(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '_originals') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (/\.(jpe?g|png)$/i.test(entry.name) && !VARIANT.test(entry.name)) {
      out.push(path.relative(ROOT, full));
    }
  }
  return out;
}

const manifest = loadManifest();

(async () => {
  const files = collect(path.join(ROOT, 'img'));
  if (!files.length) return console.log('No images found under img/.');

  let totalBefore = 0, totalAfter = 0;
  let skipped = 0;
  for (const rel of files) {
    const r = await processOne(rel);
    if (!r) { skipped++; continue; }
    totalBefore += r.before;
    totalAfter += r.after;
    console.log(`${r.rel.padEnd(52)} ${fmt(r.before).padStart(8)} -> ${fmt(r.after).padStart(8)}`);
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  if (skipped) console.log(`  ${skipped} image(s) already done — left untouched`);
  if (!totalBefore) { console.log('  Nothing new to process.'); return; }

  console.log(`\n${files.length} images: ${fmt(totalBefore)} -> ${fmt(totalAfter)} ` +
              `(${(100 - (totalAfter / totalBefore) * 100).toFixed(1)}% smaller, plus .webp/.avif variants)`);
})().catch(err => {
  console.error('Image optimisation failed:', err);
  process.exit(1);
});
