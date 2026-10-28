# V7.7 automatic categorized guided diagnosis

The diagnostic selector now has four categories and twelve analytical questions. Evidence is calculated immediately from the Overview issuer's current and comparable prior-year SEC facts; switching questions does not require refetching or typing known values. The evidence table includes all available metrics even if an earlier metric is missing.

Each step displays a metric, explanation and underlying tag/period provenance. Review and continue advances without re-entering a number. Missing evidence has a continue-with-limitation action and remains unavailable in the report. Availability and user-review counts are separate.

Manual input is optional and requires a source or adjustment reason. It is labeled as a manual supplement, never written into Overview facts, and cleared on issuer changes. Growth with a nonpositive prior denominator and noncomparable average-balance ratios remain withheld. Quick ratio requires an explicit securities fact rather than treating missing securities as zero.

The refresh button reuses the Overview ticker/year and refreshes diagnosis evidence only, without resetting transaction scenarios. Company and year fields are read-only. Numeric evidence displays two decimal places. JSON export contains every metric, source details, manual notes and review state. This is a rule-based evidence review, not generative AI or fraud detection.

Deploy the entire archive including both new diagnosis scripts and the updated service worker. No live deployment, browser layout or production SEC connectivity verification has been performed.
