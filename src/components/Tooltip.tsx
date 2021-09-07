import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';

interface TooltipProps {
  rowNames: any;
  field: any;
}

export const Tooltip: React.FC<TooltipProps> = ({ rowNames, field }) => {
  // get mouse position for tooltip position
  const [mousePosition, setMousePosition] = useState({ mouseX: 100, mouseY: 100 });

  const updateMousePosition = (e: any) => {
    setMousePosition({ mouseX: e.clientX, mouseY: e.clientY });
  };

  useEffect(() => {
    window.addEventListener('mousemove', updateMousePosition);

    // Links Tooltip
    d3.selectAll('path')
      .on('mouseover', function (event: any, d: any) {
        let id = d3.select(this).attr('id');
        let row = id.split('-');
        let name = rowNames.find((e: any) => e.name === row[1]).display;

        // paths: selected opacity -> 1, all else -> 0.2
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
            var text = `${name} <br> <b>${textVal}</b>`;
            return text;
          })
          .style('padding', '10px 15px')
          .style('background', 'black')
          .style('color', 'white')
          .style('border', '#A8A8A8 solid 5px')
          .style('border-radius', '5px')
          .style('left', mousePosition.mouseX + 'px')
          .style('top', mousePosition.mouseY + 'px')
          .style('opacity', 0)
          .style('position', 'absolute');
        div.transition().duration(200).style('opacity', 0.8);
      })
      .on('mouseout', function (d) {
        var thisId = d3.select(this).attr('id');
        d3.selectAll(`.tooltip-${thisId}`).transition().duration(300).remove();
        d3.selectAll('path').attr('opacity', 0.7);
      });

    // Nodes Tooltip
    d3.selectAll('rect')
      .on('mouseover', function (event: any, d: any) {
        let id = d3.select(this).attr('id').split(',');
        let panelId = id[0];
        let rowList: string[] = [];
        id.forEach((e) => {
          rowList.push(`${panelId}-${e}`);
        });
        d3.selectAll('path').each(function (d) {
          var thisId = d3.select(this).attr('id');
          var found = rowList.find((e) => e === thisId);
          d3.select(this).attr('opacity', found ? 1 : 0.2);
        });

        var thisNode = d3.select(this).attr('data-index');
        var div = d3
          .select('body')
          .append('div')
          .attr('class', `tooltip-node${thisNode}`)
          .html(() => {
            var textVal = field.display(d3.select(this).attr('d'));
            var name = d3.select(this).attr('name');
            var text = `${name}: <b>${textVal.text} ${textVal.suffix}</b>`;
            return text;
          })
          .style('padding', '10px 15px')
          .style('background', 'black')
          .style('color', 'white')
          .style('border', '#A8A8A8 solid 5px')
          .style('border-radius', '5px')
          .style('left', mousePosition.mouseX + 'px')
          .style('top', mousePosition.mouseY + 'px')
          .style('opacity', 0)
          .style('position', 'absolute');
        div.transition().duration(200).style('opacity', 0.8);
      })
      .on('mouseout', function (d) {
        var thisNode = d3.select(this).attr('data-index');
        d3.selectAll(`.tooltip-node${thisNode}`).transition().duration(300).remove();
        d3.selectAll('path').attr('opacity', 0.7);
      });

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  });
  return null;
};
