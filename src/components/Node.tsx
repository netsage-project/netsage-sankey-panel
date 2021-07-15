import React from 'react';
import { Tooltip } from './Tooltip';
// import * as d3 from 'd3';
// import * as d3Sankey from 'd3-sankey';

interface NodeProps {
  data: any;
  length: number;
  textColor: string;
  nodeColor: string;
  displayValues: any;
}

/**
 * Create Sankey rectangular nodes with text
 *
 * @param {*} { index, x0, x1, y0, y1, name, length, colors }
 * @return {*}  {*}
 */
export const Node: React.FC<NodeProps> = ({ data, length, textColor, nodeColor, displayValues }) => {
  let x0 = data.x0;
  let x1 = data.x1;
  let y0 = data.y0;
  let y1 = data.y1;
  let index = data.index;
  let name = data.name;

  const width = x1 - x0;
  // const fillColor = '#828282';
  const strokeColor = 'black';

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
        id={data.id}
      />
      <text
        x={x0 < width / 2 ? x1 + 6 : x0 - 6}
        y={(y1 + y0) / 2}
        style={{
          fill: textColor,
          alignmentBaseline: 'middle',
          fontSize: 16,
          textAnchor: x0 < width / 2 ? 'start' : 'end',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {name}
      </text>
      <Tooltip data={data} displayValues={displayValues} />
    </>
  );
};
