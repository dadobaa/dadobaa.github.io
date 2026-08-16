#!/usr/bin/env node
/**
 * Turns products.csv — the one file anyone edits — into json/products.json,
 * which the rest of the build reads.
 *
 *   npm run build
 *
 * products.csv opens in Excel, Numbers or Google Sheets. Add a row to add a
 * product, delete a row to remove one, change a cell to edit one.
 *
 * Every error message here is written for someone who does not code. If
 * anything is wrong, this stops and NOTHING is published — the live website is
 * left exactly as it was.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSV = path.join(ROOT, 'products.csv');
const OUT = path.join(ROOT, 'json/products.json');
const IMG_DIR = path.join(ROOT, 'img/products');

const COLUMNS = ['ID', 'Category', 'Category Description', 'Product Name',
                 'Description', 'Size', 'Price', 'Photo File Name', 'WhatsApp Link'];

/* ---------- a small, correct CSV reader (handles quotes and commas) ---------- */
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  text = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ''));
}

function slugify(name) {
  return String(name).toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fail(lines) {
  console.error('\n' + lines.join('\n') + '\n\nNothing has been published. The website is unchanged.\n');
  process.exit(1);
}

/* ---------- read ---------- */
if (!fs.existsSync(CSV)) fail(['PROBLEM: products.csv is missing.']);

const rows = parseCsv(fs.readFileSync(CSV, 'utf8'));
if (rows.length < 2) fail(['PROBLEM: products.csv has no products in it, only a heading row.']);

const header = rows[0].map(h => h.trim());
const missingCols = COLUMNS.filter(c => !header.includes(c));
if (missingCols.length) {
  fail([
    'PROBLEM: products.csv is missing some columns.',
    '',
    '  Missing: ' + missingCols.join(', '),
    '',
    'The heading row must contain all of these, spelled exactly:',
    '  ' + COLUMNS.join(' | ')
  ]);
}

const at = name => header.indexOf(name);
const problems = [];
const warnings = [];

// Slugs already in use, so a product keeps its web address even if renamed.
let existingSlugs = {};
let existingNames = {};
let existingCatIds = {};
let highestIdEverUsed = 0;
try {
  const prev = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  (prev.categories || []).forEach(c => {
    if (c.name && c.id) existingCatIds[c.name] = c.id;
    (c.products || []).forEach(p => {
      if (p.id != null && p.slug) { existingSlugs[p.id] = p.slug; existingNames[p.id] = p.name; }
      if (typeof p.id === 'number') highestIdEverUsed = Math.max(highestIdEverUsed, p.id);
    });
  });
} catch (e) { /* first run — fine */ }

const images = fs.existsSync(IMG_DIR) ? fs.readdirSync(IMG_DIR) : [];
const usedIds = new Set();
const usedSlugs = new Map();
const categories = new Map();

// Rows without an ID get a fresh number ABOVE every id ever used. Recycling a
// freed id would hand a new product the deleted product's web address.
let nextId = 0;
const takeNextId = () => {
  nextId = Math.max(nextId + 1, highestIdEverUsed + 1);
  while (usedIds.has(nextId)) nextId++;
  return nextId;
};

rows.slice(1).forEach((cells, i) => {
  const line = i + 2;                       // spreadsheet row number, header is row 1
  const get = c => (cells[at(c)] || '').trim();
  const at_ = `row ${line}`;

  const name = get('Product Name');
  const catName = get('Category');
  if (!name) { problems.push(`${at_}: no product name.`); return; }
  if (!catName) { problems.push(`${at_} ("${name}"): no category.`); return; }

  /* id */
  const rawId = get('ID');
  let id;
  if (rawId === '') id = null;                 // fill in later
  else if (!/^\d+$/.test(rawId)) problems.push(`${at_} ("${name}"): the ID must be a whole number, but it says "${rawId}". You can also leave it blank and one will be filled in.`);
  else {
    id = Number(rawId);
    if (usedIds.has(id)) problems.push(`${at_} ("${name}"): the ID ${id} is already used by another product. Each product needs its own, or leave it blank.`);
    else usedIds.add(id);
  }

  /* price */
  const rawPrice = get('Price').replace(/[₹,\s]/g, '');
  let price = null;
  if (rawPrice === '') problems.push(`${at_} ("${name}"): no price.`);
  else if (!/^\d+(\.\d+)?$/.test(rawPrice)) problems.push(`${at_} ("${name}"): the price should be just a number, like 480. It currently says "${get('Price')}".`);
  else price = Number(rawPrice);

  /* the rest */
  const size = get('Size');
  const image = get('Photo File Name').replace(/\.(jpe?g|png|webp|avif)$/i, '');
  const wa = get('WhatsApp Link');
  const desc = get('Description');

  if (!size) problems.push(`${at_} ("${name}"): no size. For example "950 ml" or "1 kg".`);
  if (!image) problems.push(`${at_} ("${name}"): no photo file name.`);
  else if (!images.includes(image + '.jpg')) {
    problems.push(`${at_} ("${name}"): there is no photo called "${image}.jpg" in the img/products folder. Check the spelling — capital letters matter.`);
  }
  if (!wa) problems.push(`${at_} ("${name}"): no WhatsApp link.`);
  else if (!/^https:\/\/wa\.me\//.test(wa)) problems.push(`${at_} ("${name}"): the WhatsApp link should start with https://wa.me/ — it currently says "${wa}".`);
  if (desc.length < 20) warnings.push(`${at_} ("${name}"): the description is very short. Google shows this text, so a sentence or two helps.`);

  if (!categories.has(catName)) {
    categories.set(catName, { id: existingCatIds[catName] || slugify(catName), name: catName, blurb: get('Category Description'), products: [] });
  } else if (get('Category Description') && !categories.get(catName).blurb) {
    categories.get(catName).blurb = get('Category Description');
  }

  categories.get(catName).products.push({ _line: line, id, name, desc, weight: size, price, whatsappLink: wa, image });
});

/* fill blank IDs, then work out web addresses */
categories.forEach(cat => cat.products.forEach(p => {
  if (p.id == null) { p.id = takeNextId(); usedIds.add(p.id); }
}));

categories.forEach(cat => cat.products.forEach(p => {
  p.slug = (existingNames[p.id] === p.name && existingSlugs[p.id]) ? existingSlugs[p.id] : slugify(p.name);
  if (usedSlugs.has(p.slug)) {
    problems.push(`row ${p._line} ("${p.name}"): this would use the same web address as "${usedSlugs.get(p.slug)}". Give one of them a slightly different name.`);
  } else usedSlugs.set(p.slug, p.name);
  delete p._line;
}));

/* ---------- report ---------- */
if (warnings.length) {
  console.log('\nWorth a look (these will not stop publishing):');
  warnings.forEach(w => console.log(`  - ${w}`));
}

if (problems.length) {
  fail([`Found ${problems.length} problem${problems.length > 1 ? 's' : ''} in products.csv:`, '',
        ...problems.map(p => '  - ' + p)]);
}

fs.writeFileSync(OUT, JSON.stringify({ categories: [...categories.values()] }, null, 2) + '\n');

const total = [...categories.values()].reduce((s, c) => s + c.products.length, 0);
console.log(`  products.csv read: ${total} products in ${categories.size} categories`);
