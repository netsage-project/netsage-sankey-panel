import React from 'react';
// import * as d3 from 'd3';
// import * as d3Sankey from 'd3-sankey';

interface NodeProps {
  values: number;
  data: any;
  index: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  name: string;
  length: number;
  colors: any;
}

/**
 * Create Sankey rectangular nodes with text
 *
 * @param {*} { index, x0, x1, y0, y1, name, length, colors }
 * @return {*}  {*}
 */
export const Node: React.FC<NodeProps> = ({ values, data, index, x0, x1, y0, y1, name, length, colors }) => {
  const width = x1 - x0;
  const fillColor = '#828282';
  return (
    <>
      <rect x={x0} y={y0} width={width} height={y1 - y0} fill={fillColor} data-index={index} id={data.id} />
      <text
        x={x0 < width / 2 ? x1 + 6 : x0 - 6}
        y={(y1 + y0) / 2}
        style={{
          fill: fillColor,
          alignmentBaseline: 'middle',
          fontSize: 16,
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
