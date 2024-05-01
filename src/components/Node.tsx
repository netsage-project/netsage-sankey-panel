import React from 'react';
// import { useTheme2 } from '@grafana/ui';

interface NodeProps {
  data: any;
  textColor: string;
  nodeColor: string;
  panelId: any;
  labelSize: number;
}

/**
 * Create Sankey rectangular nodes with labels
 *
 * @param data is the node data produced by calling the d3-sankey function
 * @param textColor is set in the editor panel, the color of the node label text
 * @param nodeColor is set in the editor panel, the fill color of the nodes
 * @return {*}  the node and its label
 */
export const Node: React.FC<NodeProps> = ({ data, textColor, nodeColor, panelId, labelSize }) => {
  // const theme = useTheme2();

  let x0 = data.x0;
  let x1 = data.x1;
  let y0 = data.y0;
  let y1 = data.y1;
  let index = data.index;
  let name = data.name;
  let value = data.value;

  const width = x1 - x0;
  const strokeColor = 'black';
  // const fontSize = theme.typography.fontSize;
  const fontSize = labelSize+'px';
  const className = `sankey-node${panelId}`;

  return (
    <>
      <rect
        x={x0}
        y={y0}
        rx={5}
        ry={5}
        width={width}
        height={y1 - y0}
        stroke={strokeColor}
        fill={nodeColor}
        data-index={index}
        id={panelId + ',' + data.id}
        d={value}
        name={name}
        className={className}
      />
      <text
        x={x0 < width / 2 ? x1 + 6 : x0 - 6}
        y={(y1 + y0) / 2}
        style={{
          fill: textColor,
          alignmentBaseline: 'middle',
          fontSize: fontSize,
          textAnchor: x0 < width / 2 ? 'start' : 'end',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {name}
      </text>
    </>
  );
};
