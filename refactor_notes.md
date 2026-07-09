# Sankey Panel Refactor Notes

This document records the refactoring performed on the NetSage Sankey panel plugin, grouped
by file. The guiding constraint was **do not change rendered output unless doing so fixes a
bug** (or was explicitly requested). Each entry notes whether it affects output.

## Intended output changes (only these three)

1. **Node label placement** (`Node.tsx`) — a genuine bug fix that repositions some labels.
2. **Tooltip appearance** (`Tooltip.tsx` + friends) — replaced with Grafana's own theme-aware
   tooltip, as requested. Content is unchanged; only the container styling differs.
3. **Value/displayValue consistency** (`dataParser.ts`) — only changes output in the previously
   broken case where a non-last field was chosen as the value field; the default case is
   identical.

Everything else below is behavior-preserving cleanup.

---

## `src/dataParser.ts`

- **Extracted the color map.** The 80-line `fixColor` `switch` that was rebuilt on every call
  is now a module-level constant `GRAFANA_COLOR_MAP` plus an exported `fixColor()` function.
  Same values → identical colors. *No output change.*
- **`fixColor` is now imported, not smuggled.** Previously `fixColor` was returned as the 5th
  element of `parseData`'s return array and re-invoked in the panel. It is now a normal export.
  *No output change.*
- **Named return object.** `parseData` returned a fragile positional array
  `[pluginData, displayNames, rowDisplayNames, valueField, fixColor]` unpacked by index. It now
  returns a typed object `{ pluginData, displayNames, rowDisplayNames, valueField }`
  (`ParsedSankeyData`). *No output change.*
- **O(n²) → O(n) lookups.** Node lookup used `Array.findIndex` inside the per-row loop, and the
  row color used `Array.find`, both linear per row. Replaced with `Map`s
  (`nodeIndexByKey`, `colorByFirstColIndex`). Same node identity and ordering. *No output change.*
- **Removed dead code.** Deleted the unused `values` array (was built with `.map` purely for
  side effects and never read), the commented `import { color } from 'd3'`, and the large
  commented-out value-field / node-loop blocks.
- **Added `formatDisplay(field, value)` helper** for the "text suffix" / "text" formatting that
  was duplicated here and in `Tooltip.tsx`. Single source of truth. *No output change.*
- **Value/displayValue consistency (bug fix).** The code used `row[numFields]` (the *last*
  column) for the numeric link value while formatting the display string from the *selected*
  value field — so if a non-last field was chosen as the value field, the link thickness and
  the tooltip value came from different fields. Now both use the resolved value field's column
  index (`valueColIndex`). For the default case (value = last column) this equals `numFields`,
  so **output is unchanged**; it only corrects the mis-selected-field case. The node-stage loop
  still assumes stages are "every column except the last" — see *Known limitations*.
- Added doc comments and lightweight interfaces (`SankeyNode`, `SankeyLink`, `ParsedSankeyData`).

## `src/SankeyPanel.tsx`

- **Adopted the named-object return** and imports `fixColor` directly.
- **Resilient error handling (bug fix).** The old `try/catch` logged the parse error but then
  immediately dereferenced the missing result (`fixColor(...)`, `parsedData[3]`, …), crashing
  anyway. Now, on parse failure, `parsed` stays `undefined` and the component renders the empty
  `<Sankey>` fallback. *No output change for valid data.*
- Removed the pointless `graphOptions = { ...options }` copy and the stray outer `<g>` wrapper
  (a bare SVG group rendered outside any `<svg>`). Restored real `PanelProps<SankeyOptions>`
  typing on the component. *No output change.*

## Tooltip replacement — `Tooltip.tsx`, `Sankey.tsx`, `Link.tsx`, `Node.tsx`

The custom tooltip was reimplemented with Grafana's own `VizTooltipContainer` (requested), and
all hover/highlight behavior moved from imperative D3 into React state.

- **`Tooltip.tsx`** is now a small presentational component that renders
  `<VizTooltipContainer position=… offset=…>` when something is hovered, else `null`. It exports
  the `HoverState` type. The previous version imperatively appended a hardcoded dark `<div>` to
  `document.body`, re-bound every D3 handler on each render (because its `useEffect` had no
  dependency array), tracked the mouse with its own `window` listener, and could leak orphan
  tooltip nodes. The tooltip **text is unchanged** (link: row path + bold value; node:
  `name: value`); only the container is now Grafana-styled and theme-aware. *Intended visual
  change (container styling only).*
- **`Sankey.tsx`** now owns `hover` state and computes each link's opacity declaratively, using
  the **exact same numbers** as the old D3 code: resting `0.7`, hovered link `1` / others `0.4`,
  node-hover matching links `1` / others `0.2`. *No output change to the highlight behavior.*
- **`Link.tsx` / `Node.tsx`** take `opacity` + `onHover`/`onLeave` props and drop the abused SVG
  attributes that used to stash tooltip data for D3 to read back (`display` on `<path>`; `d`,
  `name`, `data-index`, `id`, `className` on `<rect>`). `sankeyLinkHorizontal()` is now built
  once at module load instead of per render. *No output change.*
- **Deleted `src/components/MousePos.tsx`** — an unused mouse-tracking hook (the tooltip no
  longer needs it).
- **Layout memoization (correctness).** Because hover now re-renders `<Sankey>` with the same
  `data` object, and `d3-sankey`'s `sankey(graph)` **mutates its input** (replacing each link's
  numeric `source`/`target` with node references), re-running the layout on an already-mutated
  object would corrupt it. The layout is therefore run inside `useMemo` on a **clone** of the
  data, recomputing only when inputs change. This both fixes the mutation hazard and avoids
  re-laying-out on every hover move. *No output change.*

## `src/components/Node.tsx` — label placement (bug fix, intended output change)

Label side/anchor was chosen by `x0 < width / 2`, where `width = x1 - x0` is the node's **own**
width (~30px). So `x0 < 15` was true only for the leftmost column, forcing nearly every label
to the left/inward. Now compares `x0 < graphWidth / 2` (graph width threaded in from
`Sankey.tsx`), the canonical d3-sankey rule: left-half nodes label to the right, right-half
nodes to the left. **This is an intended visual change that corrects mislabeled/overlapping
labels.**

## `src/components/Headers.tsx` — de-D3 (behavior-preserving)

Rewrote the imperative D3 (`d3.select('#'+id).append('text')` inside a dependency-less
`useEffect`) as declarative JSX `<text>` elements. The old version re-ran on every render,
appended a fresh `<g>` each time (leaking empty orphan groups), and used an element id that
contained a space (invalid). Positions, `14pt` font, weight `500`, anchors, and the
`length > 3` multi-column branch are preserved. *No output change.*

## `src/types.ts`

- Removed the dead `textColor` option (never registered in `module.ts`; its only consumer was
  a commented-out line — text color now follows the Grafana theme).
- Removed the empty, unused `SankeyFieldConfig` interface (also silenced an eslint
  `no-empty-interface` warning). *No output change.*

## `src/module.ts`

- Removed the commented-out `grafana-plugin-support` import.
- Added a comment documenting that the standard **Color** field config is currently enabled but
  not consumed by the render path (link/node colors come from the panel options + palette). Left
  as-is to avoid behavior change. *No output change.*

---

## Known limitations / future work (not changed)

- ~~**Value must be the last column.**~~ *(Fixed later — see "Stage/value separation" below.)* The
  node-stage loop treated "every column except the last" as a Sankey stage, so choosing a non-last
  field as the value field was only partially supported.

---


# Feature updates (post-refactor)

Follow-up changes driven by user reports. These are intentional behavior changes.

## 1. Value mappings now apply to node labels (bug fix) — `dataParser.ts`

Node names were built from the raw cell value (`row[i]`), so Grafana value mappings and unit
formatting configured on a dimension field never reached the diagram. Node values are now run
through **each column's own** field display processor (`allData[i].display(row[i]).text`, with a
fallback to the raw value). This is more correct than the community workaround that used the
*value* field's processor for every column. *Intended output change: node labels, node tooltips,
and the link's row-path string now show the mapped/formatted text.*

## 2. Deterministic series coloring — `dataParser.ts`

Palette colors were assigned to first-column series in the order rows were encountered, so two
diagrams with the same structure but a different row order got different colors. Colors are now
assigned by sorting the distinct first-column series names and mapping palette colors to that
stable order; each link takes the color of its originating first-column node. The same set of
series therefore yields the **same colors across diagrams regardless of row order**. Monochrome
mode is unaffected (single-entry palette). *Intended output change: specific series may map to a
different palette color than before, but consistently.*

## 3. "Node ordering" option — `module.ts`, `types.ts`, `Sankey.tsx`, `SankeyPanel.tsx`

The diagram never set d3-sankey's `nodeSort`, so vertical order was the library's automatic
heuristic and sorting rows via a transform had no effect. A new **"Node ordering"** panel option
(`nodeOrder`) was added:

- **Query order** (default) → `sankeyGen.nodeSort(null)`: node order follows the query/row order,
  so a "Sort by" transform (or query ordering) now controls the vertical layout.
- **Automatic** → `sankeyGen.nodeSort(undefined)`: the previous d3-sankey behavior.

*Intended output change: existing dashboards default to query-order layout; switch the option to
"Automatic" to reproduce the old ordering.*

## 4. "Link mode" — edge-list / multilevel graph support — `module.ts`, `types.ts`, `dataParser.ts`, `Sankey.tsx`

Users could not build multilevel Sankeys from edge-list data because nodes are keyed by
*(column, name)*: a node that is a target in one row (column 1) and a source in another (column 0)
became two disconnected nodes. A new **"Link mode"** option (`linkMode`) was added:

- **Columns as levels** (default) → unchanged: each column is a level, each row a full path.
- **Edge list (source → target)** → the first two non-value columns are source/target and nodes
  are keyed by **name only**, so shared names connect and d3-sankey computes the levels. Enables
  arbitrary multilevel graphs from `source,target,value` data.

Implementation notes:
- `dataParser.ts` branches on `linkMode`; the display-processor and find-or-create-node logic
  were factored into local `displayCell` / `getOrCreateNode` helpers shared by both branches.
- Deterministic coloring was unified to key off each link's origin node (`node0`) rather than
  `colId === 0`; this is identical to the previous first-column coloring in columns mode and
  colors edge-list flows by their source.
- Edge-list mode returns empty `displayNames` so `Headers` renders nothing (fixed source/target
  headers are misleading over a computed multilevel graph).
- Self-loops (`source === target`) are skipped, and the d3-sankey layout call in `Sankey.tsx` is
  now wrapped in try/catch, so cyclic edge-list data renders the empty fallback (with a console
  error) instead of crashing the panel.

*Columns mode (the default) is unchanged; edge-list is opt-in.*

## 5. NULL / empty cells are skipped (bug fix) — `dataParser.ts`

Variable-depth paths pad their unused levels with NULL. The parser previously turned every NULL
cell into a real node named "null", so a shorter path routed through bogus "null" nodes and the
diagram was unusable (reported with a `... → null → null → ...` tooltip). Now:

- **Columns mode:** empty/NULL stage cells (`null`, `undefined`, `''`) are skipped, so a row links
  its real nodes directly and skips the unused levels (e.g. `A1, NULL, Z1` → `A1 → Z1`). A row
  whose stage cells are all NULL contributes nothing.
- **Edge-list mode:** rows with a NULL/empty source or target are skipped.

This is default behavior (no option): a NULL cell is never a meaningful node, and clean datasets
have no NULLs, so there is no regression for existing dashboards.

## 6. Data links on flows (feature) — `dataParser.ts`, `Link.tsx`, `module.ts`

Configured Grafana data links were ignored. The standard Data-links field config was already
enabled (it is not in `disableStandardOptions`), so the editor already showed it — the panel just
never read the links. Now:

- `dataParser.ts` gathers each row's links via `field.getLinks({ valueRowIndex })` across all
  fields, de-duped by `href`+`title` (a link set as a field default appears on every field and
  resolves to the same URL), and stores them on each `SankeyLink` as `dataLinks`.
- `Link.tsx` wraps a flow that has links in `@grafana/ui`'s `DataLinksContextMenu`: a single link
  navigates on click (the component renders an anchor around the flow — an SVG `<a>` here, since
  we are inside the chart `<svg>`); multiple links open a context menu via the supplied
  `triggerProps`. Flows map 1:1 to query rows; nodes (which aggregate many rows) are intentionally
  not linked.

## 7. Full dependency modernization — Grafana 13 / React 19

Upgraded the plugin to current versions:

- `@grafana/data`/`@grafana/ui`/`@grafana/runtime` `8.0.6`/`9.3.8` → **`^13.1.0`** (mismatch
  removed); `react`/`react-dom` `17` → **`^19.2`**; `@types/react(-dom)` → `^19`; `typescript`
  `4.4` → **`^5.6`** (resolved 5.9); `@types/node` → `^22`; `.nvmrc` → `22`, `engines.node` →
  `>=20`; `plugin.json` `grafanaDependency` → `>=11.0.0`; `docker-compose` Grafana → `13.1.0`.
- Removed dead/deprecated deps: `grafana-plugin-support` (unused), legacy `emotion`,
  `@grafana/e2e`/`@grafana/e2e-selectors` (deprecated; no e2e specs) and their unused `e2e`
  scripts.
- **Breaking-change fix:** Grafana removed the `Vector`/`ArrayVector` abstraction; `dataParser.ts`
  no longer imports `Vector` and types fields as `Field[]` (`Field.values` is a plain array now).
- **`DataLinksContextMenu` API change (v13):** the `config` prop was removed and the child API now
  exposes `triggerProps`/`openMenu`; `Link.tsx` was updated accordingly (and the value-field
  `config` threading was dropped).
- **Build tooling for Node 26 / TS 5:** `webpack-cli` `4` → `^5.1.4` and `webpack` → `^5.94`;
  replaced `ts-node` (which fails to load the TypeScript webpack config on Node 26 —
  `state.conditions.includes is not a function`) with `esbuild-register` + `esbuild`. Kept
  `@grafana/eslint-config` at `^6.0.1` (self-contained, works with the legacy `.eslintrc`; v8 is
  flat-config/peer-dep only). The scaffolded `.config/` was left intact.

**Verification:** typecheck, lint, unit tests and the production build all pass on Grafana 13 /
React 19. Runtime behavior has since been validated against a **live Grafana 13** with the plugin
loaded: the Playwright suite (`yarn e2e`) drives the real panel editor and asserts the diagram
renders in both link modes, and rendering, theme, tooltip placement and value-mapping colors were
confirmed by hand. The residual gaps are data-link navigation and the context menu, which no
automated test covers yet.

## 8. Link coloring: value mappings + custom palette (features) — `dataParser.ts`, `module.ts`, `types.ts`

Two additive coloring options (neither existed before — the palette was hardcoded, and value
mappings only affected node labels):

- **Custom color palette** (`palette`, text option): a comma-separated list of colors (hex, CSS
  names, or Grafana color tokens, run through `fixColor`) that overrides the built-in 5-color
  palette for multi-colored flows. Empty = the default palette. Shown only in multi-color mode.
- **Color links by value mappings** (`colorByValueMappings`, boolean): colors each flow by the
  Grafana-computed color of its source (first-column) value — `field.display(value).color`, which
  resolves value mappings > thresholds > field color config. Stored per node as `mappedColor` at
  build time and applied in the coloring pass, falling back to the palette color for any value
  without a resolved color. Takes precedence over single/palette color; the single/palette
  controls are hidden when it is enabled.

Both are backward compatible: defaults (`palette: ''`, `colorByValueMappings: false`) reproduce
the previous deterministic palette coloring exactly.

## 9. Fix "TypeError: p is not a function" (untyped value field) — `dataParser.ts`

Reported on Grafana 11.6 with the OpenSearch datasource (Count metric grouped by several terms).
Root cause: the value-field resolver was `selected field → first field with type === 'number'`.
OpenSearch/Elasticsearch returns the Count field **untyped**, so no numeric field was found and
`valueField[0]` was `undefined`; the parser then dereferenced `undefined.values` / `.display` and
threw. In v1.1.3 that throw was swallowed by `SankeyPanel`'s `try/catch`, which then called
`fixColor` obtained from the now-empty parse result (`parsedData[4]` → `undefined`) →
`fixColor is not a function` → minified "p is not a function" during render.

The `fixColor` half was already fixed in the refactor (`fixColor` is a direct import; parse
failures render the empty-panel fallback). This change makes the diagram actually render:

- **Value-field resolution** gained a final **last-column fallback**, so `valueField[0]` is never
  undefined when fields exist. The last column is the value field by this panel's contract; it
  fixes the untyped-Count case and avoids picking a numeric dimension (e.g. a port).
- **`formatDisplay`** now guards a missing / non-function `display`, returning the stringified
  value instead of throwing.
- **`parseData`** returns an empty result up front when there are no series/fields (instead of
  dereferencing `data.series[0].fields`).



## 10. Stage/value separation + value-field resolution (bug fix) — `dataParser.ts`, `Headers.tsx`

Found while building the manual-test datasets below. Two coupled defects meant a **numeric dimension
column silently became the value field**:

- **Resolution order.** Value-field resolution was *selected → first numeric → last column*. On a
  realistic `src, port, dst, bytes` query the first numeric field is `port`, so link thickness was
  the port number (`443`, `80`), `bytes` was ignored entirely, and the tooltip read
  `A -> 443 -> X`. Nothing errored — the diagram was just quietly wrong.
- **Stage columns.** Columns mode hardcoded stages as "every column except the **last**", while the
  value could resolve to a different column. A non-last value column was therefore drawn as a stage
  *and* used as the value, and the last column was silently dropped from the diagram.

Fixed as follows:

- Resolution is now a 4-tier ladder: **selected field → last column if numeric → first numeric field
  → last column regardless of type.** Promoting "last column if numeric" above "first numeric"
  enforces the panel's documented contract and fixes the numeric-dimension case, while the final
  untyped fallback preserves the OpenSearch/Elasticsearch untyped-`Count` fix from item 9.
- Stage columns are derived as **every index except `valueColIndex`**, in query order (the same rule
  edge-list mode already used), so the value column is never drawn as a stage and a genuinely
  non-last value column works.
- `displayNames` now contains **one header per stage column** instead of every field name with the
  value label tacked on the end. `Headers.tsx` was updated accordingly (right label is now the last
  entry, not `length - 2`), and it no longer renders a duplicate label when there is a single stage.
  Middle-label positions are unchanged.

*Intended output change: queries with a numeric dimension before the value column now use the correct
value column (thickness and tooltips change, and the previously-dropped last column appears as a
stage). Queries that already followed the "value is the last column" contract render identically.*

## 11. Tooltip appeared far from the cursor (bug fix) — `Tooltip.tsx`

Reported after the Grafana 13 upgrade: hovering a flow showed the tooltip a long way from the mouse,
and the further the panel sat from the top-left of the screen, the further off it was.

`VizTooltipContainer` positions itself with `position: fixed` + `transform: translate(x, y)`, and we
pass viewport coordinates (`clientX`/`clientY`) — correct in isolation. But a `fixed` element is
positioned relative to its nearest ancestor with a `transform` / `filter` / `will-change`, not the
viewport, and Grafana's dashboard grid puts a transform on every panel wrapper. Rendered inline
inside the panel, the tooltip was therefore offset by the panel's own screen position.

`Tooltip.tsx` now wraps the container in `@grafana/ui`'s `<Portal>`, which renders into Grafana's
body-level overlay container and escapes the transformed containing block — the same thing Grafana's
own viz tooltips do. (The component's doc comment already *claimed* it was "positioned via a portal";
it never was.) A regression test asserts the tooltip is portalled and receives the cursor position.

## 12. "Color links by value mappings" collapsed every unmapped series to one color (bug fix)

The option read the source value's color straight off Grafana's display processor:

```ts
link.color = colorByValueMappings && origin.mappedColor ? origin.mappedColor : paletteColor;
// mappedColor = field.display(value).color
```

`field.display(value).color` **never returns undefined** — with no value mapping it falls through to
the field's threshold / fixed color (`#73BF69` green under the default thresholds mode, `#808080`
with no color config). So the `paletteColor` fallback was unreachable, and enabling the option
turned every unmapped source one flat color, destroying series differentiation. To use the feature
you had to hand-map every value.

`mappedColor` is now resolved by `makeMappingColorResolver`, which returns a color **only when a
value mapping supplies one**, and `undefined` otherwise, making the palette fallback real.

Rather than reimplement Grafana's mapping semantics (value / range / regex / special maps and their
precedence), it builds a display processor over the same field config with the color mode forced to
a fixed sentinel (`#000001`). Mapping colors still win over a fixed color, so any result other than
the sentinel is exactly "a value mapping supplied this color". `getValueMappingResult` would have
been the direct API, but it is not re-exported from `@grafana/data`'s root (verified at runtime), and
deep-importing `dist/` is fragile across Grafana versions. Resolvers are built lazily, once per
field, and only when the option is enabled.

This deliberately **ignores thresholds and field color config** — the option is *Color links by value
mappings*, and its description no longer claims otherwise. `parseData` gained a trailing `theme`
parameter (defaulting to `createTheme()`), which `SankeyPanel` supplies from `useTheme2()`.

*Output change only when the option is enabled (it is off by default): unmapped sources now keep
their palette color instead of going flat grey/green. With the option off, output is byte-identical
— verified by diffing link colors, values, headers and row labels against the previous
implementation.*

The old unit test for this path stubbed `display` to return `color: undefined` for unmapped values —
something Grafana never does — so it passed while the branch it "covered" was dead in production. It
has been replaced with tests that drive the **real** `getDisplayProcessor` with real mappings.

## Still not changed

- No explicit per-series color override option was added (deterministic-by-name was chosen), but
  **Color links by value mappings** gives per-value control — see "Changing flow colors" below.
- Cyclic edge-list data renders empty rather than a laid-out partial graph; breaking cycles is
  future work.

---

# How to run the tests

> **Package manager.** The project pins `yarn@1.22.10` (`packageManager` in `package.json`, and the
> lockfile is `yarn.lock`). If `yarn` is not on your PATH, prefix the commands with `npx yarn@1.22.10`
> or substitute `npm run <script>` — every script below works either way. Install dependencies with
> yarn, though, so `yarn.lock` stays authoritative.

## Unit tests (Jest)

No Grafana instance required — the suite runs entirely in `jsdom`.

```bash
yarn install       # once
yarn test          # watch mode, only changed files
yarn test:ci       # single run, what CI executes
```

Specs live in `tests/unit/` and import from `../../src`. Useful variations:

```bash
yarn test:ci -- tests/unit/dataParser.test.ts     # one file
yarn test:ci -- -t "fixColor"                     # tests matching a name
```

Related checks, both of which must also pass:

```bash
yarn typecheck     # tsc --noEmit
yarn lint          # eslint (yarn lint:fix to autofix)
```

## End-to-end tests (Playwright + `@grafana/plugin-e2e`)

The e2e suite drives a **real, already-running Grafana** that has this plugin loaded. There is no
Docker step and no datasource setup: `tests/e2e/sankey.spec.ts` mocks the `/api/ds/query` response
with fixed `source,target,value` frames via `mockQueryDataResponse`, so the diagram gets
deterministic data no matter which datasource is selected.

**One-time setup** — build the plugin and expose `dist/` to Grafana as the plugin id
`netsage-sankey-panel`, then allow it to load unsigned:

```bash
yarn build

# Symlink dist/ into Grafana's plugin directory (Homebrew path shown):
ln -s "$(pwd)/dist" /opt/homebrew/var/lib/grafana/plugins/netsage-sankey-panel
```

In `/opt/homebrew/etc/grafana/grafana.ini`, under `[plugins]`:

```ini
allow_loading_unsigned_plugins = netsage-sankey-panel
```

Restart Grafana so it picks up the plugin (`brew services restart grafana`), and confirm it is
listed under *Administration → Plugins*.

**Running:**

```bash
yarn e2e           # headless
yarn e2e:ui        # Playwright UI mode, good for debugging
npx playwright show-report   # open the HTML report from the last local run
```

Configuration comes from `playwright.config.ts` and these environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `GRAFANA_URL` | `http://localhost:3000` | Grafana base URL |
| `GRAFANA_USER` | `admin` | login user |
| `GRAFANA_PASSWORD` | `admin` | login password |

The `auth` project logs in once and stores the session in `playwright/.auth/admin.json`, which the
`run-tests` project reuses. Tests run serially (`workers: 1`) with one retry locally, because they
share a single live Grafana instance.

**Note:** after changing any source file you must re-run `yarn build` before `yarn e2e` — the tests
exercise the built `dist/` that Grafana loaded, not `src/`. `yarn dev` (watch build) plus a Grafana
running with `app_mode = development` is the faster inner loop. (`app_mode = development` also stops
Grafana serving plugin assets with a one-hour browser cache, so a rebuild shows up on reload.)

**e2e does not run in CI.** `.github/workflows/ci.yml` runs `typecheck`, `lint`, `test:ci` and
`build` on the Node version in `.nvmrc`; the Playwright suite needs a live Grafana with the plugin
installed, which CI does not provision. Adding a Grafana service container with `dist/` mounted as
an unsigned plugin would close that gap.

---

# Sample datasets for manual testing

Each dataset below is meant to be pasted into Grafana directly: add a **TestData** datasource panel,
set **Scenario → CSV Content**, and paste the block. Then set the visualization to **Sankey Panel**.

Remember the panel's core contract: **the last column is the value (link thickness); every other
column is a stage.** Unless noted, leave the panel options at their defaults.

## 1. Basic columns mode (baseline)

Three stages and a value. Exercises headers, node labels, link colors, and both tooltips.

```csv
source,middle,dest,bytes
Chicago,Denver,Seattle,120
Chicago,Denver,Portland,80
Chicago,Dallas,Seattle,45
Boston,Dallas,Portland,60
Boston,Denver,Seattle,30
```

Expect: 3 column headers (`source`, `middle`, `dest`); flows colored by their first-column series
(`Boston`, `Chicago`); hovering a flow shows `Chicago -> Denver -> Seattle` and a bold `120`;
hovering a node shows `name: value`.

## 2. Edge list (multilevel graph)

Set **Link mode → Edge list (source → target)**. Nodes are keyed by name, so `B` is one node even
though it is a target in one row and a source in another — d3-sankey computes the levels.

```csv
source,target,value
A,B,10
A,C,5
B,D,6
C,D,4
B,E,4
D,F,10
```

Expect: a 4-level graph `A → {B,C} → D/E → F`, **no column headers** (suppressed in edge-list mode),
and flows colored by their source node.

## 3. Variable-depth paths (NULL skipping)

Blank cells are skipped rather than becoming bogus `null` nodes, so shorter paths link straight
through to the next real node.

```csv
tier1,tier2,tier3,count
Web,App,DB,50
Web,,DB,20
Cache,,DB,15
Web,App,,10
```

Expect: row 2 renders as `Web -> DB` (not `Web -> null -> DB`), row 4 as `Web -> App`. Confirm via
the flow tooltips. No node is ever labeled `null`.

## 4. Deterministic coloring (row order independence)

The same data as dataset 1 with the rows shuffled. Colors are assigned by **sorted distinct
first-column name**, not encounter order.

```csv
source,middle,dest,bytes
Boston,Dallas,Portland,60
Chicago,Dallas,Seattle,45
Boston,Denver,Seattle,30
Chicago,Denver,Seattle,120
Chicago,Denver,Portland,80
```

Expect: `Boston` and `Chicago` keep the **same colors as in dataset 1** despite the different row
order. To test the **Custom color palette** option, set it to `red, #00DB57, dark-purple` (hex, CSS
names, and Grafana color tokens all work) and confirm the flows recolor in sorted-name order.

## 5. Value formatting and units (tooltips)

Add a field override on `bytes`: **Standard options → Unit → bytes(SI)**.

```csv
service,region,bytes
api,us-east,1500000
api,eu-west,900000
web,us-east,2300000
web,eu-west,450000
```

Expect: tooltips show `1.5 MB` rather than `1500000`, because both the numeric value and the
formatted `displayValue` come from the resolved value field's display processor.

## 6. Value mappings on labels and colors

Add **Value mappings** on the `code` field: `1 → Success` (green), `2 → Retry` (yellow),
`3 → Failure` (red).

```csv
code,stage,count
1,Delivered,300
2,Delivered,40
3,Dropped,25
1,Dropped,10
```

Expect: node labels read `Success` / `Retry` / `Failure`, not `1` / `2` / `3` — each column is run
through **its own** display processor. Then enable **Color links by value mappings** and confirm each
flow takes its source value's mapped color (green / yellow / red), overriding the palette.

## 7. Node ordering

```csv
stage,dest,value
Zulu,Out,10
Alpha,Out,20
Mike,Out,15
```

With **Node ordering → Query order** (default) the left column reads `Zulu, Alpha, Mike` top-to-bottom
(row order), and adding a **Sort by** transform on `stage` reorders the diagram. Switch to
**Automatic** and d3-sankey chooses the vertical order instead, ignoring the transform.

## 8. Cyclic edge list (graceful failure)

Set **Link mode → Edge list**. `A → B → C → A` is a cycle, which d3-sankey rejects by throwing.

```csv
source,target,value
A,B,10
B,C,5
C,A,3
X,X,7
```

Expect: an **empty panel, not a crash** — the layout call is wrapped in try/catch and logs
`Sankey layout error (possibly cyclic data)` to the browser console. The `X,X` self-loop row is
skipped before layout. Remove the `C,A` row and the diagram renders `A → B → C` plus nothing for `X`.

## 9. Numeric dimension column (regression test for the stage/value fix)

A numeric **dimension** (`port`) sits before the real value column. This used to break: `port` was
picked as the value field, so thickness was `443`/`80` and `bytes` was ignored. See feature update
10.

```csv
src,port,dst,bytes
A,443,X,100
B,80,Y,200
```

Expect: headers `src`, `port`, `dst`; **`bytes` is the value** (thickness `100`/`200`); the flow
tooltip reads `A -> 443 -> X` with a bold `100`. `port` is a stage, not the value.

For the non-last-value case, set **Value Field → port** explicitly: `port` then leaves the stages and
`src`, `dst`, `bytes` become the three stage columns.

## 10. Empty and degenerate input

```csv
source,target,value
```

A header-only CSV (no rows), and likewise a panel with no query at all, should render the empty
`<svg>` fallback with no console errors and no orphan tooltip left in the DOM.
