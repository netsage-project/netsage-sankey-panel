// import React from 'react';
import React from 'react';
// import React, { useEffect, useState } from 'react';
import { Link } from './Link';
import { Node } from './Node';
import * as d3Sankey from 'd3-sankey';
// import * as d3 from 'd3';
// import MousePosition from './MousePos';
// import renderTooltip from './Tooltip-d3';
import { Tooltip } from './Tooltip';

// import '../css/styles.css';

interface SankeyProps {
  data: any;
  width: number;
  height: number;
  displayValues: string;
  rowDisplayNames: any;
  id: any;
  textColor: string;
  nodeColor: string;
  field: any;
}

/**
 * The sankey graph
 */
export const Sankey: React.FC<SankeyProps> = ({
  data,
  width,
  height,
  displayValues,
  rowDisplayNames,
  id,
  textColor,
  nodeColor,
  field,
}) => {
  const sankey: any = d3Sankey
    .sankey()
    .iterations(7)
    .nodeWidth(20)
    .nodePadding(30)
    .extent([
      [0, 0],
      [width, height],
    ]);

  // Return an SVG group only if data exists
  if (data) {
    const nodeData = data.nodes;
    // const tooltipData = { data: data, displayValues: displayValues, rowNames: rowDisplayNames };
    // Tooltip(tooltipData);
    // <Tooltip data={nodeData} displayValues={displayValues} rowNames={rowDisplayNames} />;
    const { links, nodes } = sankey(data);
    return (
      <svg id={'Chart_' + id} width={width} height={height}>
        <Tooltip data={nodeData} displayValues={displayValues} rowNames={rowDisplayNames} field={field} />
        <g>
          {links.map((d: { width: any }, i: any) => (
            <Link key={i} data={d} width={d.width} length={nodes.length} />
          ))}
        </g>
        <g>
          {nodes.map((d: { index: any; x0: any; x1: any; y0: any; y1: any; name: any; value: any }, i: any) => (
            <Node
              data={d}
              key={i}
              length={nodes.length}
              textColor={textColor}
              nodeColor={nodeColor}
              displayValues={displayValues}
            />
          ))}
        </g>
      </svg>
    );
  }
  return <div id={'Chart_' + id} style={{ height: height, width: width }}></div>;
};
