import React, { useEffect } from 'react';
import * as d3 from 'd3';

interface HeaderProps {
  displayNames: any;
  width: any;
  id: any;
  topMargin: number;
}

export const Headers: React.FC<HeaderProps> = ({ displayNames, width, id, topMargin }) => {
  useEffect(() => {
    //clear old headers
    d3.select('#' + id)
      .selectAll('.header-text')
      .remove();

    var head = d3
      .select('#' + id)
      .append('g')
      .attr('id', `${id} header`);
    var margin = { top: topMargin, right: 20, bottom: 50, left: 20 };

    var translateY = margin.top / 2;

    // Add left and right axis labels
    head
      .append('text')
      .attr('class', 'header-text')
      .attr('transform', 'translate(' + margin.left + ',' + translateY + ')') // above left axis
      .attr('font-size', '14pt')
      .attr('font-weight', '500')
      .attr('text-anchor', 'start')
      .text(displayNames[0]);
    // .attr('fill', headerColor);

    head
      .append('text')
      .attr('class', 'header-text')
      .attr('transform', 'translate(' + width + ',' + translateY + ')') // above right axis
      .attr('font-size', '14pt')
      .attr('font-weight', '500')
      .attr('text-anchor', 'end')
      .text(displayNames[displayNames.length - 2]); // last one is value label
    // .attr('fill', headerColor);

    if (displayNames.length > 3) {
      const colWidth = width / (displayNames.length - 2);
      for (let i = 1; i < displayNames.length - 2; i++) {
        let translateX = colWidth * i;
        head
          .append('text')
          .attr('class', 'header-text')
          .attr('transform', `translate(${translateX},${translateY})`)
          .attr('font-size', '14pt')
          .attr('font-weight', '500')
          .attr('text-anchor', 'middle')
          .text(displayNames[i]);
      }
    }
  });

  return null;
};
