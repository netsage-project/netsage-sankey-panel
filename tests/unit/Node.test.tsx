import React from 'react';
import { render } from '@testing-library/react';
import { Node } from '../../src/components/Node';

// Render inside an <svg> so the <rect>/<text> have a valid SVG parent.
function renderNode(data: any, overrides: Partial<React.ComponentProps<typeof Node>> = {}) {
  const { container } = render(
    <svg>
      <Node
        data={data}
        textColor="#112233"
        nodeColor="#eeeeee"
        labelSize={14}
        graphWidth={200}
        onHover={() => {}}
        onLeave={() => {}}
        {...overrides}
      />
    </svg>
  );
  return container;
}

describe('Node — label placement bug fix', () => {
  it('places the label to the RIGHT (start-anchored) for a left-half node', () => {
    // x0 (10) < graphWidth/2 (100) -> label on the right of the node.
    const container = renderNode({ x0: 10, x1: 40, y0: 0, y1: 20, name: 'Left' });
    const text = container.querySelector('text')!;
    expect(text.style.textAnchor).toBe('start');
    expect(text.getAttribute('x')).toBe('46'); // x1 + 6
    expect(text.textContent).toBe('Left');
  });

  it('places the label to the LEFT (end-anchored) for a right-half node', () => {
    // x0 (150) >= graphWidth/2 (100) -> label on the left of the node.
    const container = renderNode({ x0: 150, x1: 180, y0: 0, y1: 20, name: 'Right' });
    const text = container.querySelector('text')!;
    expect(text.style.textAnchor).toBe('end');
    expect(text.getAttribute('x')).toBe('144'); // x0 - 6
  });

  it('applies theme text color, label size, and node fill color', () => {
    const container = renderNode({ x0: 10, x1: 40, y0: 0, y1: 20, name: 'N' }, { labelSize: 18 });
    const text = container.querySelector('text')!;
    const rect = container.querySelector('rect')!;
    expect(text.style.fill).toBe('#112233');
    expect(text.style.fontSize).toBe('18px');
    expect(rect.getAttribute('fill')).toBe('#eeeeee');
  });
});
