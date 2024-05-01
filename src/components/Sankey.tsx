import React from 'react';
import { Link } from './Link';
import { Node } from './Node';
import * as d3Sankey from 'd3-sankey';
import { Tooltip } from './Tooltip';
import { Headers } from './Headers';
// import { GrafanaTheme2 } from '@grafana/data';
// import { useTheme2 } from '@grafana/ui';
// import { css } from '@emotion/css';

// import '../css/styles.css';

interface SankeyProps {
  data: any;
  width: number;
  height: number;
  displayNames: any;
  rowDisplayNames: any;
  id: any;
  textColor: string;
  nodeColor: string;
  field: any;
  nodeWidth: number;
  nodePadding: number;
  labelSize: number;
  iteration: number;
}

/**
 * The sankey graph
 */
export const Sankey: React.FC<SankeyProps> = ({
  data,
  width,
  height,
  displayNames,
  rowDisplayNames,
  id,
  textColor,
  nodeColor,
  field,
  nodeWidth,
  nodePadding,
  labelSize,
  iteration,
}) => {
  // const theme = useTheme2();

  const MARGIN = { top: 75, bottom: 50, right: 20, left: 20 };
  const graphWidth = width - MARGIN.left - MARGIN.right;
  const graphHeight = height - MARGIN.top - MARGIN.bottom;
  const sankey: any = d3Sankey
    .sankey()
    .iterations(iteration)
    .nodeWidth(nodeWidth)
    .nodePadding(nodePadding)
    .extent([
      [0, 0],
      [graphWidth, graphHeight],
    ]);

  // Return an SVG group only if data exists
  if (data) {
    const { links, nodes } = sankey(data);

    return (
      <svg id={'Chart_' + id} width={width} height={height}>
        <Headers
          displayNames={displayNames}
          width={graphWidth}
          id={'Chart_' + id}
          topMargin={MARGIN.top}
          textColor={textColor}
        />
        <Tooltip rowNames={rowDisplayNames} field={field} panelId={id} />
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {links.map((d: { width: any }, i: any) => (
            <Link key={i} data={d} panelId={id} />
          ))}
        </g>
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {nodes.map((d: { index: any; x0: any; x1: any; y0: any; y1: any; name: any; value: any }, i: any) => (
            <Node data={d} key={i} textColor={textColor} nodeColor={nodeColor} panelId={id} labelSize={labelSize} />
          ))}
        </g>
      </svg>
    );
  }
  return <div id={'Chart_' + id} style={{ height: height, width: width }}></div>;
};
