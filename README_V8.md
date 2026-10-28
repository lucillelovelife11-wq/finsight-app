# FinSight V8

This is a complete replacement package. It is not a live deployment.

## Why this release is packaged differently

The screenshots still showed the original all-inputs-required message and an empty valuation evidence container. That is consistent with a mixed or older script release, but the live deployment was not accessible for a definitive root-cause diagnosis. V8 embeds all application JavaScript and CSS in index.html, so uploading the new page cannot accidentally keep an older sidecar workspace script. It uses a new service worker URL with network-first navigation. The top of the page shows V8 page readiness and the loaded SEC backend version; a legacy backend is explicitly identified.

## The three reported problems

1. Operating ROA calculates each supported output independently. For every unavailable output, the page lists its exact required inputs. Debt and equity no longer block NOPAT or NOA when those inputs are otherwise complete. Operating versus non-operating classifications are still analyst judgments and are not invented from SEC totals.
2. Earnings Quality calculates accruals, CFO/NI and accruals/revenue whenever NI, CFO and revenue exist. Missing CapEx affects only FCF, and missing receivables affects only the receivables change. A fixture using the screenshot inputs NI 5,005, CFO 8,342 and revenue 63,364 produces accruals −3,337 USD m without those optional facts.
3. Valuation always initializes its evidence panel and distinguishes historical facts, derived candidates and forecast assumptions. Enterprise value requires FCFF, forecast growth, WACC and terminal growth. Net debt is additionally needed for equity value, and positive shares for per-share value. Missing later-stage inputs do not suppress enterprise value. Growth, WACC and perpetual growth remain explicit forecasts; the optional starter is labeled illustrative rather than issuer-specific.

## Deployment

Upload the complete package contents to the existing project root. Deploy index.html, sw-v8.js and netlify/functions/sec-financials.js together, retaining netlify.toml, manifest and icons. Keep the existing SEC_USER_AGENT environment variable. The new function returns version 8.0. No new account or paid data key is required.

After deployment, reload the site. The header should read FinSight V8. Load a company in Overview; the backend badge should then show 8.0. A 6.0 badge means the old function is still deployed. A startup error is shown visibly rather than leaving an apparently empty panel. If the header does not say V8, the served index.html is still an older release.

## Included prior work

Issuer-linked historical baselines; future and historical scenario branches; source-labeled peer samples; transaction effects alongside reported condensed statements; accounting cases that can be applied to statements; and four-category, twelve-question automatic evidence review are retained. Historical source facts are not overwritten by scenario edits. Missing standard tags and classifications stay unavailable.

## Validation and limits

Tests run every actual inline page script together against a lightweight DOM and exercise loading Overview and calculating the three reported panels with incomplete facts. The suite also covers calculation engines, source-unit extraction, transaction reconciliation, accounting-case integration and categorized diagnosis. The tests use explicitly synthetic fixtures; they do not certify current issuer filings or production SEC connectivity.

The browser preview could not connect to the local test server. No real-browser layout inspection or live deployment verification has been completed. No desktop application was controlled. Read CHANGELOG_V7_4 through CHANGELOG_V7_7 for the scope limits of derived FCFF, net debt, annual weighted-average shares and the simplified transaction model. README_V7 and older change logs describe earlier versions; this file is the V8 deployment guide.

Run the included checks with npm test in a Node 18+ environment. No packages need to be installed for the test suite.
