import React from 'react';
import { render } from '@testing-library/react';
import { Link } from '../../src/components/Link';

// Stub the horizontal-link path generator so we don't need a fully laid-out d3-sankey datum.
jest.mock('d3-sankey', () => ({
  sankeyLinkHorizontal: () => () => 'M0,0L10,10',
}));

// Stub DataLinksContextMenu to a passthrough that invokes the child render-prop with fake
// triggerProps, so we can assert the wrapping without pulling in the real @grafana/ui menu.
jest.mock('@grafana/ui', () => ({
  DataLinksContextMenu: ({ children }: any) => children({ triggerProps: { 'data-testid': 'trigger' } }),
}));

function renderLink(data: any) {
  const { container } = render(
    <svg>
      <Link data={data} opacity={0.7} onHover={() => {}} onLeave={() => {}} />
    </svg>
  );
  return container;
}

describe('Link', () => {
  const baseData = { color: '#ff0000', width: 4, dataLinks: [] };

  it('renders a path with the flow color, opacity and width', () => {
    const container = renderLink(baseData);
    const path = container.querySelector('path')!;
    expect(path.getAttribute('stroke')).toBe('#ff0000');
    expect(path.getAttribute('opacity')).toBe('0.7');
    expect(path.getAttribute('stroke-width')).toBe('4');
    expect(path.getAttribute('d')).toBe('M0,0L10,10');
  });

  it('does not wrap a flow that has no data links', () => {
    const container = renderLink(baseData);
    expect(container.querySelector('[data-testid="trigger"]')).toBeNull();
  });

  it('wraps a flow that has data links in DataLinksContextMenu (triggerProps applied)', () => {
    const container = renderLink({ ...baseData, dataLinks: [{ href: '/x', title: 'X' }] });
    // triggerProps from the (stubbed) menu are spread onto the path.
    expect(container.querySelector('path[data-testid="trigger"]')).not.toBeNull();
  });
});
