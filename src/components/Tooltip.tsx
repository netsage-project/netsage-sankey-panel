import React from 'react';
import { Portal, VizTooltipContainer } from '@grafana/ui';

/**
 * Describes what is currently hovered and where to draw the tooltip. Hover state is owned by
 * <Sankey> and passed down here; this component is purely presentational.
 */
export interface HoverBase {
  content: React.ReactNode;
  /** Cursor position (viewport coords) used to place the tooltip. */
  x: number;
  y: number;
}
export type HoverState =
  | (HoverBase & { kind: 'link'; linkId: string })
  | (HoverBase & { kind: 'node'; rowIds: string[] });

interface TooltipProps {
  hover: HoverState | null;
}

/**
 * Renders the hover tooltip using Grafana's own `VizTooltipContainer`, so it is theme-aware.
 *
 * The `<Portal>` is load-bearing, not decoration. `VizTooltipContainer` positions itself with
 * `position: fixed` + `transform: translate(x, y)`, and we pass viewport coordinates
 * (`clientX`/`clientY`). But a `fixed` element is positioned relative to the nearest ancestor
 * with a `transform`/`filter`/`will-change` — and Grafana's dashboard grid puts a transform on
 * every panel wrapper. Rendered inline, the tooltip therefore lands at the cursor offset *from
 * the panel's top-left* instead of the viewport's, i.e. increasingly far from the mouse the
 * further the panel sits from the top-left of the screen. Portalling to Grafana's body-level
 * overlay container escapes that containing block, which is what Grafana's own viz tooltips do.
 *
 * This replaces the previous implementation, which imperatively appended a hardcoded dark
 * `<div>` to `document.body` with D3, re-bound all mouse handlers on every render, and could
 * leak orphan tooltip nodes. The rendered content (row path / "name: value") is unchanged.
 */
export const Tooltip: React.FC<TooltipProps> = ({ hover }) => {
  if (!hover) {
    return null;
  }

  return (
    <Portal>
      <VizTooltipContainer position={{ x: hover.x, y: hover.y }} offset={{ x: 10, y: 10 }}>
        {hover.content}
      </VizTooltipContainer>
    </Portal>
  );
};
