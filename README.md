# NetSage Sankey Grafana Plugin

[![CI](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/ci.yml/badge.svg)](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/ci.yml)
[![Release](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/release.yml/badge.svg)](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/release.yml)

This is a panel plugin for generating Sankey diagrams in Grafana 7.0+.  Sankey diagrams are good for visualizing flow data and the width of the flows will be proportionate to the selected metric.

![](src/img/sankey2.png)

## How it works
The sankey panel requires at least 2 columns of data, a source and destination for the flows.
The panel will draw links from the first column of data points, to the last in order of the query.  The thickness of the links will be proportionate to the value as assigned by the metric in the query.

## Customizing
- **Links:** There are currently two options for link color: multi or single.  It is multi-colored by default.  To choose a single color for the links, toggle the ``Single Link color only`` option and choose your color from Grafana's color picker.
- **Text:** You can change the color of the label text by changing the ``Text color`` option
- **Nodes:** You can change the color of the rectangular nodes by changing the ``Node color`` option
- **Headers** The column headers can be changed by using a Display Name override in the editor panel.

