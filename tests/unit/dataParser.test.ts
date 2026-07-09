import {
  createTheme,
  DataFrame,
  FieldConfig,
  FieldType,
  getDisplayProcessor,
  LinkModel,
  MappingType,
  ThresholdsMode,
  toDataFrame,
  ValueMapping,
} from '@grafana/data';
import { fixColor, formatDisplay, parseData } from '../../src/dataParser';

/**
 * Test helper: build a DataFrame from a compact field spec and (optionally) patch a `display`
 * processor or `getLinks` accessor onto individual fields. `parseData` reads both live, so
 * patching after `toDataFrame` is sufficient and mirrors what Grafana does at runtime
 * (`applyFieldOverrides` attaches `display`; data-link field config attaches `getLinks`).
 */
interface FieldSpec {
  name: string;
  values: any[];
  type?: FieldType;
  /** Real Grafana field config (mappings, thresholds, color mode) — used by the value-mapping tests. */
  config?: FieldConfig;
  display?: (v: any) => { text: string; suffix?: string; color?: string };
  getLinks?: (opts: { valueRowIndex?: number }) => LinkModel[];
}

function makeFrame(fields: FieldSpec[]): DataFrame {
  const df = toDataFrame({
    fields: fields.map((f) => ({
      name: f.name,
      type: f.type ?? FieldType.string,
      values: f.values,
      config: f.config ?? {},
    })),
  });
  fields.forEach((f, i) => {
    if (f.display) {
      df.fields[i].display = f.display as any;
    } else if (f.config) {
      // Attach a REAL display processor, as Grafana's applyFieldOverrides does, so value mappings
      // reach node labels and colors exactly the way they do at runtime.
      df.fields[i].display = getDisplayProcessor({ field: df.fields[i], theme: createTheme() });
    }
    if (f.getLinks) {
      (df.fields[i] as any).getLinks = f.getLinks;
    }
  });
  return df;
}

function parse(frame: DataFrame, opts: Partial<Parameters<typeof parseData>[1]> = {}, ...rest: any[]) {
  return parseData({ series: [frame] }, { valueField: undefined, ...opts } as any, ...(rest as [any, any]));
}

// Map each link to the name of its origin node -> assigned color. Used to assert coloring.
function colorByOrigin(result: ReturnType<typeof parseData>) {
  const map = new Map<any, string>();
  for (const link of result.pluginData.links) {
    map.set(result.pluginData.nodes[link.node0].name, link.color);
  }
  return map;
}

describe('fixColor', () => {
  it('maps known Grafana color tokens to concrete CSS colors', () => {
    expect(fixColor('dark-green')).toBe('#1A7311');
    expect(fixColor('light-blue')).toBe('rgb(87, 148, 242)');
  });

  it('passes unknown / raw CSS values through unchanged', () => {
    expect(fixColor('blue')).toBe('blue');
    expect(fixColor('#abcdef')).toBe('#abcdef');
    expect(fixColor('grey')).toBe('grey');
  });
});

describe('formatDisplay', () => {
  it('returns just the text when there is no suffix', () => {
    expect(formatDisplay({ display: () => ({ text: '5' }) }, 5)).toBe('5');
  });

  it('joins text and suffix with a space', () => {
    expect(formatDisplay({ display: () => ({ text: '5', suffix: 'bps' }) }, 5)).toBe('5 bps');
  });

  it('falls back to String(value) when display is missing or not a function', () => {
    expect(formatDisplay(undefined, 42)).toBe('42');
    expect(formatDisplay({ display: undefined }, 42)).toBe('42');
    expect(formatDisplay({ display: 'nope' as any }, 7)).toBe('7');
  });

  it('returns empty string for null/undefined with no display (guards "p is not a function")', () => {
    expect(formatDisplay(undefined, null)).toBe('');
    expect(formatDisplay(undefined, undefined)).toBe('');
  });
});

describe('parseData — columns mode', () => {
  const basic = () =>
    makeFrame([
      { name: 'src', values: ['A', 'B'] },
      { name: 'dst', values: ['X', 'Y'] },
      { name: 'val', type: FieldType.number, values: [10, 20] },
    ]);

  it('builds one node per (column, name) and one link per consecutive pair', () => {
    const result = parse(basic(), { valueField: 'val' }, false, 'blue');
    expect(result.pluginData.nodes.map((n) => n.name)).toEqual(['A', 'X', 'B', 'Y']);
    const links = result.pluginData.links;
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ source: 0, target: 1, value: 10, id: 'row0' });
    expect(links[1]).toMatchObject({ source: 2, target: 3, value: 20, id: 'row1' });
  });

  it('keeps the same name in different columns as distinct nodes', () => {
    const frame = makeFrame([
      { name: 'c0', values: ['A'] },
      { name: 'c1', values: ['A'] },
      { name: 'val', type: FieldType.number, values: [1] },
    ]);
    const result = parse(frame, { valueField: 'val' }, false, 'blue');
    expect(result.pluginData.nodes).toHaveLength(2);
    expect(result.pluginData.nodes[0].colId).toBe(0);
    expect(result.pluginData.nodes[1].colId).toBe(1);
  });

  it('produces header displayNames and " -> " joined rowDisplayNames', () => {
    const frame = makeFrame([
      { name: 'src', values: ['A'] },
      { name: 'mid', values: ['M'] },
      { name: 'dst', values: ['Z'] },
      { name: 'val', type: FieldType.number, values: [5] },
    ]);
    const result = parse(frame, { valueField: 'val' }, false, 'blue');
    // Headers are the STAGE columns only — the value column is not a stage.
    expect(result.displayNames).toEqual(['src', 'mid', 'dst']);
    expect(result.rowDisplayNames).toEqual([{ name: 'row0', display: 'A -> M -> Z' }]);
  });

  it('records every row id passing through a shared node', () => {
    const frame = makeFrame([
      { name: 'src', values: ['A', 'A'] },
      { name: 'dst', values: ['X', 'Y'] },
      { name: 'val', type: FieldType.number, values: [1, 2] },
    ]);
    const result = parse(frame, { valueField: 'val' }, false, 'blue');
    // Node "A" is used by both rows.
    expect(result.pluginData.nodes[0].name).toBe('A');
    expect(result.pluginData.nodes[0].id).toEqual(['row0', 'row1']);
  });
});

describe('parseData — value-field resolution (4-tier)', () => {
  it('uses the explicitly selected value field', () => {
    const frame = makeFrame([
      { name: 'dim', values: ['A'] },
      { name: 'chosen', type: FieldType.number, values: [99] },
      { name: 'other', type: FieldType.number, values: [7] },
    ]);
    const result = parse(frame, { valueField: 'chosen' }, false, 'blue');
    expect(result.valueField.name).toBe('chosen');
  });

  it('prefers the last column over an earlier numeric DIMENSION column', () => {
    // src | port(number) | dst | bytes(number). "First numeric" used to pick `port`, making link
    // thickness the port number and ignoring `bytes` entirely.
    const frame = makeFrame([
      { name: 'src', values: ['A'] },
      { name: 'port', type: FieldType.number, values: [443] },
      { name: 'dst', values: ['X'] },
      { name: 'bytes', type: FieldType.number, values: [100] },
    ]);
    const result = parse(frame, { valueField: undefined }, false, 'blue');
    expect(result.valueField.name).toBe('bytes');
    expect(result.pluginData.links.map((l) => l.value)).toEqual([100, 100]);
    // `port` stays a stage; `bytes` is not drawn as one.
    expect(result.displayNames).toEqual(['src', 'port', 'dst']);
    expect(result.rowDisplayNames[0].display).toBe('A -> 443 -> X');
  });

  it('falls back to the first numeric field when the last column is not numeric', () => {
    // A transform reordered the columns: the value is genuinely not last.
    const frame = makeFrame([
      { name: 'count', type: FieldType.number, values: [3] },
      { name: 'src', values: ['A'] },
      { name: 'dst', values: ['X'] },
    ]);
    const result = parse(frame, { valueField: 'does-not-exist' }, false, 'blue');
    expect(result.valueField.name).toBe('count');
  });

  it('falls back to the LAST column when no field is typed numeric (untyped Count case)', () => {
    // Simulates OpenSearch/Elasticsearch returning an untyped Count field: no numeric field,
    // no matching selection. Without the last-column fallback valueField[0] would be undefined
    // and .display would throw ("TypeError: p is not a function").
    const frame = makeFrame([
      { name: 'dim', type: FieldType.string, values: ['A'] },
      { name: 'Count', type: FieldType.other, values: [5] },
    ]);
    const result = parse(frame, { valueField: 'nope' }, false, 'blue');
    expect(result.valueField).toBeDefined();
    expect(result.valueField.name).toBe('Count');
  });
});

describe('parseData — value / displayValue consistency (bug fix)', () => {
  it('sources link value from the selected value column, not a hardcoded last column', () => {
    // dim | sel(selected value) | last  — selecting a NON-last field must make the link value
    // come from that field, not from the last column.
    const frame = makeFrame([
      { name: 'dim', values: ['A'] },
      { name: 'sel', type: FieldType.number, values: [99] },
      { name: 'last', type: FieldType.number, values: [7] },
    ]);
    const result = parse(frame, { valueField: 'sel' }, false, 'blue');
    expect(result.pluginData.links[0].value).toBe(99);
    expect(result.pluginData.links[0].displayValue).toBe('99');
  });

  it('excludes the selected value column from the stages, keeping the last column as one', () => {
    // dim | sel(selected value) | last — stages must be [dim, last], NOT [dim, sel].
    const frame = makeFrame([
      { name: 'dim', values: ['A'] },
      { name: 'sel', type: FieldType.number, values: [99] },
      { name: 'last', values: ['Z'] },
    ]);
    const result = parse(frame, { valueField: 'sel' }, false, 'blue');
    expect(result.displayNames).toEqual(['dim', 'last']);
    expect(result.pluginData.nodes.map((n) => n.name)).toEqual(['A', 'Z']);
    expect(result.rowDisplayNames[0].display).toBe('A -> Z');
    expect(result.pluginData.links[0].value).toBe(99);
  });
});

describe('parseData — deterministic coloring', () => {
  const build = (rows: Array<[string, string, number]>) =>
    makeFrame([
      { name: 'src', values: rows.map((r) => r[0]) },
      { name: 'dst', values: rows.map((r) => r[1]) },
      { name: 'val', type: FieldType.number, values: rows.map((r) => r[2]) },
    ]);

  it('assigns the same color to a series regardless of row order', () => {
    const forward = parse(build([['A', 'X', 1], ['B', 'Y', 2]]), { valueField: 'val' }, false, 'blue');
    const reversed = parse(build([['B', 'Y', 2], ['A', 'X', 1]]), { valueField: 'val' }, false, 'blue');
    const cf = colorByOrigin(forward);
    const cr = colorByOrigin(reversed);
    expect(cf.get('A')).toBe(cr.get('A'));
    expect(cf.get('B')).toBe(cr.get('B'));
    // Distinct series get distinct palette colors.
    expect(cf.get('A')).not.toBe(cf.get('B'));
  });

  it('uses a single color for every link in monochrome mode', () => {
    const result = parse(build([['A', 'X', 1], ['B', 'Y', 2]]), { valueField: 'val' }, true, 'red');
    const colors = new Set(result.pluginData.links.map((l) => l.color));
    expect(colors).toEqual(new Set(['red']));
  });

  it('resolves the monochrome color through fixColor', () => {
    const result = parse(build([['A', 'X', 1]]), { valueField: 'val' }, true, 'dark-green');
    expect(result.pluginData.links[0].color).toBe('#1A7311');
  });

  it('overrides the default palette with a custom palette', () => {
    const result = parse(
      build([['A', 'X', 1], ['B', 'Y', 2]]),
      { valueField: 'val' },
      false,
      'blue',
      'columns',
      '#111111,#222222'
    );
    const colors = colorByOrigin(result);
    expect(new Set(colors.values()).size).toBe(2);
    expect([...colors.values()].every((c) => ['#111111', '#222222'].includes(c))).toBe(true);
  });

});

/**
 * These exercise the REAL Grafana display processor rather than a stub. That matters: an earlier
 * version of this suite stubbed `display` to return `color: undefined` for unmapped values, which
 * Grafana never does — it always falls through to the field's threshold/fixed color. The stub made
 * the palette-fallback branch look reachable when in production it was dead, and every unmapped
 * series silently collapsed to one flat color.
 */
describe('parseData — coloring by value mappings', () => {
  const theme = createTheme();
  const PALETTE = ['#111111', '#222222'];

  // A frame whose `src` column carries real field config (mappings), the way Grafana supplies it.
  const frameWithSrcConfig = (config: FieldSpec['config']) =>
    makeFrame([
      { name: 'src', values: ['A', 'B'], config },
      { name: 'dst', values: ['X', 'Y'] },
      { name: 'val', type: FieldType.number, values: [1, 2] },
    ]);

  const colorsWithMappings = (config: FieldSpec['config']) =>
    colorByOrigin(
      parse(frameWithSrcConfig(config), { valueField: 'val' }, false, 'blue', 'columns', PALETTE.join(','), true, theme)
    );

  const mapAToRed: ValueMapping[] = [{ type: MappingType.ValueToText, options: { A: { color: 'red', index: 0 } } }];

  it('uses the mapped color for a mapped value', () => {
    const colors = colorsWithMappings({ mappings: mapAToRed });
    expect(colors.get('A')).toBe(theme.visualization.getColorByName('red'));
  });

  it('keeps the PALETTE color for a value with no mapping (regression: used to go flat grey/green)', () => {
    const colors = colorsWithMappings({ mappings: mapAToRed });
    expect(PALETTE).toContain(colors.get('B'));
  });

  it('keeps palette colors when a mapping sets only display text, not a color', () => {
    const textOnly: ValueMapping[] = [{ type: MappingType.ValueToText, options: { A: { text: 'Alpha', index: 0 } } }];
    const colors = colorByOrigin(
      parse(frameWithSrcConfig({ mappings: textOnly }), { valueField: 'val' }, false, 'blue', 'columns', PALETTE.join(','), true, theme)
    );
    // 'Alpha' is the mapped node label; it must still take a palette color.
    expect(PALETTE).toContain(colors.get('Alpha'));
  });

  it('ignores thresholds — the option is "color by value MAPPINGS"', () => {
    const colors = colorsWithMappings({
      color: { mode: 'thresholds' },
      thresholds: { mode: ThresholdsMode.Absolute, steps: [{ value: -Infinity, color: 'green' }] },
    } as any);
    expect(PALETTE).toContain(colors.get('A'));
    expect(PALETTE).toContain(colors.get('B'));
  });

  it('changes nothing when the option is off, even with mappings present', () => {
    const colors = colorByOrigin(
      parse(
        frameWithSrcConfig({ mappings: mapAToRed }),
        { valueField: 'val' },
        false,
        'blue',
        'columns',
        PALETTE.join(','),
        false,
        theme
      )
    );
    expect(PALETTE).toContain(colors.get('A'));
    expect(PALETTE).toContain(colors.get('B'));
  });
});

describe('parseData — NULL / empty cell handling (columns mode)', () => {
  it('links real nodes directly, skipping NULL stage cells (no "null" node)', () => {
    const frame = makeFrame([
      { name: 'c0', values: ['A'] },
      { name: 'c1', values: [null] },
      { name: 'c2', values: ['Z'] },
      { name: 'val', type: FieldType.number, values: [5] },
    ]);
    const result = parse(frame, { valueField: 'val' }, false, 'blue');
    expect(result.pluginData.nodes.map((n) => n.name)).toEqual(['A', 'Z']);
    expect(result.pluginData.nodes.some((n) => n.name === null || n.name === 'null')).toBe(false);
    expect(result.pluginData.links).toHaveLength(1);
    expect(result.rowDisplayNames[0].display).toBe('A -> Z');
  });

  it('contributes nothing for a row whose stage cells are all NULL/empty', () => {
    const frame = makeFrame([
      { name: 'c0', values: ['', 'A'] },
      { name: 'c1', values: [null, 'Z'] },
      { name: 'val', type: FieldType.number, values: [1, 2] },
    ]);
    const result = parse(frame, { valueField: 'val' }, false, 'blue');
    // Only the second row produced a link.
    expect(result.pluginData.links).toHaveLength(1);
    expect(result.rowDisplayNames).toEqual([{ name: 'row1', display: 'A -> Z' }]);
  });
});

describe('parseData — value mappings applied to node labels', () => {
  it('uses each column display processor for node names', () => {
    const frame = makeFrame([
      { name: 'src', type: FieldType.number, values: [1], display: (v) => ({ text: v === 1 ? 'Prod' : String(v) }) },
      { name: 'dst', values: ['Z'] },
      { name: 'val', type: FieldType.number, values: [5] },
    ]);
    const result = parse(frame, { valueField: 'val' }, false, 'blue');
    expect(result.pluginData.nodes[0].name).toBe('Prod');
  });
});

describe('parseData — edge-list mode', () => {
  const edges = (rows: Array<[any, any, number]>) =>
    makeFrame([
      { name: 'source', values: rows.map((r) => r[0]) },
      { name: 'target', values: rows.map((r) => r[1]) },
      { name: 'val', type: FieldType.number, values: rows.map((r) => r[2]) },
    ]);

  it('keys nodes by name only so a shared name connects into a multilevel graph', () => {
    const result = parse(edges([['A', 'B', 5], ['B', 'C', 3]]), { valueField: 'val' }, false, 'blue', 'edgeList');
    // A, B, C — B is shared between target(row0) and source(row1).
    expect(result.pluginData.nodes.map((n) => n.name)).toEqual(['A', 'B', 'C']);
    expect(result.pluginData.links).toHaveLength(2);
    expect(result.pluginData.links[1]).toMatchObject({ source: 1, target: 2 });
  });

  it('skips self-loops and rows with a null/empty endpoint', () => {
    const result = parse(
      edges([['A', 'A', 1], ['A', null as any, 2], ['A', 'B', 3]]),
      { valueField: 'val' },
      false,
      'blue',
      'edgeList'
    );
    expect(result.pluginData.links).toHaveLength(1);
    expect(result.rowDisplayNames).toEqual([{ name: 'row2', display: 'A -> B' }]);
  });

  it('suppresses column headers (empty displayNames)', () => {
    const result = parse(edges([['A', 'B', 1]]), { valueField: 'val' }, false, 'blue', 'edgeList');
    expect(result.displayNames).toEqual([]);
  });
});

describe('parseData — data links', () => {
  it('gathers row links across fields and de-dupes by href+title', () => {
    const sameLink = () => [{ href: '/dash', title: 'Go' } as LinkModel];
    const frame = makeFrame([
      { name: 'src', values: ['A'], getLinks: sameLink },
      { name: 'dst', values: ['X'], getLinks: sameLink }, // duplicate default link
      { name: 'val', type: FieldType.number, values: [1], getLinks: () => [{ href: '/other', title: 'Other' } as LinkModel] },
    ]);
    const result = parse(frame, { valueField: 'val' }, false, 'blue');
    const hrefs = result.pluginData.links[0].dataLinks.map((l) => l.href).sort();
    expect(hrefs).toEqual(['/dash', '/other']);
  });

  it('returns an empty dataLinks array when no field exposes links', () => {
    const frame = makeFrame([
      { name: 'src', values: ['A'] },
      { name: 'dst', values: ['X'] },
      { name: 'val', type: FieldType.number, values: [1] },
    ]);
    const result = parse(frame, { valueField: 'val' }, false, 'blue');
    expect(result.pluginData.links[0].dataLinks).toEqual([]);
  });
});

describe('parseData — empty input guard', () => {
  it('returns an empty result for no series', () => {
    const result = parseData({ series: [] }, { valueField: undefined }, false, 'blue');
    expect(result).toEqual({
      pluginData: { links: [], nodes: [] },
      displayNames: [],
      rowDisplayNames: [],
      valueField: undefined,
    });
  });

  it('returns an empty result for a frame with no fields', () => {
    const result = parse(toDataFrame({ fields: [] }), { valueField: undefined }, false, 'blue');
    expect(result.pluginData.links).toEqual([]);
    expect(result.pluginData.nodes).toEqual([]);
    expect(result.valueField).toBeUndefined();
  });
});
