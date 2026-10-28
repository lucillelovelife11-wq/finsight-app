# FinSight V8.3 visible provisional inputs

This full package removes the hidden confirmation gate that left the two lower calculators blank even after their source panels had computed values. It is not a live deployment.

## Operating ROA

Available operating-liability and non-operating-asset estimates now populate the main inputs immediately, alongside reported debt and net interest. The initial policy is clearly labeled cash-only, keeps operating leases in operating liabilities and does not claim unknown investments are zero. Derived fields have a distinct provisional treatment and may be edited. A confirmation action remains for documenting acceptance, but it no longer blocks calculation. These are analyst-policy estimates, not reported SEC subtotals. The simplified NOPAT bridge does not remove every non-operating gain or normalize taxes.

## Valuation

Available FCFF and net-debt bridge estimates populate the main inputs immediately and are labeled provisional. Growth, WACC and perpetual growth remain forecast assumptions. A teaching-starter button is now beside Run valuation, rather than only in a separate source panel. Clicking it explicitly applies growth 5%, WACC 10% and perpetual growth 2%, labeled illustrative rather than a DAL forecast. Users can instead enter their own assumptions. Manual edits are retained on source-panel refreshes; changing the issuer resets the source context.

## Accruals

The working Earnings Quality calculation and input mappings are retained. A regression test uses the screenshot's NI 5,005, CFO 8,342, revenue 63,364, CapEx 4,499 and receivables 3,224 to 2,850 USD millions and checks accruals −3,337, simple FCF 3,843 and receivables change −374. These are explicitly transcribed regression fixtures, not a new live download.

## Deploy

Upload the complete contents at the existing GitHub project root and commit. Include all Netlify function files and sw-v83.js. Wait for Netlify Published, reload and load the issuer in Overview. Page and backend should both show 8.3. No new key is needed; preserve SEC_USER_AGENT. This guide supersedes earlier README files in this archive.

## Verification limits

Tests cover full-page script initialization, automatic provisional population without confirmation, an adjacent explicit forecast-starter action, preservation of manual edits, unchanged Accruals outputs, filing parsing and prior calculation workflows. Production SEC connectivity and real-browser layout are not verified. Prior raw filing download was rejected by the environment permission policy. Source fallback status remains visible so access failure is not mislabeled as nondisclosure.
