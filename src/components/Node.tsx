import React from 'react';

interface NodeProps {
  data: any;
  textColor: string;
  nodeColor: string;
  labelSize: number;
  /** Width of the plotted graph area, used to decide which side of the node the label sits on. */
  graphWidth: number;
  onHover: (e: React.MouseEvent) => void;
  onLeave: () => void;
}

/**
 * Create a Sankey rectangular node with its label.
 *
 * @param data the node datum produced by the d3-sankey layout
 * @param textColor color of the node label text (follows the Grafana theme)
 * @param nodeColor fill color of the node rectangle (set in the editor)
 */
export const Node: React.FC<NodeProps> = ({ data, textColor, nodeColor, labelSize, graphWidth, onHover, onLeave }) => {
  const { x0, x1, y0, y1, name } = data;

  const width = x1 - x0;
  const fontSize = labelSize + 'px';

  // BUG FIX: place the label based on the node's position within the whole graph. A node in
  // the left half gets its label on the right (start-anchored); a node in the right half gets
  // it on the left (end-anchored) — the canonical d3-sankey label placement. Previously this
  // compared `x0` against half the node's OWN width (~30px), so virtually every label was
  // forced to the left/inward regardless of the node's column.
  const labelOnRight = x0 < graphWidth / 2;

  // Hover highlighting + tooltip are handled in React now, so the previous data-stashing
  // attributes (`id`, `d`, `name`, `data-index`) read back by D3 have been removed.
  return (
    <>
      <rect
        x={x0}
        y={y0}
        rx={5}
        ry={5}
        width={width}
        height={y1 - y0}
        stroke="black"
        fill={nodeColor}
        style={{ cursor: 'pointer' }}
        onMouseMove={onHover}
        onMouseLeave={onLeave}
      />
      <text
        x={labelOnRight ? x1 + 6 : x0 - 6}
        y={(y1 + y0) / 2}
        style={{
          fill: textColor,
          alignmentBaseline: 'middle',
          fontSize: fontSize,
          textAnchor: labelOnRight ? 'start' : 'end',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {name}
      </text>
    </>
  );
};
