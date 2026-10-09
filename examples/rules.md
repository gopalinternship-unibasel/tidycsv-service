# Rules for this fictional demonstration

1. Parse comma-separated UTF-8 CSV with the first record as headers; respect quoted commas and multiline values.
2. Trim edge whitespace in every cell. Keep values as text; do not parse IDs or amounts as numbers.
3. Lowercase the `email` column.
4. Remove rows whose cells are all empty after trimming.
5. Deduplicate on `email`, keeping the first occurrence. Keep every nonblank record whose email key is empty.
6. Export the four original headers in their original order.

Acceptance: six data records become four. The order IDs are exactly `00124`, `00125`, `00126`, `00127`. The quoted comma and multiline note retain their full values. Exactly one duplicate and one blank row are removed.

The demonstration uses reserved `.test` email domains and fictional records. It makes no claim about a real buyer, production destination or general identity matching.
