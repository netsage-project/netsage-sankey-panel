import React from 'react';
// import React, { useRef } from 'react';
import { PanelProps } from '@grafana/data';
import { SankeyOptions } from 'types';
import { parseData } from 'dataParser';
import { Sankey } from './components/Sankey';
// import * as d3 from 'd3';
// import * as d3Sankey from 'd3-sankey';

interface Props extends PanelProps<SankeyOptions> {}
/**
 * Grafana Sankey diagram panel
 *
 * @param {*} { options, data, width, height }
 * @return {*} { React.FC<Props> }
 */
export const SankeyPanel: React.FC<Props> = ({ options, data, width, height, id }: any): any => {
  let graphOptions = {
    ...options,
  };
  /**
   * Feed data and options into data parser.
   * @param {*} { data, options }
   * @returns [ parsedData, displayNames ]
   */
  var parsedData: any[] = [];
  try {
    parsedData = parseData(data, options, graphOptions.monochrome, graphOptions.color);
  } catch (error) {
    console.error('parsing error: ', error);
  }
  const displayNames = parsedData[1];
  const pluginData = parsedData[0];
  const rowDisplayNames = parsedData[2];
  const field = parsedData[3];

  return (
    <g>
      <Sankey
        data={pluginData}
        displayValues={displayNames}
        rowDisplayNames={rowDisplayNames}
        width={width}
        height={height}
        id={id}
        textColor={graphOptions.textColor}
        nodeColor={graphOptions.nodeColor}
        field={field}
      />
    </g>
  );
};
