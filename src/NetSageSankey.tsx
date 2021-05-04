import React, { useEffect, useRef, useState } from 'react';
import { PanelProps } from '@grafana/data';
import { NetSageSankeyOptions } from 'types';
import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';

interface Props extends PanelProps<NetSageSankeyOptions> {}

export const NetSageSankey: React.FC<Props> = ({ options, data, width, height }) => {
  const getMousePosition = (event: { target: { getScreenCTM: () => any }; clientX: number; clientY: number }) => {
    const CTM = event.target.getScreenCTM();

    return {
      x: (event.clientX - CTM.e) / CTM.a,
      y: (event.clientY - CTM.f) / CTM.d,
    };
  };

  const Rect = ({ index, x0, x1, y0, y1, name, value, length, colors }: any) => {
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

  const Link = ({ data, width, length, colors }: any) => {
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

  const Sankey = () => {
    const [jsonData, setData] = useState(null);

    useEffect(() => {
      fetch('https://raw.githubusercontent.com/ozlongblack/d3/master/energy.json')
        .then(res => res.json())
        .then(data => setData(data));
    }, []);

    const dragElement: any = useRef(null);
    const graph: any = useRef(null);
    const offset: any = useRef(null);

    const colors = options.showWarmColors ? d3.interpolateWarm : d3.interpolateCool;
    const sankey: any = d3Sankey
      .sankey()
      .nodeAlign(d3Sankey.sankeyJustify)
      .nodeWidth(10)
      .nodePadding(10)
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

    if (jsonData) {
      graph.current = sankey(jsonData);
      const { links, nodes } = graph.current;

      return (
        <svg width={width} height={height}>
          <g>
            {links.map((d: { width: any }, i: any) => (
              <Link data={d} width={d.width} length={nodes.length} colors={colors} />
            ))}
          </g>
          <g>
            {nodes.map((d: { index: any; x0: any; x1: any; y0: any; y1: any; name: any; value: any }, i: any) => (
              <Rect
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

    return <div>Loading</div>;
  };

  return Sankey();
};
