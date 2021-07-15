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
  // values: string[];
  data: any;
  // colorDisplay: (value: number) => string;
  width: number;
  height: number;
  // numColumns: number;
  displayValues: string;
  // onHover: (value?: number) => void;
  // tooltip: boolean;
  id: any;
  textColor: string;
  nodeColor: string;
}

/**
 * The sankey graph
 */
export const Sankey: React.FC<SankeyProps> = ({ data, width, height, displayValues, id, textColor, nodeColor }) => {
  const sankey: any = d3Sankey
    .sankey()
    .nodeWidth(20)
    .nodePadding(20)
    .extent([
      [0, 0],
      [width, height],
    ]);
  Tooltip(data);

  // Return an SVG group only if data exists
  if (data) {
    // graph.current = sankey(pluginData);
    // const { links, nodes } = graph.current;
    const { links, nodes } = sankey(data);

    // renderTooltip(data, displayValues);

    return (
      <svg id={'Chart_' + id} width={width} height={height}>
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
