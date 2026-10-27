# FinSight V5.2 — SEC Data Integrity Upgrade

## What changed
- Rejects SEC comparative facts whose actual `end` date belongs to an older year, even when SEC `fy` matches the selected year.
- Requires full-year (330–400 day) 10-K/10-K/A flows, and uses point-in-time facts for balance sheet accounts.
- Determines a dominant annual reporting date and requires all current-year facts to match that date.
- Validates adjacent prior-year period ends before computing growth or average-balance ROE/ROA.
- Displays actual fact period, filing date, XBRL tag and SEC source. Withholds missing or noncomparable values.
- Retains the existing PWA and calculators.

## Update an existing Netlify deployment (GitHub connected)
1. Open your `finsight-app` GitHub repository.
2. Replace `index.html` and `netlify/functions/sec-financials.js` with the corresponding V5.2 files. Keep the directory structure unchanged.
3. Commit both changes to `main`.
4. Netlify will automatically deploy the updated site. Check **Deploys** until it says **Published**.
5. Your existing `SEC_USER_AGENT` environment variable remains in Netlify; do not enter it in GitHub.
6. Test `https://YOUR-SITE.netlify.app/.netlify/functions/sec-financials?company=DAL&year=2025`.
   The JSON must include `"version":"5.2"` and `"periods":{"current":"2025-12-31"` for a calendar-year issuer like Delta.
7. Open your app and click **Auto-fetch SEC & diagnose**. Hard-refresh with Ctrl+Shift+R if an older PWA is cached.

## Important limitations
- This release has local JavaScript syntax and synthetic regression tests, not live SEC/Netlify end-to-end tests. Confirm real values against the SEC filings before relying on a diagnosis.
- Some issuers have non-calendar fiscal years; the matching algorithm permits a fiscal-year end in the named year or the following year. Complex fiscal calendars and 53-week periods may require issuer-specific verification.
- Company Facts standard tags may omit or combine company-specific items. Missing facts remain missing.
- Screening flags do not establish manipulation, fraud, or investment suitability.
