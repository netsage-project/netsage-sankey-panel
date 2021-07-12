// import * as d3 from 'd3';
import React from 'react';
import * as d3Sankey from 'd3-sankey';

interface LinkProps {
  data: any;
  width: number;
  length: number;
  // colors: any;
}

export const Link: React.FC<LinkProps> = ({ data, width, length }) => {
  const link: any = d3Sankey.sankeyLinkHorizontal();
  // const strokeColor = '#4ec1e0';
  const strokeColor = data.color;

  return (
    <>
      <path
        d={link(data)}
        fill={'none'}
        stroke={strokeColor}
        strokeOpacity={0.5}
        strokeWidth={width}
        id={data.id}
        display={data.displayValue}
      />
    </>
  );
};
