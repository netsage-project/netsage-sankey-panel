import React from 'react';
// import React, { useEffect } from 'react';
import { Link } from './Link';
import { Node } from './Node';
import * as d3Sankey from 'd3-sankey';

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
}

/**
 * The sankey graph
 */
export const Sankey: React.FC<SankeyProps> = ({ data, width, height, displayValues, id }) => {
  console.log(displayValues);

  const sankey: any = d3Sankey
    .sankey()
    .nodeWidth(20)
    .nodePadding(20)
    .extent([
      [0, 0],
      [width, height],
    ]);

  // Return an SVG group only if data exists
  if (data) {
    // graph.current = sankey(pluginData);
    // const { links, nodes } = graph.current;
    const { links, nodes } = sankey(data);

    return (
      <svg width={width} height={height}>
        <g>
          {links.map((d: { width: any }, i: any) => (
            <Link key={i} data={d} width={d.width} length={nodes.length} colors={null} />
          ))}
        </g>
        <g>
          {nodes.map((d: { index: any; x0: any; x1: any; y0: any; y1: any; name: any; value: any }, i: any) => (
            <Node
              data={d}
              key={i}
              index={d.index}
              x0={d.x0}
              x1={d.x1}
              y0={d.y0}
              y1={d.y1}
              name={d.name}
              values={d.value}
              length={nodes.length}
              colors={null}
            />
          ))}
        </g>
      </svg>
    );
  }
  return <div id={'Chart_' + id} style={{ height: height, width: width }}></div>;
};
