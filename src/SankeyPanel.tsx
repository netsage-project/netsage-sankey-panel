import React from 'react';
import { PanelProps } from '@grafana/data';
import { SankeyOptions } from './types';
import { parseData, fixColor } from './dataParser';
import { Sankey } from './components/Sankey';
import { useTheme2 } from '@grafana/ui';

interface Props extends PanelProps<SankeyOptions> {}

/**
 * Grafana Sankey diagram panel entry component.
 *
 * Parses the query data into d3-sankey nodes/links and renders the <Sankey> graph.
 */
export const SankeyPanel: React.FC<Props> = ({ options, data, width, height, id }) => {
  const theme = useTheme2();

  // Parse the query data. On failure we leave `parsed` undefined so that the render below
  // falls back to an empty diagram instead of crashing (the previous try/catch swallowed the
  // parse error but then still dereferenced the missing result on the next line).
  let parsed;
  try {
    parsed = parseData(
      data,
      options,
      options.monochrome,
      options.color,
      options.linkMode,
      options.palette,
      options.colorByValueMappings,
      theme
    );
  } catch (error) {
    console.error('parsing error: ', error);
  }

  // Node fill color is resolved once here; link colors are already baked into the parsed data.
  const nodeColor = fixColor(options.nodeColor);
  // Text color follows the active Grafana theme (replaces the removed `textColor` option).
  const textColor = theme.colors.text.primary;

  return (
    <Sankey
      data={parsed?.pluginData}
      displayNames={parsed?.displayNames}
      rowDisplayNames={parsed?.rowDisplayNames}
      width={width}
      height={height}
      id={id}
      textColor={textColor}
      nodeColor={nodeColor}
      field={parsed?.valueField}
      nodeWidth={options.nodeWidth}
      nodePadding={options.nodePadding}
      labelSize={options.labelSize}
      iteration={options.iteration}
      nodeOrder={options.nodeOrder}
    />
  );
};
