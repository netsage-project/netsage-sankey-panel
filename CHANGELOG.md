# Changelog

## 1.2.0

Refactor of the panel internals, plus bug fixes and new options. See `refactor_notes.md` for detail.

### Bug fixes

- **A numeric dimension column could steal the value field.** Value-field resolution preferred the
  first numeric field, so a query like `src, port, dst, bytes` used `port` for link thickness and
  ignored `bytes`. Resolution now prefers the last column when it is numeric, and stage columns are
  derived from the resolved value column instead of assuming "every column except the last".
  **Behavior change:** panels with a numeric dimension before the value column will now render
  different (correct) values.
- **Tooltip appeared far from the cursor.** It is now rendered through a portal, so its
  `position: fixed` resolves against the viewport rather than the dashboard grid's transformed
  panel wrapper.
- **Node label placement** compared against the node's own width instead of the graph width,
  pushing nearly every label inward.
- **NULL / empty cells** are skipped instead of becoming bogus `null` nodes.
- **Value mappings** now apply to node labels.
- **Cyclic edge-list data** renders an empty panel instead of crashing.
- Fixed `TypeError: p is not a function` with untyped value fields (e.g. OpenSearch `Count`).
- **`Color links by value mappings` collapsed every unmapped series to one flat color.** It read the
  source value's color from the display processor, which always resolves to the field's threshold or
  fixed color when no mapping matches, so the documented palette fallback never ran. Values without
  a mapped color now keep their palette color. The option colors by value mappings only; thresholds
  and field color config are no longer consulted.

### Features

- **Link mode**: `Columns as levels` (default) or `Edge list (source → target)` for multilevel graphs.
- **Node ordering**: `Query order` (default, follows a sort transform) or `Automatic`.
- **Color links by value mappings** and a **custom color palette** option.
- **Data links** on flows.
- Deterministic series coloring, independent of row order.

### Internal

- Grafana 13 / React 19 / TypeScript 5 upgrade.
- Tooltip, headers, and hover highlighting moved from imperative D3 to React.
- Unit tests (Jest) and end-to-end tests (Playwright + `@grafana/plugin-e2e`).

## 1.0.0 (Unreleased)

Initial release.
