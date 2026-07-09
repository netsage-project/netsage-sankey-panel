import { test, expect } from '@grafana/plugin-e2e';

/**
 * End-to-end tests for the Sankey panel, run against a live Grafana that has the plugin loaded.
 *
 * They use @grafana/plugin-e2e's `panelEditPage` fixture, which creates a throwaway dashboard
 * panel in-session — so nothing is provisioned on the shared instance. Instead of driving a
 * datasource query editor (brittle across versions), the query response is MOCKED with fixed
 * `source,target,value` frames via `mockQueryDataResponse`, so the diagram gets deterministic
 * data regardless of which datasource is selected.
 */

type Row = [string, string, number];

// Build a Grafana /api/ds/query response (dataframe JSON) with source/target/value columns.
function queryResponse(rows: Row[]) {
  return {
    results: {
      A: {
        status: 200,
        frames: [
          {
            schema: {
              refId: 'A',
              fields: [
                { name: 'source', type: 'string', typeInfo: { frame: 'string' } },
                { name: 'target', type: 'string', typeInfo: { frame: 'string' } },
                { name: 'value', type: 'number', typeInfo: { frame: 'float64' } },
              ],
            },
            data: {
              values: [rows.map((r) => r[0]), rows.map((r) => r[1]), rows.map((r) => r[2])],
            },
          },
        ],
      },
    },
  };
}

const COLUMNS_ROWS: Row[] = [
  ['A', 'X', 10],
  ['A', 'Y', 5],
  ['B', 'X', 8],
];

const EDGELIST_ROWS: Row[] = [
  ['A', 'B', 10],
  ['B', 'C', 6],
  ['A', 'C', 4],
];

// Register the mocked query response, select a datasource, then click the panel editor's "Run
// query" (Refresh) button until the diagram has rendered link <path>s. Clicking Refresh issues an
// /api/ds/query that the mock (a page.route) fulfills with our frames. We assert on the rendered
// DOM rather than awaiting a response promise (refreshPanel()'s waitForResponse can hang on the
// new dashboard layout when a refresh reuses the already-run query). `toPass` re-clicks + re-checks
// so a click that doesn't (yet) render is simply retried. Returns the panel's Sankey <svg> locator.
async function loadData(panelEditPage: any, page: any, rows: Row[]) {
  await panelEditPage.mockQueryDataResponse(queryResponse(rows));
  await panelEditPage.datasource.set('TestData');
  const svg = panelEditPage.panel.locator.locator('svg[id^="Chart_"]');
  const runButton = page.getByTestId('data-testid RefreshPicker run button').first();
  await expect(async () => {
    await runButton.click({ timeout: 3000 });
    // Links are <path>s; a non-zero count means the mocked data reached the diagram.
    expect(await svg.locator('path').count()).toBeGreaterThan(0);
  }).toPass({ timeout: 30_000, intervals: [1000, 1500, 2000, 3000] });
  return svg;
}

test.describe('Sankey panel', () => {
  test('is selectable as a visualization and exposes its options', async ({ panelEditPage, page }) => {
    await panelEditPage.setVisualization('Sankey Panel');

    // The refactor's new / key options should all be present in the editor.
    await expect(page.getByText('Color links by value mappings')).toBeVisible();
    await expect(page.getByText('Link mode')).toBeVisible();
    await expect(page.getByText('Node ordering')).toBeVisible();
    await expect(page.getByText('Node width')).toBeVisible();
    await expect(page.getByText('Value Field')).toBeVisible();
  });

  test('renders flows and nodes for columns-mode data', async ({ panelEditPage, page }) => {
    await panelEditPage.setVisualization('Sankey Panel');
    const svg = await loadData(panelEditPage, page, COLUMNS_ROWS);

    // loadData already asserted link <path>s rendered; nodes are <rect>s.
    expect(await svg.locator('rect').count()).toBeGreaterThan(0);
    // Column headers render in columns mode (first field's display name).
    await expect(svg.getByText('source')).toBeVisible();
  });

  test('renders a multilevel graph in edge-list mode', async ({ panelEditPage, page }) => {
    await panelEditPage.setVisualization('Sankey Panel');
    // Switch Link mode -> Edge list before loading so the graph is built from shared-name nodes.
    // Use the radio role (clicking the label is intercepted by the overlaid <input>).
    await page.getByRole('radio', { name: /Edge list/ }).check({ force: true });
    const svg = await loadData(panelEditPage, page, EDGELIST_ROWS);

    // Shared node "B" (target of row0, source of row1) connects the levels.
    await expect(svg.getByText('B')).toBeVisible();
  });
});
