import React from 'react';
import { render, screen } from '@testing-library/react';
import { Portal, VizTooltipContainer } from '@grafana/ui';
import { Tooltip, HoverState } from '../../src/components/Tooltip';

// Importing the full @grafana/ui index transitively loads react-calendar (ESM, un-transformed)
// and is slow to transform. Tooltip only needs Portal + VizTooltipContainer, so stub both to
// passthroughs that render their children — enough to exercise Tooltip's own logic.
jest.mock('@grafana/ui', () => ({
  Portal: jest.fn(({ children }: any) => children),
  VizTooltipContainer: jest.fn(({ children }: any) => children),
}));

beforeEach(() => {
  (Portal as unknown as jest.Mock).mockClear();
  (VizTooltipContainer as unknown as jest.Mock).mockClear();
});

const hoverAt = (x: number, y: number): HoverState => ({
  kind: 'link',
  linkId: 'row0',
  x,
  y,
  content: <span>A -&gt; B</span>,
});

describe('Tooltip', () => {
  it('renders nothing when nothing is hovered', () => {
    const { container } = render(<Tooltip hover={null} />);
    expect(container).toBeEmptyDOMElement();
    expect(Portal).not.toHaveBeenCalled();
  });

  it('renders the hover content when something is hovered', () => {
    render(<Tooltip hover={hoverAt(5, 5)} />);
    expect(screen.getByText('A -> B')).toBeInTheDocument();
  });

  // Regression: rendered inline, VizTooltipContainer's `position: fixed` resolves against the
  // dashboard grid's transformed panel wrapper instead of the viewport, so the tooltip appears
  // far from the cursor. It must be portalled out of the panel.
  it('portals the tooltip out of the panel and forwards the cursor position', () => {
    render(<Tooltip hover={hoverAt(120, 340)} />);
    expect(Portal).toHaveBeenCalled();
    expect(VizTooltipContainer).toHaveBeenCalledWith(
      expect.objectContaining({ position: { x: 120, y: 340 }, offset: { x: 10, y: 10 } }),
      undefined
    );
  });
});
