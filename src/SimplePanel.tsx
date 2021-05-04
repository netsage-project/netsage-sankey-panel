import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { useTheme } from '@grafana/ui';
import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';

interface Props extends PanelProps<SimpleOptions> {}

export const SimplePanel: React.FC<Props> = ({ options, data, width, height }) => {
  const theme = useTheme();
  const values = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

  const scale = d3
    .scaleLinear()
    .domain([0, d3.max(values) || 0.0])
    .range([0, width]);

  const axis = d3.axisBottom(scale);

  const padding = 20;
  const chartHeight = height - padding;
  const barHeight = chartHeight / values.length;
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };

  // <svg width={width} height={height}>
  //   <g transform={`translate(${margin.left},${margin.top})`} />
  // </svg>;

  const svg: any = d3
    .create('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const mySankey = d3Sankey
    .sankey()
    .nodeWidth(50)
    .nodePadding(110)
    .nodeAlign(d3Sankey.sankeyLeft)
    .extent([
      [margin.left, margin.top],
      [width - margin.left, height - margin.top],
    ]);

  const graph = {
    nodes: d3.range(7).map(Object),
    links: [
      { source: 0, target: 2, value: 2 },
      { source: 2, target: 4, value: 2 },
      { source: 1, target: 2, value: 1 },
      { source: 3, target: 2, value: 1 },
      { source: 2, target: 5, value: 2 },
      { source: 5, target: 6, value: 2 },
    ],
  };
  const colorScale = d3.scaleOrdinal(d3.schemeDark2);
  colorScale.domain(graph.nodes);
  mySankey(graph);

  svg
    .append('g')
    .attr('fill', 'none')
    .attr('class', 'links')
    .attr('stroke-opacity', 0.5)
    .selectAll('path')
    .data(graph.links)
    .enter()
    .append('path')
    .attr('d', d3Sankey.sankeyLinkHorizontal())
    .attr('stroke-width', (d: { width: number }) => Math.max(1, d.width))
    .style('stroke', (d: { target: string }) => colorScale(d.target));

  svg
    .append('g')
    .attr('class', 'nodes')
    .selectAll('rect')
    .data(graph.nodes)
    .enter()
    .append('rect')
    .attr('width', (d: { x1: number; x0: number }) => d.x1 - d.x0)
    .attr('height', (d: { y1: number; y0: number }) => d.y1 - d.y0)
    .attr('x', (d: { x0: any }) => d.x0)
    .attr('y', (d: { y0: any }) => d.y0)
    .style('fill', (d: { index: string }) => colorScale(d.index));

  svg
    .append('g')
    .attr('class', 'texts')
    .selectAll('text')
    .data(graph.nodes)
    .enter()
    .append('text')
    .attr('x', (d: { x0: number; x1: number }) => d.x0 + (d.x1 - d.x0) / 2)
    .attr('y', (d: { y0: number; y1: number }) => d.y0 + (d.y1 - d.y0) / 2)
    .attr('dy', 4)
    .text((d: { index: any }) => d.index);

  // return svg
  // return (
  //   <svg width={width} height={height}>
  //     <g
  //       transform={`translate(${margin.left},${margin.top})`}
  //     />
  //     <g
  //       fill={"none"}
  //       className={"links"}
  //       strokeOpacity={"0.5"}

  //     />
  //   </svg>
  // );

  return (
    <svg width={width} height={height}>
      <g>
        {values.map((value, i) => (
          <rect x={0} y={i * barHeight} width={scale(value)} height={barHeight - 1} fill={theme.palette.queryPurple} />
        ))}
      </g>

      <g
        transform={`translate(0, ${chartHeight})`}
        ref={node => {
          d3.select(node).call(axis as any);
        }}
      />
    </svg>
  );
};
