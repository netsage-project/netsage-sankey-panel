import React from 'react';

interface HeaderProps {
  /** One label per STAGE column, in query order (the value column has no header). */
  displayNames: string[];
  /** Graph (plot) width, used to position the right label and space the middle ones. */
  width: number;
  topMargin: number;
  leftMargin: number;
  textColor: string;
}

const FONT_SIZE = '14pt';
const FONT_WEIGHT = 500;

/**
 * Column header labels drawn above the diagram.
 *
 * Rewritten from imperative D3 (`d3.select(...).append('text')` inside a dependency-less
 * `useEffect`) to declarative JSX. The old approach re-ran on every render, appended a new
 * `<g>` each time (leaking orphan groups), and used an id containing a space. Positions,
 * font (14pt / weight 500) and anchors are preserved, so the rendered headers are identical.
 *
 * Rendered directly inside the SVG (outside the main translated group), so coordinates are in
 * absolute SVG space, matching the previous behavior.
 */
export const Headers: React.FC<HeaderProps> = ({ displayNames, width, topMargin, leftMargin, textColor }) => {
  if (!displayNames || displayNames.length === 0) {
    return null;
  }

  const translateY = topMargin / 2;
  const labels: React.ReactNode[] = [];

  // Left axis label = first column.
  labels.push(
    <text
      key="header-left"
      x={leftMargin}
      y={translateY}
      fontSize={FONT_SIZE}
      fontWeight={FONT_WEIGHT}
      textAnchor="start"
      fill={textColor}
    >
      {displayNames[0]}
    </text>
  );

  // Right axis label = last stage column. Skipped when there is only one stage, which would
  // otherwise draw the same label twice at the same y.
  if (displayNames.length > 1) {
    labels.push(
      <text
        key="header-right"
        x={width + leftMargin}
        y={translateY}
        fontSize={FONT_SIZE}
        fontWeight={FONT_WEIGHT}
        textAnchor="end"
        fill={textColor}
      >
        {displayNames[displayNames.length - 1]}
      </text>
    );
  }

  // Evenly spaced labels for any intermediate columns.
  if (displayNames.length > 2) {
    const colWidth = width / (displayNames.length - 1);
    for (let i = 1; i < displayNames.length - 1; i++) {
      const translateX = colWidth * i + leftMargin;
      labels.push(
        <text
          key={`header-mid-${i}`}
          x={translateX}
          y={translateY}
          fontSize={FONT_SIZE}
          fontWeight={FONT_WEIGHT}
          textAnchor="middle"
          fill={textColor}
        >
          {displayNames[i]}
        </text>
      );
    }
  }

  return <g className="header-text">{labels}</g>;
};
