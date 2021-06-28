import React, { useEffect, useRef } from 'react';
import { DataFrameView, PanelProps } from '@grafana/data';
import { SankeyOptions } from 'types';
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
   * Return mouse coordinates on mouse events
   *
   * @param {{ target: { getScreenCTM: () => any }; clientX: number; clientY: number }} event
   * @return {*}
   */
  const getMousePosition = (event: { target: { getScreenCTM: () => any }; clientX: number; clientY: number }): any => {
    const CTM = event.target.getScreenCTM();

    return {
      x: (event.clientX - CTM.e) / CTM.a,
      y: (event.clientY - CTM.f) / CTM.d,
    };
  };

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
   * @return {*}
   */
  const Sankey = (): any => {
    let pluginDataLinks: Array<{ source: number; target: number; value: number }> = [];
    let pluginDataNodes: Array<{ name: any }> = [];

    const frame = data.series[0];
    const view = new DataFrameView(frame);

    // Retrieve panel data from panel
    // TODO: Switch out hard coded field names in lieu of plugin options or indices
    view.forEach((row) => {
      const src = row['meta.src_preferred_org'];
      const link = row['meta.scireg.src.discipline'];
      const dest = row['meta.dst_preferred_org'];
      const sum = row.Sum / 1000000000000; // Convert to TeraBytes

      let sIndex = pluginDataNodes.findIndex((e) => e.name === `${src} (src)`);
      let lIndex = pluginDataNodes.findIndex((e) => e.name === `${link} (src)`);
      let dIndex = pluginDataNodes.findIndex((e) => e.name === `${dest} (dst)`);

      if (sIndex === -1) {
        sIndex = pluginDataNodes.push({ name: `${src} (src)` }) - 1;
      }
      if (lIndex === -1) {
        lIndex = pluginDataNodes.push({ name: `${link} (src)` }) - 1;
      }
      if (dIndex === -1) {
        dIndex = pluginDataNodes.push({ name: `${dest} (dst)` }) - 1;
      }

      pluginDataLinks.push({ source: sIndex, target: lIndex, value: sum });
      pluginDataLinks.push({ source: lIndex, target: dIndex, value: sum });
    });
    const pluginData = { links: pluginDataLinks, nodes: pluginDataNodes };

    const dragElement: any = useRef(null);
    const graph: any = useRef(null);
    const offset: any = useRef(null);

    // Color scheme set by toggle switch in plugin UI
    const colors = options.colorTheme === 'cool' ? d3.interpolateCool : d3.interpolateWarm;
    const sankey: any = d3Sankey
      .sankey()
      .nodeAlign(d3Sankey.sankeyJustify)
      .nodeWidth(10)
      .nodePadding(20)
      .extent([
        [0, 0],
        [width, height],
      ]);

    const onMouseUp = (e: any) => {
      dragElement.current = null;
    };

    const onMouseDown = (e: any) => {
      if (e.target.tagName === 'rect') {
        dragElement.current = e.target;
        offset.current = getMousePosition(e);
        offset.current.y -= parseFloat(e.target.getAttributeNS(null, 'y'));
      }
    };

    const onMouseMove = (e: any) => {
      if (dragElement.current) {
        const coOrd = getMousePosition(e);
        dragElement.current.setAttributeNS(null, 'y', coOrd.y - offset.current.y);
      }
    };

    useEffect(() => {
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);

      return () => {
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
      };
    }, []);

    // Return an SVG group only if data exists
    if (pluginData) {
      graph.current = sankey(pluginData);
      const { links, nodes } = graph.current;

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
