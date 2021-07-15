import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';

interface TooltipProps {
  data: any;
}

export const Tooltip: React.FC<TooltipProps> = ({ data }) => {
  /*
   * @param data: data for an individual node/link
   * @param displayValues:
   * @param id: the row id to highlight
   * @param type: node or link
   */
  // renderTooltip() {
  const [mousePosition, setMousePosition] = useState({ mouseX: 100, mouseY: 100 });

  const updateMousePosition = (e: any) => {
    setMousePosition({ mouseX: e.clientX, mouseY: e.clientY });
  };

  useEffect(() => {
    d3.selectAll('path')
      .on('mouseover', function (event: any, d: any) {
        window.addEventListener('mousemove', updateMousePosition);

        // paths: selected opacity -> 1, all else -> 0.2
        let id = d3.select(this).attr('id');
        d3.selectAll('path').each(function (d) {
          var thisId = d3.select(this).attr('id');
          var dark = id === thisId;
          d3.select(this).attr('opacity', dark ? 1 : 0.4);
        });
        var thisId = d3.select(this).attr('id');
        var div = d3
          .select('body')
          .append('div')
          .attr('class', `tooltip-${thisId}`)
          .html(() => {
            var textVal = d3.select(this).attr('display');
            var title = d;
            // var text = `${x}: <b>${y}</b>`;
            var text = `${title}: <b>${textVal}</b>`;
            return text;
          })
          .style('padding', '10px 15px')
          .style('background', 'white')
          .style('border', '#A8A8A8 solid 5px')
          .style('border-radius', '5px')
          .style('left', mousePosition.mouseX + 'px')
          .style('top', mousePosition.mouseY + 'px')
          .style('opacity', 0)
          .style('position', 'absolute');
        div.transition().duration(200).style('opacity', 0.9);
      })
      .on('mouseout', function (d) {
        var thisId = d3.select(this).attr('id');
        d3.selectAll(`.tooltip-${thisId}`).transition().duration(300).remove();
        // div.transition().duration(100).remove();
        // div.transition().duration(500).style('opacity', 0);
        d3.selectAll('path').attr('opacity', 0.9);
      });
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  });
  return null;
};
