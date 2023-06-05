import React from 'react';
import { PanelProps } from '@grafana/data';
import { SankeyOptions } from 'types';
import { parseData } from 'dataParser';
import { Sankey } from './components/Sankey';
import { useTheme2 } from '@grafana/ui';

interface Props extends PanelProps<SankeyOptions> {}
/**
 * Grafana Sankey diagram panel
 *
 * @param {*} { options, data, width, height, id }
 * @return {*} { Sankey } the Sankey graph
 */
export const SankeyPanel: React.FC<Props> = ({ options, data, width, height, id }: any): any => {
  let graphOptions = {
    ...options,
  };
  const theme = useTheme2();
  /**
   * Feed data and options into data parser.
   * @param {*} { data, options }
   * @returns [ parsedData, displayNames ]
   */
  let parsedData: any[] = [];
  try {
    parsedData = parseData(data, options, graphOptions.monochrome, graphOptions.color);
  } catch (error) {
    console.error('parsing error: ', error);
  }
  const displayNames = parsedData[1];
  const pluginData = parsedData[0];
  const rowDisplayNames = parsedData[2];
  const field = parsedData[3];
  const fixColor = parsedData[4];
  // const textColor = fixColor(graphOptions.textColor);
  const textColor = theme.colors.text.primary;
  const nodeColor = fixColor(graphOptions.nodeColor);

  return (
    <g>
      <Sankey
        data={pluginData}
        displayNames={displayNames}
        rowDisplayNames={rowDisplayNames}
        width={width}
        height={height}
        id={id}
        textColor={textColor}
        nodeColor={nodeColor}
        field={field}
        nodeWidth={graphOptions.nodeWidth}
        nodePadding={graphOptions.nodePadding}
        iteration={graphOptions.iteration}
      />
    </g>
  );
};
