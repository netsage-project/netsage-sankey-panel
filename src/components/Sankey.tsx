import React, { useMemo, useState } from 'react';
import { Link } from './Link';
import { Node } from './Node';
import * as d3Sankey from 'd3-sankey';
import { Tooltip, HoverState } from './Tooltip';
import { Headers } from './Headers';
import { formatDisplay } from '../dataParser';

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
  nodeOrder: 'data' | 'auto';
}

// Resting / highlight opacities for links (unchanged from the original D3 implementation).
const RESTING_OPACITY = 0.7;
const ACTIVE_OPACITY = 1;
const DIM_ON_LINK_HOVER = 0.4;
const DIM_ON_NODE_HOVER = 0.2;

/**
 * The Sankey graph: runs the d3-sankey layout and renders headers, links, nodes and the
 * hover tooltip. Hover state lives here (React), replacing the previous imperative D3
 * highlighting/tooltip code that lived in the Tooltip component.
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
  nodeOrder,
}) => {
  const [hover, setHover] = useState<HoverState | null>(null);

  const MARGIN = { top: 75, bottom: 50, right: 20, left: 20 };
  const graphWidth = width - MARGIN.left - MARGIN.right;
  const graphHeight = height - MARGIN.top - MARGIN.bottom;

  // Run the layout inside useMemo for two reasons:
  //  1. d3-sankey MUTATES its input (it replaces each link's numeric source/target with node
  //     references). Because hover now re-renders this component with the same `data` object,
  //     re-running the layout on an already-mutated object would corrupt it — so we clone the
  //     data first and memoize the result, recomputing only when the inputs actually change.
  //  2. It avoids re-laying-out the diagram on every hover move.
  const layout = useMemo(() => {
    if (!data) {
      return null;
    }
    const sankeyGen: any = d3Sankey
      .sankey()
      .iterations(iteration)
      .nodeWidth(nodeWidth)
      .nodePadding(nodePadding)
      .extent([
        [0, 0],
        [graphWidth, graphHeight],
      ]);
    // nodeSort(null) fixes the vertical node order to the input (query/row) order, so sorting
    // rows via a transform controls the layout; undefined restores d3-sankey's auto ordering.
    sankeyGen.nodeSort(nodeOrder === 'data' ? null : undefined);
    const cloned = {
      nodes: data.nodes.map((n: any) => ({ ...n })),
      links: data.links.map((l: any) => ({ ...l })),
    };
    // Guard the layout: edge-list data can contain cycles, which d3-sankey rejects by throwing.
    // Catch it so a cyclic dataset renders the empty fallback instead of crashing the panel.
    try {
      return sankeyGen(cloned);
    } catch (e) {
      console.error('Sankey layout error (possibly cyclic data)', e);
      return null;
    }
  }, [data, iteration, nodeWidth, nodePadding, graphWidth, graphHeight, nodeOrder]);

  // Render an empty placeholder if there is no data to lay out.
  if (!layout) {
    return <div id={'Chart_' + id} style={{ height: height, width: width }} />;
  }

  const { links, nodes } = layout;

  const clearHover = () => setHover(null);

  const handleLinkHover = (link: any, e: React.MouseEvent) => {
    const row = rowDisplayNames?.find((r: any) => r.name === link.id);
    setHover({
      kind: 'link',
      linkId: link.id,
      x: e.clientX,
      y: e.clientY,
      content: (
        <>
          <span>{row?.display}</span>
          <br />
          <b>{link.displayValue}</b>
        </>
      ),
    });
  };

  const handleNodeHover = (node: any, e: React.MouseEvent) => {
    setHover({
      kind: 'node',
      rowIds: node.id,
      x: e.clientX,
      y: e.clientY,
      content: (
        <>
          {node.name}: <b>{formatDisplay(field, node.value)}</b>
        </>
      ),
    });
  };

  // Opacity for a given link based on what is currently hovered. Mirrors the exact numbers
  // the old D3 code applied: hovering a link highlights it (others -> 0.4); hovering a node
  // highlights every link that passes through it (others -> 0.2); nothing hovered -> 0.7.
  const linkOpacity = (link: any): number => {
    if (!hover) {
      return RESTING_OPACITY;
    }
    if (hover.kind === 'link') {
      return hover.linkId === link.id ? ACTIVE_OPACITY : DIM_ON_LINK_HOVER;
    }
    return hover.rowIds.includes(link.id) ? ACTIVE_OPACITY : DIM_ON_NODE_HOVER;
  };

  return (
    <>
      <svg id={'Chart_' + id} width={width} height={height}>
        <Headers
          displayNames={displayNames}
          width={graphWidth}
          topMargin={MARGIN.top}
          leftMargin={MARGIN.left}
          textColor={textColor}
        />
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {links.map((d: any, i: number) => (
            <Link
              key={i}
              data={d}
              opacity={linkOpacity(d)}
              onHover={(e) => handleLinkHover(d, e)}
              onLeave={clearHover}
            />
          ))}
        </g>
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {nodes.map((d: any, i: number) => (
            <Node
              key={i}
              data={d}
              textColor={textColor}
              nodeColor={nodeColor}
              labelSize={labelSize}
              graphWidth={graphWidth}
              onHover={(e) => handleNodeHover(d, e)}
              onLeave={clearHover}
            />
          ))}
        </g>
      </svg>
      <Tooltip hover={hover} />
    </>
  );
};
