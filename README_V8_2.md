# FinSight V8.2 DAL operating and valuation workflow

This complete replacement package retains prior work and fixes the two remaining DAL workflows. It is not deployed to the live site.

## Findings and changes

DAL reports net interest expense rather than the separate gross expense and income requested by the earlier calculator. A reported or explicitly derived net-interest input is now accepted directly. The gross fields remain blank when unknown and are no longer required or marked invalid when the net subtotal is available. The NI-to-NOPAT interest bridge remains a simplified approximation: it does not automatically remove other non-operating gains or normalize taxes.

The filing reader previously skipped a row whose first cell was empty. It now examines the full text preceding the first numeric Inline XBRL fact, including layouts with leading blank and currency cells. Supported labels now include DAL-style current debt and finance leases, noncurrent debt and finance leases, net interest, and flight/ground capital expenditure components. The disclosed debt pair is used together instead of mixing it with a narrower standard debt scope. An explicit-credit US-GAAP net interest tag is converted to an expense-sign convention; signed original values are retained.

The initial classification scope is cash only. Missing short-term investment facts are excluded from this selected model, not silently treated as a reported zero. Users can choose to include investments, in which case a real input is required. Operating leases remain operating unless the user explicitly changes that policy and supplies both lease balances.

The valuation panel offers a single explicitly labeled action to apply reviewed historical bridges and an illustrative forecast starter (growth 5%, WACC 10%, perpetual growth 2%). It does not claim those assumptions come from DAL. Existing separate bridge-review and manual assumption actions remain available. Classification, FCFF and debt choices are copied to the scenario workbench with a rationale and do not modify SEC facts.

## Expected interaction after loading DAL

1. Load DAL and FY2025 in Overview. The page and backend badges should both show 8.2.
2. Operating ROA should display the available net-interest subtotal without requiring a fabricated split into expense and income. Review the cash-only classification scope and click Confirm classification and populate Operating ROA.
3. Valuation shows the exact cash-flow and debt bridge. Review its caveats. Either enter your own forecasts or explicitly use the illustrative combined action. The computed value is a scenario estimate, not an investment recommendation.

## Verification

Regression fixtures transcribe published DAL FY2025 values and reproduce a combined interest subtotal, component CapEx, leading empty/currency cells and missing securities. They verify net interest 679 USD m, CapEx 4,499 USD m, reported debt and finance lease components 1,605 and 12,507 USD m, and the cash-only classification. These fixtures have synthetic markup and tags; they are not claimed to be a downloaded live filing.

The public filing was inspected through web retrieval: https://www.sec.gov/Archives/edgar/data/27904/000002790426000013/dal-20251231.htm . Downloading the raw filing into the local test environment was rejected by the environment's permission policy, so real-file parsing, production SEC access and actual browser layout remain unverified. Existing structured source/fallback status remains visible in the page. An unsupported issuer or SEC access error can still produce missing facts.

## Deploy

Upload the complete package at the existing GitHub repository root and commit to the branch connected to Netlify. Include index.html, sw-v82.js and every file in netlify/functions, especially filing-evidence.js. Keep SEC_USER_AGENT configured. Wait for Published, reload, and load an issuer. The header and backend should show 8.2. This guide supersedes earlier deployment notes.

Run npm test with Node 18+; no dependency installation is required.
