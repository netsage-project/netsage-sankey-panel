// import * as d3 from 'd3';
import React from 'react';
import * as d3Sankey from 'd3-sankey';

interface LinkProps {
  data: any;
}

/**
 * Create Sankey links
 *
 * @param data is the link data produced by calling the d3-sankey function
 * @return {*}  the sankey link
 */
export const Link: React.FC<LinkProps> = ({ data }) => {
  const link: any = d3Sankey.sankeyLinkHorizontal();
  // const strokeColor = '#4ec1e0';
  const strokeColor = data.color;

  return (
    <>
      <path
        d={link(data)}
        fill={'none'}
        stroke={strokeColor}
        strokeOpacity={0.7}
        strokeWidth={data.width}
        id={data.id}
        display={data.displayValue}
      />
    </>
  );
};
