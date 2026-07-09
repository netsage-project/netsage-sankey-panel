export interface SankeyOptions {
  /** When true, all links use the single `color`; otherwise the multi-color palette is used. */
  monochrome: boolean;
  color: string;
  /**
   * Color each flow by the value-mapping / threshold / field color of its source (first-column)
   * value. Takes precedence over `monochrome` / `palette` when a color is resolved.
   */
  colorByValueMappings: boolean;
  /**
   * Custom multi-color palette: a comma-separated list of colors (hex, CSS names, or Grafana
   * color tokens) cycled across the flows. Empty = the built-in default palette.
   */
  palette: string;
  nodeColor: string;
  nodeWidth: number;
  nodePadding: number;
  iteration: number;
  /**
   * Name of the field used for link thickness. The remaining columns are treated as Sankey
   * stages, in query order (see the "value is the last column" contract in dataParser.ts).
   */
  valueField: string;
  labelSize: number;
  /**
   * Vertical node ordering: 'data' fixes nodes to the query/row order (so a sort transform
   * controls the layout); 'auto' uses d3-sankey's automatic ordering.
   */
  nodeOrder: 'data' | 'auto';
  /**
   * How rows map to the graph. 'columns': each column is a level and each row a full path.
   * 'edgeList': the first two (non-value) columns are source→target and nodes connect by name,
   * enabling multilevel graphs where a node is a target in one row and a source in another.
   */
  linkMode: 'columns' | 'edgeList';
}
