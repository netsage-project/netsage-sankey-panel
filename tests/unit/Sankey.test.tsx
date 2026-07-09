import React from 'react';
import { render } from '@testing-library/react';
import { Sankey } from '../../src/components/Sankey';

// Stub the @grafana/ui pieces reached via the child Tooltip/Link components so the whole
// @grafana/ui index (which pulls in ESM react-calendar) doesn't have to load. The real d3-sankey
// layout, Node, Headers and Link path rendering are still exercised.
jest.mock('@grafana/ui', () => ({
  VizTooltipContainer: ({ children }: any) => children,
  DataLinksContextMenu: ({ children }: any) => children({ triggerProps: {} }),
}));

// Exercises the real d3-sankey layout (memoized clone) end-to-end.
const baseProps = {
  width: 600,
  height: 400,
  displayNames: ['src', 'dst', 'val'],
  rowDisplayNames: [{ name: 'row0', display: 'A -> B' }],
  id: 't1',
  textColor: '#111',
  nodeColor: '#eee',
  field: undefined,
  nodeWidth: 30,
  nodePadding: 30,
  labelSize: 14,
  iteration: 7,
  nodeOrder: 'data' as const,
};

const validData = {
  nodes: [
    { name: 'A', id: ['row0'], colId: 0 },
    { name: 'B', id: ['row0'], colId: 1 },
  ],
  links: [
    { source: 0, target: 1, value: 10, id: 'row0', color: '#ff0000', displayValue: '10', node0: 0, dataLinks: [] },
  ],
};

describe('Sankey', () => {
  it('renders an empty placeholder div (not an svg) when there is no data', () => {
    const { container } = render(<Sankey {...baseProps} data={undefined} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('#Chart_t1')?.tagName.toLowerCase()).toBe('div');
  });

  it('lays out and renders one <path> per link and one <rect> per node', () => {
    const { container } = render(<Sankey {...baseProps} data={validData} />);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelectorAll('path')).toHaveLength(1);
    expect(container.querySelectorAll('rect')).toHaveLength(2);
  });

  it('renders links at the resting opacity (0.7) when nothing is hovered', () => {
    const { container } = render(<Sankey {...baseProps} data={validData} />);
    expect(container.querySelector('path')!.getAttribute('opacity')).toBe('0.7');
  });

  it('falls back to the empty placeholder when the layout throws (cyclic data)', () => {
    const cyclic = {
      nodes: [
        { name: 'A', id: ['row0'], colId: 0 },
        { name: 'B', id: ['row1'], colId: 1 },
      ],
      links: [
        { source: 0, target: 1, value: 1, id: 'row0', color: '#f00', displayValue: '1', node0: 0, dataLinks: [] },
        { source: 1, target: 0, value: 1, id: 'row1', color: '#f00', displayValue: '1', node0: 1, dataLinks: [] },
      ],
    };
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<Sankey {...baseProps} data={cyclic} />);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('#Chart_t1')?.tagName.toLowerCase()).toBe('div');
    errSpy.mockRestore();
  });
});
