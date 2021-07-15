import * as d3 from 'd3';
import React, { useEffect } from 'react';
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

  useEffect(() => {
    var div = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);

    d3.selectAll('path')
      .on('mouseover', function (d, event) {
        // d3.selectAll('path').attr('opacity', 0.2);
        // d3.select(this).attr('opacity', 1);

        // paths: selected opacity -> 1, all else -> 0.2
        let id = d3.select(this).attr('id');
        d3.selectAll('path').each(function (d) {
          var thisId = d3.select(this).attr('id');
          var dark = id === thisId;

          d3.select(this).attr('opacity', dark ? 1 : 0.2);
        });

        div.transition().duration(200).style('opacity', 0.9);
        div
          .html(() => {
            var text = d3.select(this).attr('display');
            return text;
          })
          .style('left', '200px')
          .style('top', '300px');
        // .style('left', event.pageX + 'px')
        // .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function (d) {
        div.transition().duration(500).style('opacity', 0);
        d3.selectAll('path').attr('opacity', 0.7);
      });
  });

  return (
    <>
      <path
        d={link(data)}
        fill={'none'}
        stroke={strokeColor}
        strokeOpacity={0.7}
        strokeWidth={width}
        id={data.id}
        display={data.displayValue}
      />
    </>
  );
};
