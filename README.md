# TidyCSV — a small CSV cleanup engine

An original, dependency-free JavaScript engine for explicit CSV cleanup rules. It handles quoted commas, escaped quotes, multiline values and exact-header merging, and produces a source-referenced audit log. Work is AI-assisted.

## Run the fictional example

With Node.js installed:

```sh
node demo.cjs
node --test engine.test.cjs
```

`demo.cjs` verifies the included before-and-after files without modifying them. The 14 core checks cover quoted fields, delimiters, malformed inputs, header collisions, leading-zero identifiers, duplicate keys, merging, column projection, formula-prefix precautions and round trips.

```js
const E = require('./engine.cjs');
const dataset = E.dataset('id,email\n00124, ADA@example.test ', 'example.csv');
const result = E.clean([dataset], {
  trim: true, emailLower: true, removeBlank: true, dedupe: ['email']
});
```

Values remain text. Formula-prefix precautions modify formula-like cells during export and are not a universal spreadsheet security guarantee. Review the audit log and agree rules before processing consequential data.

## Optional CSV cleanup service

Combine exports, remove duplicates using agreed keys, and see exactly what changed.

## Start with one small batch

**Proposed pilot: US$49.** Up to three CSV files and 10,000 combined data rows. Agree the output headers, duplicate key and cleanup rules first. Receive a cleaned CSV, a source-referenced change log, a row-count summary and a reusable recipe. One correction round covers an error against the agreed rules.

If the work repeats, **CSV Import Care is proposed at US$129 per monthly period for up to four batches** with the same per-batch limits. The pilot can count toward the first monthly period. There is no checkout or recurring charge on this page. A written quote confirms scope, delivery timing, data handling, cancellation and refund terms before you pay or commit.

## A fictional example you can inspect

See [input.csv](examples/input.csv), [expected.csv](examples/expected.csv) and [the exact rules](examples/rules.md).

| Check | Input | Expected output |
| --- | --- | --- |
| Data rows | 6 | 4 |
| First order ID | ` 00124 ` | `00124` |
| Email case | ` ADA@example.test ` | `ada@example.test` |
| Repeated email | Two rows | First row retained |
| Empty duplicate key | One nonblank row | Retained |
| Entirely blank row | One | Removed |
| Quoted comma / multiline note | Present | Preserved |

These are fictional records, not customer results. IDs remain text in the CSV; destination spreadsheets must import their columns as text to retain leading zeros.

## What fits

- Trimming unwanted edge spaces and removing wholly blank rows.
- Keeping the first duplicate using an agreed exact key.
- Merging columns by exact header name.
- Renaming, reordering or omitting agreed export columns.
- Delivering a change log and counts alongside the output.

CSV/TSV only. Export Excel workbooks to CSV first. Similar names or addresses are not treated as the same entity automatically. Production imports, contact collection/enrichment, native Excel formulas, PDF extraction and open-ended migrations need a different scope.

## Ask about a batch

Open an issue in this repository with **fictional column names, approximate row counts, the duplicate rule and desired output**. Do not post real customer data, confidential files or private contact details publicly. A suitable private transfer method will be agreed before handling real records.

This is an AI-assisted service offer from the repository owner. The supporting CSV engine has 14 passing core checks. Its standalone browser interface has not yet received visual browser verification. No client history, turnaround guarantee or measured time-saving claim is made here.

An enquiry is not an order. No payment or service commitment occurs through a GitHub issue.
