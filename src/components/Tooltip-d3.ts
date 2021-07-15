// import React from 'react';
import * as d3 from 'd3';

export default class Tooltip {
  /*
   * @param data: data for an individual node/link
   * @param displayValues:
   * @param id: the row id to highlight
   * @param type: node or link
   */
  renderTooltip(data: any, displayValues: any, id: any, type: string) {
    if (type === 'link') {
      d3.selectAll('path').each(function (d) {
        var thisClass = d3.select(this).attr('rowId');
        var dark = id === thisClass;

        d3.select(this)
          .attr('opacity', dark ? 1 : 0.2)
          .attr('fill-opacity', dark ? 0.9 : 0.2);
      });
    }
  }
}
