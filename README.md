# NetSage Sankey Grafana Plugin

[![Build](https://github.com/bijujacob/netsage-sankey-v3/workflows/CI/badge.svg)](https://github.com/bijujacob/netsage-sankey-v3/actions?query=workflow%3A%22CI%22)

This is a NetSage panel plugin for generating Sankey diagrams in Grafana 7.0+. This plugin requires [d3-sankey](https://github.com/d3/d3-sankey) - a [D3.js](https://github.com/d3) package. D3 is already bundled with Grafana 7.0+.

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
