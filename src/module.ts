import { PanelPlugin } from '@grafana/data';
import { NetSageSankeyOptions } from './types';
import { NetSageSankey } from './NetSageSankey';

/**
 * Grafana panel plugin main module
 *
 * @param {*} { panel: React.ComponentType<PanelProps<NetSageSankeyOptions>> | null }
 * @return {*} { builder: PanelOptionsEditorBuilder<NetSageSankeyOptions> }
 */
export const plugin = new PanelPlugin<NetSageSankeyOptions>(NetSageSankey)
  .setPanelOptions((builder) => {
    builder.addRadio({
      path: 'colorTheme',
      name: 'Color Theme',
      description: 'Choose whether colors should be warm or cool',
      settings: {
        options: [
          { value: 'warm', label: 'Warm' },
          { value: 'cool', label: 'Cool' },
        ],
      },
      defaultValue: 'warm',
    });
  })
  .useFieldConfig({});
