# NetSage Sankey Grafana Plugin

[![CI](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/ci.yml/badge.svg)](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/ci.yml)
[![Release](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/release.yml/badge.svg)](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/release.yml)

This is a panel plugin for generating Sankey diagrams in Grafana 11.0+.  Sankey diagrams are good for visualizing flow data and the width of the flows will be proportionate to the selected metric.

![](https://github.com/netsage-project/netsage-sankey-panel/blob/master/src/img/sankey2.png?raw=true)

## How it works
The sankey panel requires at least 2 columns of data, a source and destination for the flows. This means your query should group your data into at least two groups.  The screenshot above shows data grouped by source country, then by destination county.
The panel will draw links from the first column of data points, to the last in order of the query.  The thickness of the links will be proportionate to the value as assigned by the metric in the query.

![](https://github.com/netsage-project/netsage-sankey-panel/blob/master/src/img/sankey3.png?raw=true)

## Link modes
There are two ways to shape your data, selected with the **Link mode** option:

- **Columns as levels** (default): each column is a level and each row is a full path across all
  the columns. The thickness is the value column. Use this for a fixed number of stages.

  | Continent | Country | City  | Bytes |
  | --------- | ------- | ----- | ----- |
  | Europe    | France  | Paris | 10    |
  | Europe    | France  | Lyon  | 5     |
  | Asia      | Japan   | Tokyo | 8     |

  This produces a 3-level diagram (Continent → Country → City). Note that a node is identified by
  *(column, name)*, so the same name in two different columns is treated as two separate nodes.

- **Edge list (source → target)**: the first two (non-value) columns are the source and target of
  a single link, the value column is the thickness, and **nodes connect by name**. This lets you
  build multilevel graphs where a node is a target in one row and a source in another:

  | source | target | value |
  | ------ | ------ | ----- |
  | A      | X      | 10    |
  | X      | B      | 5     |
  | X      | C      | 3     |

  Here `X` is shared, so the diagram is a connected multilevel flow `A → X → {B, C}`. The number
  of levels is computed automatically from the links. Be sure to select your **Value Field**;
  rows where source equals target (self-loops) are skipped, and cyclic data is not supported.

### Variable-depth paths (NULL values)
If your paths have different lengths, pad the unused columns with **NULL** (or leave them empty).
Empty/NULL cells are skipped rather than drawn as a node, so a shorter path links its real nodes
directly and skips the unused levels. For example, in *Columns as levels* mode the row
`A1, NULL, Z1, <value>` draws `A1 → Z1` (the missing middle level is skipped), and in *Edge list*
mode any row with a NULL source or target is ignored.

## Customizing
- **Links:** There are three ways to color the flows:
  - *Multi-color* (default): flows are colored from a palette, one color per source series. Enter your own colors in the **Custom color palette** option (a comma-separated list of hex values, CSS color names, or Grafana color names) to override the built-in palette.
  - *Single color*: toggle "Single Link color only" and pick a color.
  - *By value mappings*: toggle "Color links by value mappings" to color each flow using the value-mapping / threshold / field color configured for its source (first column) value — e.g. add a value mapping on the source field mapping each series name to a color. Flows whose source has no resolved color fall back to the palette.
- **Nodes:** You can change the color of the rectangular nodes by changing the "Node color" option
- **Node Width** The width of the nodes can be adjusted with the "Node Width" slider or entering a number in the input box.  This number must be an integer.
- **Node Padding** The vertical padding between nodes can be adjusted with the "Node Padding" slider or entering a number in the input box.  This number must be an integer.  If your links are too skinny, try adjusting this number
- **Headers** The column headers can be changed by using a Display Name override in the editor panel.  They will be the same color you choose for Text color
- **Sankey Layout** The layout of the sankey links can be adjusted slightly using the "Layout iteration" slider. This number must be an integer and is the number of relaxation iterations used to generate the layout.

## Data links
The panel supports Grafana [data links](https://grafana.com/docs/grafana/latest/panels-visualizations/configure-data-links/). Add a data link in the panel's field config (it can reference any field with `${__data.fields.<name>}`), then click a flow to open it. A flow corresponds to one query row, so its link is interpolated from that row's values. If a single link is configured the flow navigates directly on click; if multiple links are configured a menu is shown. (Data links attach to flows, not to nodes, since a node aggregates many rows.)


