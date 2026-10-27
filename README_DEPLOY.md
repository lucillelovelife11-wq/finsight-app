# FinSight V5 — SEC-connected Financial Diagnostic PWA

## What's new
- Auto-fetch SEC 10-K XBRL company facts for a U.S.-listed ticker or company name, then automatically populate a guided financial diagnostic.
- Source transparency: original XBRL tags, accession number, filed date, and period are returned by the server.
- Missing or incomparable values are not invented. The app requests manual evidence for unavailable items.
- Existing manual diagnostics, formulas, valuation, and three-statement explorer are preserved.

## Important: deploy through Netlify Git integration (not Netlify Drop)
The V5 SEC proxy is a Netlify Function. Dragging a static folder to Netlify Drop may publish the HTML but NOT deploy the function. Recommended:
1. Upload the **contents** of this folder to a new GitHub repository (keep `netlify/functions/sec-financials.js` and `netlify.toml`).
2. Netlify > Add new project > Import an existing project > GitHub > choose the repository.
3. Publish directory: `.`; build command: leave empty. Deploy.
4. Netlify > Project configuration > Environment variables > Add `SEC_USER_AGENT` = `FinSight Research your-real-contact-email@example.com`. Replace with a real contact address; SEC requires an identifying User-Agent.
5. Trigger a fresh deploy after setting the variable. Open the HTTPS website; choose Guided Diagnosis; enter DAL and FY2025; click Auto-fetch SEC & diagnose.
6. Check the Network tab for `/.netlify/functions/sec-financials` if there is an error. If SEC denies access from Netlify cloud infrastructure, automatic retrieval will be unavailable until a permitted backend is configured. Do not describe it as guaranteed live data.

## Technical scope
- Annual 10-K facts only, selected by filing FY/FP and annual duration, with standard US-GAAP XBRL tags.
- Income growth from a negative prior-year net income is withheld rather than using a misleading growth percentage.
- ROE uses current and prior year-end equity average. OpROA and net borrowing cost require classifications that are not automatically available from standard XBRL.
- SEC Company Facts is free, but the API does not support browser CORS; server-side fetch is necessary.
- Some firms use custom XBRL tags, so coverage varies.
- This is a financial-screening educational app, not a fraud detector.

## Local preview
Open `index.html` to use manual features. The auto-fetch button needs a deployed Netlify Function. For local function testing, install Netlify CLI and run `netlify dev` with a valid SEC_USER_AGENT environment variable.

## Verify the live backend
On your deployed site, open `https://YOUR-SITE.netlify.app/.netlify/functions/sec-financials?company=DAL&year=2025`. A JSON response containing either `company`/`results` or an explicit `error` means the function is deployed. An HTML page or 404 means it is not.

**Do not** upload only `index.html` or use static drag-and-drop deployment. The ZIP provided here has `index.html` and `netlify.toml` at its root for direct repository upload.
