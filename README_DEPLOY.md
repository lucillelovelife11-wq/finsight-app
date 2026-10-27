# FinSight V6 · SEC Workspace + Light Theme

## Deploy / upgrade

Replace `index.html` and `netlify/functions/sec-financials.js` in your existing GitHub repository; keep all other PWA assets. Commit to `main` and wait for Netlify to publish automatically. The existing `SEC_USER_AGENT` environment variable stays configured.

## Test

1. Open your deployed Netlify URL, hard-refresh (Ctrl+Shift+R), select Overview.
2. Enter `DAL`, `Delta`, or `Delta Air Lines`, choose FY2025 and 5 annual 10-K periods, click **Load SEC financials**.
3. Verify the actual fiscal period end dates above each year and that missing values are shown as em dashes.
4. Open each module; click **View SEC evidence** to inspect company data. In ROE & DuPont or Earnings Quality, use the optional **Populate calculator** action.
5. Open Guided Diagnosis (last tab), choose a pathway, and click **Auto-fetch SEC & diagnose**.

## Scope and limitations

The API uses SEC EDGAR Company Facts `us-gaap` USD XBRL facts, limited to validated annual 10-K periods. The 5-year view is five fiscal-year summaries, **not a full rendering of five 10-K documents**. Operating classifications (NOPAT/NOA), custom issuer XBRL tags, and nonstandard cash flow subtotals may be unavailable. Historical SEC facts may be amended. Calculators remain editable teaching tools; no implied automatic data substitution except explicit Populate actions. No investment advice or fraud determination.

## Troubleshooting

If you see `The Netlify SEC function is an older version`, confirm `netlify/functions/sec-financials.js` is updated and Netlify deployment has completed. For SEC 403/429 errors, check SEC access policies and request limits. Opening `index.html` locally supports only offline reference/calculator modules.
