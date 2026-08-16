# dadobaa.in

Static marketing and catalogue site for Dadobaa Oils, hosted on GitHub Pages at
[dadobaa.in](https://dadobaa.in).

**To change the products, edit `products.csv` and nothing else.** See
[HOW-TO-UPDATE-PRODUCTS.md](HOW-TO-UPDATE-PRODUCTS.md) — it is written for
someone who does not code. A GitHub Action rebuilds and republishes the site.

## Structure

```
index.html          Home: hero, why-us, process video, product grid, testimonials
about.html          "Our Process" — how the oil is pressed, plus FAQ
contact.html        Ways to order, address, marketplace links
404.html            Not-found page (uses absolute paths — see note below)
cold-pressed-oil-mumbai.html   Local landing page
products/*.html     28 generated product pages — do not hand-edit

products.csv        THE ONLY FILE YOU EDIT. The whole catalogue, as a spreadsheet.
json/products.json  Generated from products.csv — do not hand-edit.
js/layout.js        Shared header + footer, injected into #header / #footer
js/main.js          Nav, scroll reveal, tabs, mobile menu, video, back-to-top,
                    WhatsApp order-click tracking
css/style.css       Site styles
css/fonts.css       Self-hosted Open Sans + Lora
css/bootstrap.min.css   Compiled from scss/bootstrap.scss
scss/bootstrap.scss     Theme customisation (colours, fonts)
scripts/            Build scripts (csv-to-products, optimise-images,
                    build-product-pages, build-catalogue, build-sitemap)
```

## Adding or changing a product

**Edit `products.csv` — that is the only file anyone needs to touch.**
It is a spreadsheet; open it in Excel, Numbers or Google Sheets.

Full instructions for a non-technical person are in
**[HOW-TO-UPDATE-PRODUCTS.md](HOW-TO-UPDATE-PRODUCTS.md)**.

Pushing a change to `products.csv` (or dropping a photo into `img/products/`)
triggers `.github/workflows/build-site.yml`, which checks the file, resizes any
new photos, rebuilds every page and the sitemap, and commits the result. If the
file has a mistake the workflow stops and the live site is left untouched.

To do the same thing locally:

```sh
npm install
npm run build
```

`npm run build` runs, in order: read `products.csv` → optimise images →
generate the 28 product pages → rebuild the homepage grid → rebuild the sitemap.

### Files written by the build — never edit these by hand

`json/products.json` · `index.html` (between the `CATALOGUE:*` markers) ·
`products/*.html` · `sitemap.xml` · the `.webp` / `.avif` image variants ·
`img/.optimised.json`

## Showing or hiding prices

Prices are currently **hidden** across the whole site. To bring them back, set
`SHOW_PRICES = true` in **both** build scripts and rebuild:

```
scripts/build-catalogue.js      const SHOW_PRICES = true;
scripts/build-product-pages.js  const SHOW_PRICES = true;
npm run build
```

The prices themselves stay in `json/products.json` either way — nothing is lost.

The flag deliberately controls the visible price **and** the `price` in the
Product structured data together. Google requires structured data to match what
a visitor can see, so publishing a price in schema that is not on the page risks
a manual action. Do not switch one on without the other.

While prices are hidden you also lose price rich results in Google, and Google
Merchant Center cannot be used (it requires a price per product).

## Changing theme colours

Edit `scss/bootstrap.scss`, then:

```sh
npm install
npm run build:css
```

## Local preview

```sh
npm run serve      # http://localhost:8080
```

Serve from the project root, not a subdirectory — `js/layout.js` and
`404.html` use root-absolute paths (`/img/...`) so that the 404 page works
correctly when GitHub Pages serves it for a nested URL.

## Analytics

`gtag` is wired into every page but still has the placeholder
`G-XXXXXXXXXX`. Create a GA4 property and replace that string everywhere it
appears (`index.html`, `about.html`, `contact.html`,
`cold-pressed-oil-mumbai.html` and `scripts/build-product-pages.js`).

The product grid fires a GA4 `select_item` event whenever someone taps
"Order Now", so WhatsApp click-throughs show up as conversions.
