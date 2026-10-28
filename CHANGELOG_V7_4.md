# V7.4 linked valuation evidence

The SEC function now requests standard annual diluted weighted-average shares, capital expenditures, interest expense, income tax expense and current/noncurrent long-term debt. Share facts are read from the shares unit, not USD. Missing standard tags remain unavailable, and each fact retains its period and source tag.

Available historical diluted shares populate the main DCF input (in millions), with a visible warning that annual weighted-average shares are not a current fully diluted share count. CapEx and interest also synchronize to Earnings Quality and Operating ROA. A derived effective tax proxy is disclosed as an estimate, not a normalized forecast tax rate.

The DCF evidence panel displays historical components for the selected company. Users may explicitly accept a reviewed FCFF bridge candidate (CFO minus CapEx plus after-tax interest expense) or a limited debt-minus-cash bridge. The limitations of both bridges are displayed. Neither is silently presented as a reported SEC fact or complete valuation adjustment.

Growth, WACC and terminal growth remain assumptions. A clearly labeled optional teaching starter supplies 5%, 10% and 2%; these are not issuer-specific predictions or industry benchmarks. Users can edit them or build WACC in the scenario panel.

Deploy both the updated SEC function and all page assets. An old backend will continue returning unavailable values for the added fields. This package is not deployed automatically. Real browser layout and the production SEC connection have not been verified.
