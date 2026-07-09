import React from 'react';
import { render } from '@testing-library/react';
import { SankeyPanel } from '../../src/SankeyPanel';
import { parseData } from '../../src/dataParser';

// Stub the @grafana/ui exports used by SankeyPanel (useTheme2) and its child Sankey/Tooltip/Link
// so the heavy @grafana/ui index (ESM react-calendar) is not loaded during the test.
jest.mock('@grafana/ui', () => ({
  useTheme2: () => ({ colors: { text: { primary: '#ffffff' } } }),
  VizTooltipContainer: ({ children }: any) => children,
  DataLinksContextMenu: ({ children }: any) => children({ triggerProps: {} }),
}));

// Mock the parser so we can drive both the success and the parse-failure branch. fixColor and
// formatDisplay are also consumed (by SankeyPanel and Sankey respectively), so stub them too.
jest.mock('../../src/dataParser', () => ({
  parseData: jest.fn(),
  fixColor: (c: string) => c,
  formatDisplay: () => '',
}));

const mockedParseData = parseData as jest.Mock;

const options: any = {
  monochrome: false,
  color: 'blue',
  colorByValueMappings: false,
  palette: '',
  nodeColor: 'grey',
  nodeWidth: 30,
  nodePadding: 30,
  labelSize: 14,
  valueField: '',
  iteration: 7,
  nodeOrder: 'data',
  linkMode: 'columns',
};

function renderPanel() {
  return render(
    <SankeyPanel
      {...({
        options,
        data: { series: [] },
        width: 600,
        height: 400,
        id: 1,
      } as any)}
    />
  );
}

describe('SankeyPanel', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the diagram when parsing succeeds', () => {
    mockedParseData.mockReturnValue({
      pluginData: {
        nodes: [
          { name: 'A', id: ['row0'], colId: 0 },
          { name: 'B', id: ['row0'], colId: 1 },
        ],
        links: [
          { source: 0, target: 1, value: 10, id: 'row0', color: '#f00', displayValue: '10', node0: 0, dataLinks: [] },
        ],
      },
      displayNames: ['s', 'd', 'v'],
      rowDisplayNames: [{ name: 'row0', display: 'A -> B' }],
      valueField: undefined,
    });

    const { container } = renderPanel();
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });

  it('renders the empty fallback (no crash) when parsing throws', () => {
    // Resilient error handling bug fix: the old try/catch logged then still dereferenced the
    // missing result and crashed. Now a parse failure leaves `parsed` undefined and the panel
    // renders the empty <Sankey> fallback.
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedParseData.mockImplementation(() => {
      throw new Error('boom');
    });

    const { container } = renderPanel();
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('#Chart_1')?.tagName.toLowerCase()).toBe('div');
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
