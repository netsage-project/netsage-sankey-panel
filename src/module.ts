import { PanelPlugin } from '@grafana/data';
import { NetSageSankeyOptions } from './types';
import { NetSageSankey } from './NetSageSankey';

export const plugin = new PanelPlugin<NetSageSankeyOptions>(NetSageSankey).setPanelOptions(builder => {
  return builder
    .addBooleanSwitch({
      path: 'showWarmColors',
      name: 'Show warm colors',
      defaultValue: true,
    })
});
