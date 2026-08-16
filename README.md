# dadobaa.in

Static marketing and catalogue site for Dadobaa Oils, hosted on GitHub Pages at
[dadobaa.in](https://dadobaa.in).

No build step is required to deploy — push to `master` and GitHub Pages serves
the files as they are. The npm scripts below are optional tools for maintenance.

## Structure

```
index.html          Home: hero, why-us, process video, product grid, testimonials
about.html          "Our Process" — how the oil is pressed, plus FAQ
contact.html        Ways to order, address, marketplace links
404.html            Not-found page (uses absolute paths — see note below)
cold-pressed-oil-mumbai.html   Local landing page
products/*.html     28 generated product pages — do not hand-edit

json/products.json  The catalogue. Editing this file is how you change products.
js/layout.js        Shared header + footer, injected into #header / #footer
js/main.js          Nav, scroll reveal, tabs, mobile menu, video, back-to-top,
                    WhatsApp order-click tracking
css/style.css       Site styles
css/fonts.css       Self-hosted Open Sans + Lora
css/bootstrap.min.css   Compiled from scss/bootstrap.scss
scss/bootstrap.scss     Theme customisation (colours, fonts)
scripts/            Maintenance scripts
```

## Adding or changing a product

Everything lives in `json/products.json`. Add an entry under the right category:

```json
{
  "id": 29,
  "name": "Avocado Oil",
  "desc": "One or two sentences. Used for the page and for search results.",
  "weight": "100 ml",
  "price": 450,
  "whatsappLink": "https://wa.me/919820175000",
  "image": "Avocado-Oil"
}
```

`image` is the filename in `img/products/` **without** an extension. Drop the
photo in as `img/products/Avocado-Oil.jpg`, then run:

```sh
npm install
npm run optimise:img   # resize + generate .webp / .avif
npm run build          # regenerate product pages AND the homepage grid
```

Commit the generated images **and** the updated `index.html`.

> **`npm run build` is not optional.** The product grid, the category
> tabs and the Product structured data are baked into `index.html` as static
> HTML between `<!-- CATALOGUE:*:START -->` markers. Editing `products.json`
> alone changes nothing on the site.
>
> It works this way for SEO. The catalogue used to be fetched and injected by
> JavaScript, which meant a crawler that did not execute JS saw an empty grid,
> and the Product schema was created client-side where it is indexed far less
> reliably. Baking it in puts all 28 products, their prices and their schema in
> the raw HTML. It is also smaller on the wire — 14 KB gzipped, versus the
> ~22 KB of HTML + JSON + JS it replaced.

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

Serve from the project root, not a subdirectory — `js/layout.js`, `js/products.js`
and `404.html` use root-absolute paths (`/img/...`) so that the 404 page works
correctly when GitHub Pages serves it for a nested URL.

## Analytics

`gtag` is wired into every page but still has the placeholder
`G-XXXXXXXXXX`. Create a GA4 property and replace that string in `index.html`,
`about.html` and `contact.html` to start collecting data.

The product grid fires a GA4 `select_item` event whenever someone taps
"Order Now", so WhatsApp click-throughs show up as conversions.
