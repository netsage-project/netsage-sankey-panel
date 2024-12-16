import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';

interface TooltipProps {
  rowNames: any;
  field: any;
  panelId: any;
}

export const Tooltip: React.FC<TooltipProps> = ({ rowNames, field, panelId }) => {
  // get mouse position for tooltip position
  const [mousePosition, setMousePosition] = useState({ mouseX: 100, mouseY: 100 });

  const updateMousePosition = (e: any) => {
    setMousePosition({
      mouseX: e.clientX + window.scrollX,
      mouseY: e.clientY + window.scrollY,
    });
  };
  useEffect(() => {
    window.addEventListener('mousemove', updateMousePosition);
    const pathClass = `.sankey-path${panelId}`;
    // Links Tooltip
    d3.selectAll(pathClass)
      .on('mouseover', function (event: any, d: any) {
        let id = d3.select(this).attr('id');
        let row = id.split('-');
        let name = rowNames.find((e: any) => e.name === row[1]).display;

        // paths: selected opacity -> 1, all else -> 0.2
        d3.selectAll(pathClass).each(function (d) {
          let thisId = d3.select(this).attr('id');
          let dark = id === thisId;
          d3.select(this).attr('opacity', dark ? 1 : 0.4);
        });
        let thisId = d3.select(this).attr('id');
        let div = d3
          .select('body')
          .append('div')
          .attr('class', `tooltip-${thisId}`)
          .html(() => {
            let textVal = d3.select(this).attr('display');
            let text = `${name} <br> <b>${textVal}</b>`;
            return text;
          })
          .style('padding', '10px 15px')
          .style('background', '#19191A')
          .style('color', 'white')
          .style('border', '#A8A8A8 solid 2px')
          .style('border-radius', '5px')
          .style('left', mousePosition.mouseX + 'px')
          .style('top', mousePosition.mouseY + 'px')
          .style('opacity', 0)
          .style('z-index','1')
          .style('position', 'absolute');
        div.transition().duration(200).style('opacity', 0.8);
      })
      .on('mouseout', function (d) {
        let thisId = d3.select(this).attr('id');
        d3.selectAll(`.tooltip-${thisId}`).transition().duration(300).remove();
        d3.selectAll(pathClass).attr('opacity', 0.7);
      });

    // Nodes Tooltip
    const nodeClass = `.sankey-node${panelId}`;
    d3.selectAll(nodeClass)
      .on('mouseover', function (event: any, d: any) {
        let id = d3.select(this).attr('id').split(',');
        let panelId = id[0];
        let rowList: string[] = [];
        id.forEach((e) => {
          rowList.push(`${panelId}-${e}`);
        });
        d3.selectAll(pathClass).each(function (d) {
          let thisId = d3.select(this).attr('id');
          let found = rowList.find((e) => e === thisId);
          d3.select(this).attr('opacity', found ? 1 : 0.2);
        });

        let thisNode = d3.select(this).attr('data-index');
        let div = d3
          .select('body')
          .append('div')
          .attr('class', `tooltip-node${thisNode}`)
          .html(() => {
            let textVal = field.display(d3.select(this).attr('d'));
            let name = d3.select(this).attr('name');
            let text;
            if (textVal.suffix) {
              text = `${name}: <b>${textVal.text} ${textVal.suffix}</b>`;
            } else {
              text = `${name}: <b>${textVal.text}</b>`;
            }
            return text;
          })
          .style('padding', '10px 15px')
          .style('background', '#19191A')
          .style('color', 'white')
          .style('border', '#A8A8A8 solid 2px')
          .style('border-radius', '5px')
          .style('left', mousePosition.mouseX + 'px')
          .style('top', mousePosition.mouseY + 'px')
          .style('opacity', 0)
          .style('z-index', '1')
          .style('position', 'absolute');
        div.transition().duration(200).style('opacity', 0.8);
      })
      .on('mouseout', function (d) {
        let thisNode = d3.select(this).attr('data-index');
        d3.selectAll(`.tooltip-node${thisNode}`).transition().duration(300).remove();
        d3.selectAll(pathClass).attr('opacity', 0.7);
      });

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  });
  return null;
};
