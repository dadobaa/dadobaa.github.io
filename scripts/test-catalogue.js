#!/usr/bin/env node
/**
 * Tests the products.csv pipeline end to end.
 *
 *   npm test
 *
 * Covers: adding, editing and deleting products and categories; every
 * validation rule; and the awkward real-world cases — Excel's byte-order mark,
 * Windows line endings, commas and quotes inside fields, Hindi text, apostrophes
 * in names, and HTML typed into a cell.
 *
 * It works on the real files, so it snapshots them first and always puts them
 * back, even if a test throws. It fails loudly if the repo is left dirty.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CSV = path.join(ROOT, 'products.csv');
const JSON_OUT = path.join(ROOT, 'json/products.json');
const PRODUCTS_DIR = path.join(ROOT, 'products');
const INDEX = path.join(ROOT, 'index.html');
const SITEMAP = path.join(ROOT, 'sitemap.xml');

const COLS = ['ID', 'Category', 'Category Description', 'Product Name',
              'Description', 'Size', 'Price', 'Photo File Name', 'WhatsApp Link'];

let pass = 0, fail = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; failures.push(`${name}${detail ? ' — ' + detail : ''}`); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
}

/* ---------- snapshot / restore ---------- */
const snapDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dadobaa-test-'));
function snapshot() {
  fs.copyFileSync(CSV, path.join(snapDir, 'products.csv'));
  fs.copyFileSync(JSON_OUT, path.join(snapDir, 'products.json'));
  fs.copyFileSync(INDEX, path.join(snapDir, 'index.html'));
  fs.copyFileSync(SITEMAP, path.join(snapDir, 'sitemap.xml'));
  fs.cpSync(PRODUCTS_DIR, path.join(snapDir, 'products'), { recursive: true });
}
function restore() {
  fs.copyFileSync(path.join(snapDir, 'products.csv'), CSV);
  fs.copyFileSync(path.join(snapDir, 'products.json'), JSON_OUT);
  fs.copyFileSync(path.join(snapDir, 'index.html'), INDEX);
  fs.copyFileSync(path.join(snapDir, 'sitemap.xml'), SITEMAP);
  fs.rmSync(PRODUCTS_DIR, { recursive: true, force: true });
  fs.cpSync(path.join(snapDir, 'products'), PRODUCTS_DIR, { recursive: true });
}

/* ---------- helpers ---------- */
const csvCell = v => {
  v = String(v == null ? '' : v);
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
};
const toCsv = rows =>
  [COLS.join(','), ...rows.map(r => COLS.map(c => csvCell(r[c])).join(','))].join('\n') + '\n';

function baseRows() {
  const d = JSON.parse(fs.readFileSync(path.join(snapDir, 'products.json'), 'utf8'));
  const rows = [];
  d.categories.forEach(cat => cat.products.forEach((p, i) => rows.push({
    'ID': p.id, 'Category': cat.name, 'Category Description': i === 0 ? (cat.blurb || '') : '',
    'Product Name': p.name, 'Description': p.desc || '', 'Size': p.weight,
    'Price': p.price, 'Photo File Name': p.image, 'WhatsApp Link': p.whatsappLink
  })));
  return rows;
}

/** Runs a script; returns {code, out}. Never throws. */
function run(script) {
  try {
    const out = execFileSync('node', [path.join(ROOT, 'scripts', script)],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status == null ? 1 : e.status, out: (e.stdout || '') + (e.stderr || '') };
  }
}

/** Write a CSV (string or rows) and convert it. */
function convert(csv) {
  fs.writeFileSync(CSV, typeof csv === 'string' ? csv : toCsv(csv));
  return run('csv-to-products.js');
}

/** Full rebuild of the generated pages (skips image work — no deps needed). */
function rebuild() {
  const a = run('build-product-pages.js');
  const b = run('build-catalogue.js');
  const c = run('build-sitemap.js');
  return { code: a.code || b.code || c.code, out: a.out + b.out + c.out };
}

const readJson = () => JSON.parse(fs.readFileSync(JSON_OUT, 'utf8'));
const allProducts = () => readJson().categories.flatMap(c => c.products);
const findProduct = n => allProducts().find(p => p.name === n);
const pageExists = slug => fs.existsSync(path.join(PRODUCTS_DIR, slug + '.html'));
const pageCount = () => fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.html')).length;
const sitemapCount = () => (fs.readFileSync(SITEMAP, 'utf8').match(/<loc>/g) || []).length;
const homeCards = () => (fs.readFileSync(INDEX, 'utf8').match(/class="product-item/g) || []).length;

/* ================= tests ================= */
snapshot();
const BASE = baseRows();
const BASE_COUNT = BASE.length;

try {
  console.log('\n--- baseline ---');
  {
    const r = convert(BASE);
    check('unchanged spreadsheet converts cleanly', r.code === 0, r.out.trim().split('\n').pop());
    rebuild();
    check('baseline counts line up',
      pageCount() === BASE_COUNT && homeCards() === BASE_COUNT && sitemapCount() === BASE_COUNT + 4,
      `pages ${pageCount()}, cards ${homeCards()}, sitemap ${sitemapCount()}`);
  }

  console.log('\n--- create / update / delete: products ---');
  {
    const rows = baseRows();
    rows.push({ 'ID': '', 'Category': 'Hair & Skin Care', 'Category Description': '',
      'Product Name': 'Avocado Oil', 'Description': 'Cold pressed avocado oil, rich and buttery, suited to very dry skin.',
      'Size': '100 ml', 'Price': '450', 'Photo File Name': 'Avocado-Oil', 'WhatsApp Link': 'https://wa.me/919820175000' });
    check('add a product with a blank ID', convert(rows).code === 0);
    rebuild();
    const p = findProduct('Avocado Oil');
    check('  it gets an ID automatically', !!p && typeof p.id === 'number', p && `id ${p.id}`);
    check('  it gets its own page', p && pageExists(p.slug), p && p.slug);
    check('  counts all moved by one',
      pageCount() === BASE_COUNT + 1 && homeCards() === BASE_COUNT + 1 && sitemapCount() === BASE_COUNT + 5);
  }
  {
    const rows = baseRows().filter(r => r['Product Name'] !== 'Cranberries');
    check('delete a product', convert(rows).code === 0);
    rebuild();
    check('  its page is removed', !pageExists('cranberries'));
    check('  it leaves the sitemap', !fs.readFileSync(SITEMAP, 'utf8').includes('cranberries'));
    check('  counts drop by one', pageCount() === BASE_COUNT - 1 && homeCards() === BASE_COUNT - 1);
  }
  {
    // The dangerous one: delete then add, so an ID is freed and reused.
    let rows = baseRows().filter(r => r['Product Name'] !== 'Cranberries');
    rows.push({ 'ID': '', 'Category': 'Dry Fruits & Superfoods', 'Category Description': '',
      'Product Name': 'Dried Figs', 'Description': 'Soft dried Afghan figs, naturally sweet and unsulphured.',
      'Size': '500 gms', 'Price': '900', 'Photo File Name': 'Cranberries', 'WhatsApp Link': 'https://wa.me/919820175000' });
    convert(rows); rebuild();
    const figs = findProduct('Dried Figs');
    check('a new product never inherits a deleted product\'s web address',
      figs && figs.slug === 'dried-figs', figs && figs.slug);
    check('  and never reuses its ID', figs && figs.id > 28, figs && `id ${figs.id}`);
  }
  {
    const rows = baseRows();
    rows.find(r => r['Product Name'] === 'Argan Oil')['Description'] = 'EDITED description for the argan oil product page.';
    rows.find(r => r['Product Name'] === 'Argan Oil')['Price'] = '399';
    rows.find(r => r['Product Name'] === 'Argan Oil')['Size'] = '75 ml';
    convert(rows); rebuild();
    const html = fs.readFileSync(path.join(PRODUCTS_DIR, 'argan-oil.html'), 'utf8');
    check('editing a description reaches the page', html.includes('EDITED description'));
    check('editing the size reaches the page', html.includes('75 ml'));
    check('editing the price reaches the data', findProduct('Argan Oil').price === 399);
  }
  {
    const rows = baseRows();
    rows.find(r => r['Product Name'] === 'Argan Oil')['Product Name'] = 'Moroccan Argan Oil';
    convert(rows); rebuild();
    const p = findProduct('Moroccan Argan Oil');
    check('renaming a product keeps its web address (shared links keep working)',
      p && p.slug === 'argan-oil', p && p.slug);
  }
  {
    const rows = baseRows();
    rows.find(r => r['Product Name'] === 'Argan Oil')['Category'] = 'Cooking Oils & Ghee';
    convert(rows); rebuild();
    const d = readJson();
    const inCooking = d.categories.find(c => c.name === 'Cooking Oils & Ghee').products.some(p => p.name === 'Argan Oil');
    check('moving a product between categories works', inCooking);
    check('  and it keeps its web address', findProduct('Argan Oil').slug === 'argan-oil');
  }

  console.log('\n--- create / update / delete: categories ---');
  {
    const rows = baseRows();
    rows.push({ 'ID': '', 'Category': 'Gift Hampers', 'Category Description': 'Ready made gift boxes for Diwali and weddings.',
      'Product Name': 'Diwali Hamper', 'Description': 'A gift box of wood pressed oil, ghee and saffron, packed for gifting.',
      'Size': '1 box', 'Price': '2500', 'Photo File Name': 'Coconut-Sugar', 'WhatsApp Link': 'https://wa.me/919820175000' });
    convert(rows); rebuild();
    const d = readJson();
    check('typing a new category name creates it', d.categories.some(c => c.name === 'Gift Hampers'));
    check('  its description is picked up',
      (d.categories.find(c => c.name === 'Gift Hampers') || {}).blurb?.startsWith('Ready made'));
    check('  it appears on the home page', fs.readFileSync(INDEX, 'utf8').includes('Gift Hampers'));
  }
  {
    const rows = baseRows().map(r => r['Category'] === 'Essential Oils' ? { ...r, 'Category': 'Aromatherapy Oils' } : r);
    convert(rows); rebuild();
    const d = readJson();
    check('renaming a category works',
      d.categories.some(c => c.name === 'Aromatherapy Oils') && !d.categories.some(c => c.name === 'Essential Oils'));
    check('  products inside keep their web addresses', pageExists('rosemary-essential-oil'));
  }
  {
    const rows = baseRows().filter(r => r['Category'] !== 'Dry Fruits & Superfoods');
    const removed = BASE.filter(r => r['Category'] === 'Dry Fruits & Superfoods').length;
    convert(rows); rebuild();
    check('deleting every row removes the category',
      !readJson().categories.some(c => c.name === 'Dry Fruits & Superfoods'));
    check('  and all its pages go with it',
      pageCount() === BASE_COUNT - removed && !pageExists('kashmiri-organic-saffron'));
  }
  {
    const rows = baseRows();
    const cooking = rows.filter(r => r['Category'] === 'Cooking Oils & Ghee');
    const rest = rows.filter(r => r['Category'] !== 'Cooking Oils & Ghee');
    convert([...rest, ...cooking]); rebuild();
    check('category order follows first appearance in the sheet',
      readJson().categories[0].name !== 'Cooking Oils & Ghee', readJson().categories[0].name);
  }
  {
    const rows = baseRows();
    const [a, b] = [rows[0], rows[1]];
    rows[0] = b; rows[1] = a;
    convert(rows); rebuild();
    check('product order follows row order',
      readJson().categories[0].products[0].name === b['Product Name']);
  }

  console.log('\n--- mistakes that must stop the build ---');
  const mustFail = [
    ['price written as text', r => { r[0]['Price'] = 'Rs. 480/-'; }],
    ['price left empty', r => { r[0]['Price'] = ''; }],
    ['price that is not a number', r => { r[0]['Price'] = 'free'; }],
    ['no product name', r => { r[0]['Product Name'] = ''; }],
    ['no category', r => { r[0]['Category'] = ''; }],
    ['no size', r => { r[0]['Size'] = ''; }],
    ['no photo file name', r => { r[0]['Photo File Name'] = ''; }],
    ['photo that does not exist', r => { r[0]['Photo File Name'] = 'Not-A-Real-Photo'; }],
    ['no WhatsApp link', r => { r[0]['WhatsApp Link'] = ''; }],
    ['WhatsApp link pointing somewhere else', r => { r[0]['WhatsApp Link'] = 'https://example.com/order'; }],
    ['two products sharing an ID', r => { r[1]['ID'] = r[0]['ID']; }],
    ['an ID that is not a number', r => { r[0]['ID'] = 'abc'; }],
    ['two products with the same name', r => { r[1]['Product Name'] = r[0]['Product Name']; }],
  ];
  for (const [label, mutate] of mustFail) {
    const rows = baseRows();
    mutate(rows);
    const before = fs.readFileSync(JSON_OUT, 'utf8');
    const r = convert(rows);
    const untouched = fs.readFileSync(JSON_OUT, 'utf8') === before;
    check(`stops on: ${label}`, r.code !== 0 && untouched,
      r.code === 0 ? 'build did NOT stop' : (untouched ? '' : 'catalogue was modified anyway'));
  }
  {
    const raw = toCsv(baseRows()).split('\n');
    raw[0] = raw[0].replace('Price,', '');            // drop a column from the heading
    const r = convert(raw.join('\n'));
    check('stops on: a missing column', r.code !== 0 && /missing some columns/i.test(r.out));
  }
  {
    const r = convert('ID,Category,Category Description,Product Name,Description,Size,Price,Photo File Name,WhatsApp Link\n');
    check('stops on: a spreadsheet with no products', r.code !== 0);
  }
  {
    const before = fs.readFileSync(JSON_OUT, 'utf8');
    fs.rmSync(CSV);
    const r = run('csv-to-products.js');
    check('stops on: the spreadsheet being missing',
      r.code !== 0 && fs.readFileSync(JSON_OUT, 'utf8') === before);
    fs.writeFileSync(CSV, toCsv(BASE));
  }

  console.log('\n--- awkward real-world data ---');
  {
    const rows = baseRows();
    rows[0]['Description'] = 'Rich, nutty, and golden — good for frying, tempering, and everyday cooking.';
    const r = convert(rows);
    check('commas inside a description survive', r.code === 0 &&
      findProduct(rows[0]['Product Name']).desc.includes('frying, tempering'));
  }
  {
    const rows = baseRows();
    rows[0]['Description'] = 'Known locally as "lakdi ghani" oil, pressed slowly on a wooden press.';
    convert(rows); rebuild();
    const html = fs.readFileSync(path.join(PRODUCTS_DIR, rows[0]['Product Name'].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html'), 'utf8');
    check('double quotes inside a description survive', findProduct(rows[0]['Product Name']).desc.includes('"lakdi ghani"'));
    check('  and are escaped safely in the HTML', html.includes('&quot;lakdi ghani&quot;') || html.includes('"lakdi ghani"'));
  }
  {
    const rows = baseRows();
    rows[0]['Description'] = 'First line of the description.\nSecond line of the description.';
    const r = convert(rows);
    check('a line break inside a cell survives', r.code === 0 &&
      findProduct(rows[0]['Product Name']).desc.includes('Second line'));
  }
  {
    const rows = baseRows();
    rows[0]['Description'] = 'शुद्ध लकड़ी घानी मूंगफली तेल — पारंपरिक तरीके से बनाया गया।';
    const r = convert(rows);
    check('Hindi text survives', r.code === 0 && findProduct(rows[0]['Product Name']).desc.includes('मूंगफली'));
  }
  {
    const r = convert('﻿' + toCsv(baseRows()));
    check('Excel byte-order mark is handled', r.code === 0 && allProducts().length === BASE_COUNT);
  }
  {
    const r = convert(toCsv(baseRows()).replace(/\n/g, '\r\n'));
    check('Windows line endings are handled', r.code === 0 && allProducts().length === BASE_COUNT);
  }
  {
    const rows = baseRows();
    rows.forEach(r => { r['Product Name'] = '  ' + r['Product Name'] + '  '; r['Price'] = ' ' + r['Price'] + ' '; });
    const r = convert(rows);
    check('stray spaces around values are trimmed', r.code === 0 &&
      allProducts().every(p => p.name === p.name.trim() && typeof p.price === 'number'));
  }
  {
    const rows = baseRows();
    rows[0]['Price'] = '₹1,250';
    const r = convert(rows);
    check('a price typed as ₹1,250 is understood', r.code === 0 && findProduct(rows[0]['Product Name']).price === 1250);
  }
  {
    const rows = baseRows();
    rows[0]['Price'] = '499.50';
    const r = convert(rows);
    check('a price with paise is accepted', r.code === 0 && findProduct(rows[0]['Product Name']).price === 499.5);
  }
  {
    const rows = baseRows();
    rows[0]['Photo File Name'] = rows[0]['Photo File Name'] + '.jpg';
    const r = convert(rows);
    check('typing the photo name with .jpg still works', r.code === 0);
  }
  {
    const csv = toCsv(baseRows()).split('\n');
    csv.splice(3, 0, '', '   ,,,,,,,,');
    const r = convert(csv.join('\n'));
    check('blank rows in the middle are ignored', r.code === 0 && allProducts().length === BASE_COUNT);
  }
  {
    // Apostrophes and brackets already exist in the real data.
    convert(baseRows()); rebuild();
    check('a name with an apostrophe makes a clean web address', pageExists('fuller-s-earth-multani-mitti'));
    check('a name with brackets makes a clean web address', pageExists('kashmiri-mamra-almonds-organic'));
    check('an ampersand in a category is escaped on the page',
      fs.readFileSync(INDEX, 'utf8').includes('Cooking Oils &amp; Ghee'));
  }
  {
    const rows = baseRows();
    rows[0]['Product Name'] = 'Test <script>alert(1)</script> Oil';
    rows[0]['Description'] = 'Nasty <img src=x onerror=alert(1)> description';
    convert(rows); rebuild();
    const idx = fs.readFileSync(INDEX, 'utf8');
    // What matters is that no user text can ever open an HTML tag. The literal
    // string "onerror=alert(1)" is harmless once its "<" is escaped.
    const opensATag = /<script>alert\(1\)<\/script>/.test(idx) || /<img src=x/.test(idx);
    check('HTML typed into a cell cannot open a tag', !opensATag && idx.includes('&lt;script&gt;'));
    const ld = (idx.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).join('');
    check('  and cannot break out of the structured-data block',
      !/<script>|<\/script>alert/.test(ld) && ld.includes('u003cscript'));
  }

  console.log('\n--- the build stays consistent ---');
  {
    convert(BASE); rebuild();
    const snap = () => [fs.readFileSync(INDEX, 'utf8'), fs.readFileSync(SITEMAP, 'utf8'),
                        fs.readFileSync(JSON_OUT, 'utf8')].join('|');
    const before = snap();
    convert(BASE); rebuild();
    check('running the build twice changes nothing', snap() === before);
  }
  {
    const idx = fs.readFileSync(INDEX, 'utf8');
    const blocks = idx.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
    let bad = 0;
    blocks.forEach(b => { try { JSON.parse(b.replace(/<\/?script[^>]*>/g, '')); } catch (e) { bad++; } });
    check('structured data on the home page stays valid', blocks.length > 0 && bad === 0, `${blocks.length} blocks, ${bad} bad`);
  }
  {
    const missing = [];
    fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.html')).forEach(f => {
      const html = fs.readFileSync(path.join(PRODUCTS_DIR, f), 'utf8');
      (html.match(/(?:href|src)="(\/[^"]+)"/g) || []).forEach(m => {
        const p = decodeURIComponent(m.match(/"(\/[^"]+)"/)[1].split('?')[0].split('#')[0]).slice(1);
        if (p && !fs.existsSync(path.join(ROOT, p))) missing.push(`${f} -> ${p}`);
      });
    });
    check('every link on every product page resolves', missing.length === 0, missing.slice(0, 3).join(', '));
  }

} finally {
  restore();
}

/* ---------- did we put everything back exactly as we found it? ---------- */
const changed = [];
[['products.csv', CSV], ['products.json', JSON_OUT], ['index.html', INDEX], ['sitemap.xml', SITEMAP]]
  .forEach(([snapName, live]) => {
    if (fs.readFileSync(path.join(snapDir, snapName), 'utf8') !== fs.readFileSync(live, 'utf8')) changed.push(snapName);
  });
const snapPages = fs.readdirSync(path.join(snapDir, 'products')).sort().join(',');
const livePages = fs.readdirSync(PRODUCTS_DIR).sort().join(',');
if (snapPages !== livePages) changed.push('products/');
check('every file was put back exactly as it was found', changed.length === 0, changed.join(', '));

fs.rmSync(snapDir, { recursive: true, force: true });

console.log(`\n  ${pass} passed, ${fail} failed\n`);
if (fail) { console.log('  Failures:'); failures.forEach(f => console.log('   - ' + f)); console.log(); }
process.exit(fail ? 1 : 0);
