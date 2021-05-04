# NetSage Sankey Grafana Plugin

[![Build](https://github.com/bijujacob/netsage-sankey-v3/workflows/CI/badge.svg)](https://github.com/bijujacob/netsage-sankey-v3/actions?query=workflow%3A%22CI%22)

This is a panel plugin for generating a Sankey diagram in Grafana 7.0+ for NetSage. The plugin uses D3 which is already bundled with Grafana.

## Getting starte

1. Clone this repository to your Grafana plugins directory and install dependencies

   ```bash
   yarn install
   ```

2. Build plugin in development mode or run in watch mode

   ```bash
   yarn dev
   ```

   or

   ```bash
   yarn watch
   ```

3. Build plugin in production mode (optional during development)

   ```bash
   yarn build
   ```

4. Restart Grafana

   ```bash
   # May vary based on your system
   sudo service grafana-server restart
   
   ```
