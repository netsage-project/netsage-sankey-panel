import React from 'react';
// import React, { useRef } from 'react';
import { PanelProps } from '@grafana/data';
import { SankeyOptions } from 'types';
import { parseData } from 'dataParser';
import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';

interface Props extends PanelProps<SankeyOptions> {}
/**
 * Grafana Sankey diagram panel
 *
 * @param {*} { options, data, width, height }
 * @return {*} { React.FC<Props> }
 */
export const SankeyPanel: React.FC<Props> = ({ options, data, width, height }: any): any => {
  /**
   * Feed data and options into data parser.
   * @param {*} { data, options }
   * @returns [ parsedData, displayNames ]
   */
  var parsedData: any[] = [];
  try {
    parsedData = parseData(data, options);
  } catch (error) {
    console.error('parsing error: ', error);
  }

  const pluginData = parsedData[0];
  // const displayNames = parsedData[1];
  /**
   * Create Sankey rectangular nodes with text
   *
   * @param {*} { index, x0, x1, y0, y1, name, length, colors }
   * @return {*}  {*}
   */
  const Rect = ({ index, x0, x1, y0, y1, name, length, colors }: any): any => {
    return (
      <>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={colors(index / length)} data-index={index} />
        <text
          x={x0 < width / 2 ? x1 + 6 : x0 - 6}
          y={(y1 + y0) / 2}
          style={{
            fill: d3
              .rgb(colors(index / length))
              .darker()
              .toString(),
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

  /**
   * Create Sankey links between nodes
   *
   * @param {*} { data, width, length, colors }
   * @return {*}
   */
  const Link = ({ data, width, length, colors }: any): any => {
    const link: any = d3Sankey.sankeyLinkHorizontal();

    return (
      <>
        <defs>
          <linearGradient
            id={`gradient-${data.index}`}
            gradientUnits="userSpaceOnUse"
            x1={data.source.x1}
            x2={data.target.x0}
          >
            <stop offset="0" stopColor={colors(data.source.index / length)} />
            <stop offset="100%" stopColor={colors(data.target.index / length)} />
          </linearGradient>
        </defs>
        <path
          d={link(data)}
          fill={'none'}
          stroke={`url(#gradient-${data.index})`}
          strokeOpacity={0.5}
          strokeWidth={width}
        />
      </>
    );
  };

  /**
   * Main Sankey generator
   *
   */
  const Sankey = (): any => {
    // const dragElement: any = useRef(null);
    // const graph: any = useRef(null);
    // const offset: any = useRef(null);

    // Color scheme set by toggle switch in plugin UI
    const colors = options.colorTheme === 'cool' ? d3.interpolateCool : d3.interpolateWarm;
    const sankey: any = d3Sankey
      .sankey()
      .nodeAlign(d3Sankey.sankeyJustify)
      .nodeWidth(20)
      .nodePadding(20)
      .extent([
        [0, 0],
        [width, height],
      ]);

    // Return an SVG group only if data exists
    if (pluginData) {
      // graph.current = sankey(pluginData);
      // const { links, nodes } = graph.current;
      const { links, nodes } = sankey(pluginData);

      return (
        <svg width={width} height={height}>
          <g>
            {links.map((d: { width: any }, i: any) => (
              <Link key={i} data={d} width={d.width} length={nodes.length} colors={colors} />
            ))}
          </g>
          <g>
            {nodes.map((d: { index: any; x0: any; x1: any; y0: any; y1: any; name: any; value: any }, i: any) => (
              <Rect
                key={i}
                index={d.index}
                x0={d.x0}
                x1={d.x1}
                y0={d.y0}
                y1={d.y1}
                name={d.name}
                value={d.value}
                length={nodes.length}
                colors={colors}
              />
            ))}
          </g>
        </svg>
      );
    }

    return <svg width={width} height={height}></svg>;
  };

  return Sankey();

};
