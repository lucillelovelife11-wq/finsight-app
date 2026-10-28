# FinSight V8.6

Financial diagnostic and analyst toolkit (single-page app + two Netlify functions that read SEC EDGAR data).

## Files

| Path | Purpose |
|---|---|
| `index.html` | The whole app. All page modules are inlined here. |
| `netlify/functions/sec-financials.js` | Reads SEC Company Facts (standard us-gaap tags) for the Overview and all calculators. |
| `netlify/functions/filing-evidence.js` | Fallback: reads the company's own 10-K Inline XBRL by row label when a standard tag is missing. |
| `sw-v86.js`, `manifest.webmanifest`, `icon-*.png` | Offline/PWA support. |
| `netlify.toml`, `package.json` | Netlify build settings; `npm test` runs the regression tests. |
| `*.js` in the root (scenario-engine, workspace-v7, …) | Readable source copies of modules used by the tests. The page itself runs the copies inlined in `index.html`. |
| `tests/` | Regression tests (not needed by the live site). |

## Deploy

1. Upload everything in this package to the GitHub repository root (keep the `netlify/functions` folder structure) and commit.
2. Netlify environment variable `SEC_USER_AGENT` must contain a contact email (already configured; no new key needed).
3. Wait for Netlify "Published", reload the site, load a company in Overview. Page and backend should both show 8.6.

Old files from earlier versions (old `sw-v8*.js`, old README/changelog files) are no longer needed. GitHub uploads do not delete files, so remove them in GitHub if you want a clean repository; leaving them does no harm.

## Data coverage

Values are taken in this order, and every derived value is labeled with how it was obtained:

1. Standard SEC tags (several alternatives per item, e.g. inventory: InventoryNet, AirlineRelatedInventoryNet, RetailRelatedInventoryMerchandise, energy/utility inventory tags…).
2. Component sums when no total is tagged (e.g. finished goods + work in process + raw materials; gross inventory − LIFO reserve; gas + coal + supplies).
3. The 10-K's own statement rows, matched by normalized row label and balance-sheet section (current vs noncurrent), covering label variants checked against 20 companies across airlines, retail, tech, energy, industrials, pharma, consumer staples, homebuilding and utilities.

The 10-K fallback reads only the selected year's filing, so it fills that year and the prior year. Banks and insurers have no inventory, CapEx or trade receivables in the usual sense; those fields stay blank. A blank means "not obtained", not "zero".

Forecast assumptions (growth, WACC, terminal growth) are not in any filing; Valuation pre-fills a labeled illustrative 5% / 10% / 2% that you should replace.

## Test

`npm test` (Node 18+). Tests use transcribed or synthetic fixtures; they do not call SEC.
