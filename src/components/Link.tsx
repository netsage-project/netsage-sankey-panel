import React from 'react';
import * as d3Sankey from 'd3-sankey';
import { DataLinksContextMenu } from '@grafana/ui';

interface LinkProps {
  data: any;
  /** Current opacity, computed by <Sankey> from hover state (0.7 resting, 1 active, 0.2/0.4 dimmed). */
  opacity: number;
  onHover: (e: React.MouseEvent) => void;
  onLeave: () => void;
}

// Build the horizontal-link path generator once at module load instead of per render.
const linkGenerator: any = d3Sankey.sankeyLinkHorizontal();

/**
 * Create a single Sankey link path.
 *
 * @param data the link datum produced by the d3-sankey layout
 */
export const Link: React.FC<LinkProps> = ({ data, opacity, onHover, onLeave }) => {
  // `triggerProps` (when present) carries the click/keydown handlers that open the data-links
  // menu for the multi-link case; they are spread onto the flow path.
  const renderPath = (triggerProps?: any) => (
    <path
      d={linkGenerator(data)}
      fill="none"
      stroke={data.color}
      strokeOpacity={0.8}
      opacity={opacity}
      strokeWidth={data.width}
      style={{ cursor: 'pointer' }}
      onMouseMove={onHover}
      onMouseLeave={onLeave}
      {...triggerProps}
    />
  );

  // If the row has Grafana data links configured, wrap the flow so clicking it navigates or
  // opens a menu, matching the Table panel's behavior. A flow maps to exactly one query row, so
  // its links come from that row. DataLinksContextMenu renders a real <a> around the flow for a
  // single link (an SVG <a> here, since we are inside the chart's <svg>), and provides
  // `triggerProps` to open a context menu when there are multiple links.
  const links = data.dataLinks;
  if (links && links.length > 0) {
    return (
      <DataLinksContextMenu links={() => links}>
        {({ triggerProps }) => renderPath(triggerProps)}
      </DataLinksContextMenu>
    );
  }

  return renderPath();
};
