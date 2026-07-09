import React from 'react';
import { render } from '@testing-library/react';
import { Headers } from '../../src/components/Headers';

function renderHeaders(displayNames: string[]) {
  const { container } = render(
    <svg>
      <Headers displayNames={displayNames} width={300} topMargin={75} leftMargin={20} textColor="#abc" />
    </svg>
  );
  return container;
}

describe('Headers', () => {
  it('renders nothing when there are no display names (e.g. edge-list mode)', () => {
    const container = renderHeaders([]);
    expect(container.querySelectorAll('text')).toHaveLength(0);
  });

  it('renders a start-anchored left label and an end-anchored right label for the stage columns', () => {
    // displayNames holds STAGE columns only -> left = first, right = last.
    const container = renderHeaders(['src', 'dst']);
    const texts = Array.from(container.querySelectorAll('text'));
    expect(texts).toHaveLength(2);

    const left = texts.find((t) => t.getAttribute('text-anchor') === 'start')!;
    const right = texts.find((t) => t.getAttribute('text-anchor') === 'end')!;
    expect(left.textContent).toBe('src');
    expect(right.textContent).toBe('dst');
    // 14pt / weight 500 preserved from the original imperative D3 headers.
    expect(left.getAttribute('font-size')).toBe('14pt');
    expect(left.getAttribute('font-weight')).toBe('500');
  });

  it('adds evenly spaced middle labels for intermediate stage columns', () => {
    // ['a','b','c','d']: left='a', right='d', middles = 'b','c' (middle-anchored).
    const container = renderHeaders(['a', 'b', 'c', 'd']);
    const texts = Array.from(container.querySelectorAll('text'));
    const middles = texts.filter((t) => t.getAttribute('text-anchor') === 'middle');
    expect(middles.map((t) => t.textContent)).toEqual(['b', 'c']);
    expect(texts).toHaveLength(4);
  });

  it('renders a single label (no duplicate) when there is only one stage column', () => {
    const container = renderHeaders(['only']);
    const texts = Array.from(container.querySelectorAll('text'));
    expect(texts).toHaveLength(1);
    expect(texts[0].textContent).toBe('only');
    expect(texts[0].getAttribute('text-anchor')).toBe('start');
  });
});
