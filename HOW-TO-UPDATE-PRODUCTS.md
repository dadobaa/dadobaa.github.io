# How to change the products on the website

You only ever need to change **one file: `products.csv`**.

It is a spreadsheet. Open it in Excel, Numbers or Google Sheets, make your
change, save it, and put it back on GitHub. The website updates itself within a
few minutes — the product pages, the home page, the categories and the Google
sitemap are all rebuilt for you.

**You never need to touch anything else.** Do not edit `index.html`,
`json/products.json`, the `products` folder or `sitemap.xml` by hand — those are
written by the computer and your changes there would be wiped out.

---

## The columns

| Column | What to put in it |
|---|---|
| **ID** | A number. **Leave it blank for a new product** and one is filled in for you. Never change or reuse an existing one. |
| **Category** | Which group it belongs to, e.g. `Cooking Oils & Ghee`. Type a new name here to create a new category. |
| **Category Description** | One or two sentences about the category. Only needs filling on the first row of each category; leave blank on the rest. |
| **Product Name** | What customers see, e.g. `Groundnut Wood Pressed Oil`. |
| **Description** | One or two sentences. Google shows this text, so it is worth writing properly. |
| **Size** | e.g. `950 ml`, `1 kg`, `100 gms`. |
| **Price** | Just the number, e.g. `480`. No ₹ sign, no commas. |
| **Photo File Name** | The photo's name **without `.jpg`**, e.g. `Groundnut-Wood-Pressed-Oil`. Capital letters matter. |
| **WhatsApp Link** | The ordering link. Must start with `https://wa.me/` |

The order of the rows is the order products appear on the website. The order the
categories first appear is the order the category buttons appear.

---

## The four things you'll want to do

### Add a product

1. Put the photo in the `img/products` folder. Name it sensibly, e.g.
   `Avocado-Oil.jpg`. Any size is fine — it gets resized automatically.
2. Add a row to `products.csv`. **Leave the ID blank.**
3. Put `Avocado-Oil` in the Photo File Name column (no `.jpg`).
4. Save and upload.

### Change a product

Find its row, change the cell, save, upload. Price, description, size, category
and photo can all be changed this way.

> Changing the **Product Name** keeps the same web address, so links you have
> already shared keep working.

### Remove a product

Delete its whole row. Its page is removed from the website and from the Google
sitemap automatically.

### Add, rename or remove a category

- **Add**: type a new name in the Category column of any row.
- **Rename**: change the Category name on every row that uses it.
- **Remove**: delete all the rows in it, or move those rows to another category.

---

## If you make a mistake

Nothing breaks. Before anything is published, the file is checked. If something
is wrong, **the update stops and the live website stays exactly as it was.**

You will get a message that says what to fix, like:

```
Found 1 problem in products.csv:

  - row 7 ("Argan Oil"): the price should be just a number, like 480.
    It currently says "Rs. 340/-".

Nothing has been published. The website is unchanged.
```

Fix that cell, upload again, done.

It checks for: missing names, prices, sizes, photos or WhatsApp links; prices
written as text; a photo file that does not exist; two products sharing an ID;
and two products that would end up with the same web address.

---

## Where to see if it worked

Go to the repository on GitHub and click the **Actions** tab. Each update shows
up there.

- **Green tick** — the website has been updated.
- **Red cross** — something needed fixing. Click it to read the message. The
  live website was not touched.

---

## A note on prices

Prices are currently **hidden** on the website, so customers ask on WhatsApp.
You still need to fill in the Price column — it is just not shown publicly.

To start showing prices again, ask a developer to set `SHOW_PRICES = true` in
`scripts/build-catalogue.js` and `scripts/build-product-pages.js`.
