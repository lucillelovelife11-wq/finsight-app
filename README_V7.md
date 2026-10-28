# FinSight V7

This update extends the supplied V6 project. It has not been published to the live site.

## Deploy

Replace the site files with this folder's contents, including the three new assets:
`scenario-engine.js`, `workspace-v7.js`, and `workspace-v7.css`.
Keep the existing Netlify `SEC_USER_AGENT` environment variable with an identifiable contact email. The original SEC function is retained. No new key or paid data provider is required.

## Start with DAL

1. In Overview select DAL, FY2025, and five annual periods. Load SEC financials.
2. Open ROE & DuPont or Earnings Quality. Available company figures now synchronize automatically. Unavailable inputs are cleared, not replaced with demo values. Supply any missing values explicitly before using the original calculator.
3. Every tab has a **Company analysis and scenarios** panel. Choose **Forecast the future** or **Question a historical figure**. The reported baseline is read-only; the editable column is an independent copy. Monetary units are USD millions.
4. For a forecast, enter revenue growth; review projected net margin and CFO/NI. Charts and tables update on input. Gray means a flat carry-forward reference; teal means your scenario. This is a simplified constant-assumption projection, not an integrated three-statement forecast.
5. For a historical hypothesis, edit the suspect values. NI alone does not determine CFO. Enable the explicit cash bridge if appropriate and enter every adjustment, including explicit zeros for unchanged items. Example: reversing a credit sale reduces NI and the receivables movement equally; the two changes offset in CFO. The counterfactual is never written back to SEC facts.
6. Open **Peer and industry reference**. Enter one to five comparable peer tickers. Mean, median, sample size, company periods, retrieval times and SEC provenance are retained. The selected company is excluded; fiscal year-ends more than 45 days apart are excluded. This is a user-selected peer sample, not an official industry average. Manual reference/target inputs include source and as-of date.
7. Export scenario JSON to retain the reported baseline, source tags, editable values, assumptions, peer records and manual reference metadata. Restore reported baseline clears edits. Loading a different company or reporting window discards scenarios and clears unrelated calculator defaults.

## Scope

- SEC sourcing still covers validated standard US-GAAP annual facts, not complete filing documents or issuer-specific custom tags.
- NOPAT/NOA classifications, CapEx, FCFF, WACC, shares and other unsupported items require manual evidence. No fabricated industry averages are provided.
- The Valuation forecast branch includes a manual cost-of-capital builder: Re, pretax Rd, debt weight and tax rate feed WACC. Applying the result changes only the scenario. Increasing Re while holding capital weights fixed increases WACC and reduces DCF value under ordinary positive-cash-flow assumptions.
- The common forecasting panel projects revenue, net income and CFO. The Valuation panel projects FCFF and calculates a five-year DCF. Historical changes are independent unless the explicit cash bridge is enabled. They do not reconstruct every balance-sheet entry or cumulative multi-year restatement.
- The transaction Explorer and Accounting Cases retain their clearly illustrative examples, with the linked company scenario panel beneath them. They do not masquerade as the company's actual transaction ledger.
- Peer benchmark references do not overwrite assumptions automatically. Review comparability, especially equity definitions, negative income and fiscal calendars. Negative or zero average-equity ROE is excluded from peer aggregation.
- Structured interpretations identify possible favorable explanations, concerns, confirming evidence and follow-up questions. Screening is not a finding of manipulation.
- Scenario edits stay in memory and are not submitted to any external service. Only selected public tickers and fiscal years are sent to the existing SEC backend. Reloading loses unsaved scenarios; export JSON first.

## Files

The archive retains V6 assets and deployment configuration. V7 adds the pure calculation engine, module workbench and CSS, updates the page references and service-worker cache version, and includes this guide. `README_DEPLOY.md` describes the original V6 behavior and is retained for provenance; use this guide for the V7 workflow.
