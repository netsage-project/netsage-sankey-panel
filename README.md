# NetSage Sankey Grafana Plugin

[![CI](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/ci.yml/badge.svg)](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/ci.yml)
[![Release](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/release.yml/badge.svg)](https://github.com/netsage-project/netsage-sankey-panel/actions/workflows/release.yml)

This is a panel plugin for generating Sankey diagrams in Grafana 7.0+.  Sankey diagrams are good for visualizing flow data and the width of the flows will be proportionate to the selected metric.

## Getting started

1. Clone this repository to your Grafana plugins directory and install dependencies.

   ```bash
   yarn install
   ```

2. Build plugin in development mode or run in watch mode.

   ```bash
   yarn dev
   ```

   or

   ```bash
   yarn watch
   ```

3. Build plugin in production mode (optional during development).

   ```bash
   yarn build
   ```

4. Restart Grafana.

   ```bash
   # May vary based on your environment
   sudo service grafana-server restart
   
   ```

> :warning:
Grafana 8 requires all plugins to be signed by default. To run unsigned plugins during dev, set `app_mode = development` in **grafana.ini** (typically _/etc/grafana/grafana.ini_) and restart grafana.
