# V7.5 reported statement baseline and transaction effects

Loading Overview now resets the Explorer to the selected issuer's reported condensed statements rather than the 50,000-dollar cash/PPE teaching example. Each statement shows reported value, hypothetical transaction change and simulated value. Company-mode amounts are USD millions and the amount field is cleared on company changes. Without an issuer the original USD teaching model remains available.

Prepaid insurance does not immediately affect income. The income statement therefore retains reported revenue and NI, with explicit zero transaction effects, while cash, prepaid assets and CFO show the simulated movement. Later recognition of insurance expense changes income without a second cash payment.

Only supported source lines are shown as facts. A known transaction delta against an unknown baseline does not invent an adjusted total. Net expenses and other effects are derived as revenue minus NI and are not labeled operating expenses. Checks cover simulated changes only; cash-flow components, FX and full filed-statement reconciliations are not inferred. Source debt scope and missing detail remain explicit. Tax and COGS effects are excluded.

The SEC function adds standard PP&E, investing cash flow and financing cash flow tags. Both the function and page assets must be deployed. CSV exports now contain the issuer, baseline, scenario changes, adjusted values and source tags. No live deployment or browser layout verification has been performed.
