import {
  createTheme,
  DataFrameView,
  Field,
  getDisplayProcessor,
  getFieldDisplayName,
  GrafanaTheme2,
  LinkModel,
} from '@grafana/data';

/**
 * Maps Grafana's named color tokens (as emitted by the color picker, e.g. "dark-green")
 * to concrete CSS color strings used for SVG fills/strokes.
 *
 * Extracted to a module-level constant so it is built once instead of being re-created on
 * every `parseData` call (previously an 80-line `switch` inside the function body). The
 * values are unchanged from the original switch, so rendered colors are identical.
 *
 * NOTE (future work): Grafana already resolves these via `theme.visualization.getColorByName`.
 * This hand-maintained map duplicates that palette and can drift from it, but replacing it
 * would be a dependency/theme change outside the scope of this refactor.
 */
const GRAFANA_COLOR_MAP: Record<string, string> = {
  'dark-green': '#1A7311',
  'semi-dark-green': '#36872D',
  'light-green': '#73BF68',
  'super-light-green': '#96D88C',
  'dark-yellow': 'rgb(207, 159, 0)',
  'semi-dark-yellow': 'rgb(224, 180, 0)',
  'light-yellow': 'rgb(250, 222, 42)',
  'super-light-yellow': 'rgb(255, 238, 82)',
  'dark-red': 'rgb(173, 3, 23)',
  'semi-dark-red': 'rgb(196, 22, 42)',
  'light-red': 'rgb(242, 73, 92)',
  'super-light-red': 'rgb(255, 115, 131)',
  'dark-blue': 'rgb(18, 80, 176)',
  'semi-dark-blue': 'rgb(31, 96, 196)',
  'light-blue': 'rgb(87, 148, 242)',
  'super-light-blue': 'rgb(138, 184, 255)',
  'dark-orange': 'rgb(229, 84, 0)',
  'semi-dark-orange': 'rgb(250, 100, 0)',
  'light-orange': 'rgb(255, 152, 48)',
  'super-light-orange': 'rgb(255, 179, 87)',
  'dark-purple': 'rgb(124, 46, 163)',
  'semi-dark-purple': 'rgb(143, 59, 184)',
  'light-purple': 'rgb(184, 119, 217)',
  'super-light-purple': 'rgb(202, 149, 229)',
};

/**
 * Resolve a Grafana named color token to a concrete CSS color. Unknown values (e.g. raw CSS
 * keywords like "blue"/"grey" used as option defaults) are returned unchanged, matching the
 * original `default` branch of the switch.
 *
 * Now exported directly instead of being smuggled back through `parseData`'s return value.
 */
export function fixColor(color: string): string {
  return GRAFANA_COLOR_MAP[color] ?? color;
}

/**
 * Format a numeric value using a Grafana field's display processor, producing the same
 * "text suffix" (or just "text") string used for link/node tooltips.
 *
 * Extracted so the identical suffix/text logic that previously lived in both this file and
 * Tooltip.tsx has a single source of truth.
 */
export function formatDisplay(
  field: { display?: (v: any) => { text: string; suffix?: string } } | undefined,
  value: any
): string {
  // Some datasources return fields without a display processor; fall back to the raw value so we
  // never crash with "display is not a function".
  if (!field || typeof field.display !== 'function') {
    return value == null ? '' : String(value);
  }
  const formatted = field.display(value);
  return formatted.suffix ? `${formatted.text} ${formatted.suffix}` : `${formatted.text}`;
}

/**
 * A colour no sane dashboard uses, injected as the field's `fixed` colour so that ANY other colour
 * coming back from the display processor must have been supplied by a value mapping.
 */
const SENTINEL_COLOR = '#000001';

/**
 * Returns the colour a value mapping assigns to `value`, or `undefined` when no mapping supplies
 * one (no mappings configured, no mapping matched, or the matching mapping only sets display text).
 *
 * Why not just read `field.display(value).color`? Because it never returns undefined: with no
 * mapping it falls through to the field's threshold / fixed colour (green `#73BF69` by default).
 * Using it directly made every unmapped series collapse to one flat colour, which is why the
 * documented "fall back to the palette" branch was unreachable.
 *
 * Rather than reimplement Grafana's mapping semantics (value / range / regex / special, and their
 * precedence), this builds a processor over the same field config with the colour mode forced to a
 * fixed sentinel. Mapping colours still win over that fixed colour, so a result other than the
 * sentinel is exactly "a value mapping supplied this colour". Note this deliberately ignores
 * threshold and field colours — the option is *Color links by value mappings*.
 */
function makeMappingColorResolver(field: Field, theme: GrafanaTheme2): (value: any) => string | undefined {
  if (!field?.config?.mappings?.length) {
    // Nothing configured: skip building a processor at all, so every value falls back to the palette.
    return () => undefined;
  }
  const display = getDisplayProcessor({
    field: { ...field, config: { ...field.config, color: { mode: 'fixed', fixedColor: SENTINEL_COLOR } } },
    theme,
  });
  return (value: any) => {
    const color = display(value).color;
    return color === undefined || color === SENTINEL_COLOR ? undefined : color;
  };
}

/** A single Sankey node (one distinct value within one column). */
export interface SankeyNode {
  name: any;
  /** Row ids (`row0`, `row1`, ...) of every row that passes through this node. */
  id: string[];
  /** Which query column this node belongs to. */
  colId: number;
  /** Grafana-computed color of this node's value, when coloring links by value mappings. */
  mappedColor?: string;
}

/** A single Sankey link connecting two consecutive columns for one row. */
export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  displayValue: string;
  id: string;
  color: any;
  node0: number;
  /** Interpolated Grafana data links configured for this row (empty if none). */
  dataLinks: LinkModel[];
}

/** Shape returned by {@link parseData}. */
export interface ParsedSankeyData {
  pluginData: { links: SankeyLink[]; nodes: SankeyNode[] };
  displayNames: string[];
  rowDisplayNames: Array<{ name: string; display: string }>;
  /** The resolved value field, used for tooltip value formatting. */
  valueField: any;
}

/**
 * Takes data from a Grafana query and returns it in the format needed by d3-sankey.
 *
 * Contract: every column except the value field represents a Sankey "stage", in query order.
 * By default the value field is the last column; a specific field can be chosen via the
 * `valueField` option.
 *
 * @param data the data returned by the query
 * @param options the field options from the editor panel (only `valueField` is used here)
 * @param monochrome whether the sankey links are a single color (true) or multi-colored (false)
 * @param color the chosen link color when `monochrome` is true
 * @param linkMode 'columns' (each column is a level, each row a full path) or 'edgeList'
 *   (first two non-value columns are source→target and nodes connect by name)
 * @param palette custom comma-separated multi-color palette (empty = built-in default)
 * @param colorByValueMappings color flows by the value mapping set on the source value; values
 *   without a mapped color keep their palette color
 * @param theme the active Grafana theme, used to resolve mapping color names
 * @return {@link ParsedSankeyData} the nodes/links plus header + tooltip metadata
 */
export function parseData(
  data: { series: any[] },
  options: { valueField: any },
  monochrome: boolean,
  color: any,
  linkMode: 'columns' | 'edgeList' = 'columns',
  palette = '',
  colorByValueMappings = false,
  theme: GrafanaTheme2 = createTheme()
): ParsedSankeyData {
  // Build the multi-color palette. A non-empty custom `palette` (comma-separated hex / CSS /
  // Grafana color tokens) overrides the built-in default; monochrome uses the single chosen color.
  const defaultPalette = ['#018EDB', '#DB8500', '#7C00DB', '#DB0600', '#00DB57'];
  const customPalette = palette
    .split(',')
    .map((c) => fixColor(c.trim()))
    .filter((c) => c !== '');
  const colorArray: string[] = monochrome
    ? [fixColor(color)]
    : customPalette.length > 0
    ? customPalette
    : defaultPalette;

  // Guard empty input: with no series/fields there is nothing to draw. Return an empty result so
  // SankeyPanel renders its empty-diagram fallback instead of dereferencing missing data.
  if (!data.series || data.series.length === 0 || !data.series[0].fields || data.series[0].fields.length === 0) {
    return {
      pluginData: { links: [], nodes: [] },
      displayNames: [],
      rowDisplayNames: [],
      valueField: undefined,
    };
  }

  // Field.values is a plain array in modern Grafana (the old Vector abstraction was removed).
  const allData: Field[] = data.series[0].fields;
  const lastColIndex = allData.length - 1;

  // Resolve the value field, in priority order:
  //   1. the explicitly selected field;
  //   2. the LAST column, when it is numeric — this panel's contract is "value is the last
  //      column", so it must win over any earlier numeric column. Preferring "first numeric"
  //      here silently stole the value field whenever a numeric DIMENSION (e.g. a port or a
  //      status code) preceded the real value column, making link thickness the port number;
  //   3. the first numeric field — covers a value column that is genuinely not last (e.g. a
  //      transform reordered the columns and the last column is a string);
  //   4. the last column regardless of type — some datasources (e.g. OpenSearch/Elasticsearch)
  //      return the Count field UNTYPED, so tiers 2 and 3 find nothing. Without this fallback
  //      `valueField[0]` would be undefined and `formatDisplay`/`.display` would throw (which
  //      surfaced as "TypeError: p is not a function").
  const pick = (predicate: (fields: any[]) => any) => data.series.map((series: { fields: any[] }) => predicate(series.fields));

  let valueField = pick((fields) => fields.find((field: { name: any }) => field.name === options.valueField));
  if (!valueField[0]) {
    valueField = pick((fields) => (fields[fields.length - 1]?.type === 'number' ? fields[fields.length - 1] : undefined));
  }
  if (!valueField[0]) {
    valueField = pick((fields) => fields.find((field: { type: string }) => field.type === 'number'));
  }
  if (!valueField[0]) {
    valueField = pick((fields) => fields[fields.length - 1]);
  }

  // Column index of the resolved value field. Using this (rather than a hardcoded last-column
  // index) keeps the numeric `value` and its formatted `displayValue` sourced from the SAME field.
  const valueFieldIndex = allData.findIndex((f) => f === valueField[0]);
  const valueColIndex = valueFieldIndex >= 0 ? valueFieldIndex : lastColIndex;

  // Stage columns are every column EXCEPT the value column, in query order. Deriving this from
  // `valueColIndex` (rather than assuming "all but the last") is what stops a non-last value
  // column from also being rendered as a stage.
  const stageIndices = allData.map((_, i) => i).filter((i) => i !== valueColIndex);

  // Header labels: one per stage column. The value column is not a stage, so it has no header.
  const displayNames: string[] = stageIndices.map((i) => getFieldDisplayName(allData[i]));

  const frame = new DataFrameView(data.series[0]);

  const pluginDataLinks: SankeyLink[] = [];
  const pluginDataNodes: SankeyNode[] = [];
  const rowDisplayNames: Array<{ name: string; display: string }> = [];

  // Node lookup: a stable key -> index into pluginDataNodes. In 'columns' mode the key includes
  // the column index (so the same name in different columns stays distinct); in 'edgeList' mode
  // the key is the name only (so a name shared between source/target positions is ONE node).
  const nodeIndexByKey = new Map<string, number>();

  // Run a cell value through its column's OWN display processor so value mappings and unit
  // formatting apply to node labels (falls back to the raw value if there is no processor or it
  // yields empty text).
  const displayCell = (field: any, raw: any) => {
    const displayed = field && typeof field.display === 'function' ? field.display(raw).text : undefined;
    return displayed !== undefined && displayed !== '' ? displayed : raw;
  };

  // Collect the Grafana data links configured for a given row. Grafana attaches `getLinks` to
  // each field once data-link field config is applied; it interpolates `${__data.fields.*}` and
  // the field's own value for the row. A link set as a field default appears on every field and
  // resolves to the same URL, so we de-dupe by href+title. Returns [] when no links are set.
  const getRowLinks = (rowIndex: number): LinkModel[] => {
    const models: LinkModel[] = [];
    const seen = new Set<string>();
    for (const field of allData) {
      if (typeof (field as any).getLinks === 'function') {
        for (const link of (field as any).getLinks({ valueRowIndex: rowIndex }) as LinkModel[]) {
          const dedupeKey = `${link.href}\n${link.title}`;
          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            models.push(link);
          }
        }
      }
    }
    return models;
  };

  // The value-mapping color for a value, or undefined when no mapping supplies one (in which case
  // the link keeps its palette color). Resolvers are built lazily, once per field, and only when
  // coloring by value mappings — otherwise there is no overhead at all.
  const mappingColorResolvers = new Map<number, (value: any) => string | undefined>();
  const getMappedColor = (fieldIndex: number, raw: any): string | undefined => {
    if (!colorByValueMappings) {
      return undefined;
    }
    let resolve = mappingColorResolvers.get(fieldIndex);
    if (!resolve) {
      resolve = makeMappingColorResolver(allData[fieldIndex], theme);
      mappingColorResolvers.set(fieldIndex, resolve);
    }
    return resolve(raw);
  };

  // Find or create a node for the given key, recording that the current row passes through it
  // (used by node tooltips to highlight incident links). Returns the node's index.
  const getOrCreateNode = (name: any, key: string, colId: number, rowId: number, mappedColor?: string) => {
    let index = nodeIndexByKey.get(key);
    if (index === undefined) {
      index = pluginDataNodes.push({ name, id: [`row${rowId}`], colId, mappedColor }) - 1;
      nodeIndexByKey.set(key, index);
    } else {
      pluginDataNodes[index].id.push(`row${rowId}`);
    }
    return index;
  };

  let rowId = 0; // increments after each row

  if (linkMode === 'edgeList') {
    // Edge-list mode: the first two non-value columns are source and target. Nodes are keyed by
    // name only, so a node that is a target in one row and a source in another is the SAME node,
    // letting d3-sankey compute a multilevel graph.
    const sourceIdx = stageIndices[0];
    const targetIdx = stageIndices[1];

    frame.forEach((row: any) => {
      // Need both a source and a target column to form an edge.
      if (sourceIdx !== undefined && targetIdx !== undefined) {
        const sName = displayCell(allData[sourceIdx], row[sourceIdx]);
        const tName = displayCell(allData[targetIdx], row[targetIdx]);

        // Skip rows with a missing (NULL/empty) source or target, and self-loops: d3-sankey
        // rejects circular links, and a node cannot flow to itself.
        const validEndpoints = sName != null && sName !== '' && tName != null && tName !== '';
        if (validEndpoints && sName !== tName) {
          const sIndex = getOrCreateNode(sName, `${sName}`, 0, rowId, getMappedColor(sourceIdx, row[sourceIdx]));
          const tIndex = getOrCreateNode(tName, `${tName}`, 0, rowId, getMappedColor(targetIdx, row[targetIdx]));
          const rowValue = row[valueColIndex];
          pluginDataLinks.push({
            source: sIndex,
            target: tIndex,
            value: rowValue,
            displayValue: formatDisplay(valueField[0], rowValue),
            id: `row${rowId}`,
            color: undefined,
            node0: sIndex,
            dataLinks: getRowLinks(rowId),
          });
          rowDisplayNames.push({ name: `row${rowId}`, display: `${sName} -> ${tName}` });
        }
      }
      rowId++;
    });
  } else {
    // Columns mode: each stage column is a level; each row is a full path across the stage columns.
    frame.forEach((row: any) => {
      const currentLink: number[] = [];
      for (const i of stageIndices) {
        const raw = row[i];
        // Skip empty/NULL cells. Variable-depth paths pad their unused levels with NULL; without
        // this each NULL would become a bogus "null" node that the path routes through. Skipping
        // instead links each real node directly to the next real node in the row.
        if (raw == null || raw === '') {
          continue;
        }
        const node = displayCell(allData[i], raw);
        // colId is numeric, so the first space unambiguously separates it from the node name.
        const index = getOrCreateNode(node, `${i} ${node}`, i, rowId, getMappedColor(i, raw));
        currentLink.push(index);
      }

      // A row whose stage cells are all NULL contributes nothing.
      if (currentLink.length > 0) {
        const rowValue = row[valueColIndex];
        const displayValue = formatDisplay(valueField[0], rowValue);
        // All hops of a row share the same row, so they share the same data links.
        const rowLinks = getRowLinks(rowId);

        // Create a link between each pair of consecutive (non-null) nodes for this row. `color`
        // is a placeholder here; it is assigned deterministically after the loop (see below).
        let rowDisplay = `${pluginDataNodes[currentLink[0]].name}`;
        for (let i = 0; i < currentLink.length - 1; i++) {
          pluginDataLinks.push({
            source: currentLink[i],
            target: currentLink[i + 1],
            value: rowValue,
            displayValue: displayValue,
            id: `row${rowId}`,
            color: undefined,
            node0: currentLink[0],
            dataLinks: rowLinks,
          });
          rowDisplay = rowDisplay.concat(` -> ${pluginDataNodes[currentLink[i + 1]].name}`);
        }
        rowDisplayNames.push({ name: `row${rowId}`, display: rowDisplay });
      }
      rowId++;
    });
  }

  // Deterministic series color: sort the distinct origin-node names (each link's `node0`) and
  // assign palette colors by that stable order, so the same series always gets the same color
  // across diagrams regardless of row order. In columns mode `node0` is always the row's
  // first-column node (identical to the previous first-column coloring); in edge-list mode it is
  // the link's source. Monochrome uses a single-entry palette, so all links share one color.
  const originNames = pluginDataLinks.map((l) => pluginDataNodes[l.node0].name);
  const distinctOriginNames = Array.from(new Set(originNames)).sort();
  const colorByName = new Map<any, string>(
    distinctOriginNames.map((name, i) => [name, colorArray[i % colorArray.length]])
  );
  for (const link of pluginDataLinks) {
    const origin = pluginDataNodes[link.node0];
    const paletteColor = colorByName.get(origin.name);
    // When coloring by value mappings, use the origin's mapped/field color; fall back to the
    // palette color for any value without a resolved color.
    link.color = colorByValueMappings && origin.mappedColor ? origin.mappedColor : paletteColor;
  }

  return {
    pluginData: { links: pluginDataLinks, nodes: pluginDataNodes },
    // Column headers are meaningful only in columns mode; in edge-list mode the graph has
    // computed levels, so we suppress the (misleading) fixed source/target headers.
    displayNames: linkMode === 'edgeList' ? [] : displayNames,
    rowDisplayNames,
    valueField: valueField[0],
  };
}
