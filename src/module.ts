import { PanelPlugin } from '@grafana/data';
import { NetSageSankeyOptions } from './types';
import { NetSageSankey } from './NetSageSankey';

/**
 * Grafana panel plugin main module
 *
 * @param {*} { panel: React.ComponentType<PanelProps<NetSageSankeyOptions>> | null }
 * @return {*} { builder: PanelOptionsEditorBuilder<NetSageSankeyOptions> }
 */
export const plugin = new PanelPlugin<NetSageSankeyOptions>(NetSageSankey).setPanelOptions(builder => {
  return builder.addBooleanSwitch({
    path: 'showWarmColors',
    name: 'Show warm colors',
    defaultValue: true,
  });
});
