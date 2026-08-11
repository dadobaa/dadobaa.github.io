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

json/products.json  The catalogue. Editing this file is how you change products.
js/layout.js        Shared header + footer, injected into #header / #footer
js/products.js      Renders the catalogue and emits Product structured data
js/main.js          Nav, scroll reveal, tabs, mobile menu, video, back-to-top
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
npm run optimise:img
```

That resizes it and generates the `.webp` and `.avif` versions the site serves.
Commit all three files. Nothing else needs touching — the grid, the category
tabs and the structured data are all generated from the JSON.

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
