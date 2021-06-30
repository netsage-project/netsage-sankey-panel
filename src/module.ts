import { PanelPlugin, FieldConfigProperty } from '@grafana/data';
import { standardOptionsCompat } from 'grafana-plugin-support';
import { SankeyOptions } from './types';
import { SankeyPanel } from './SankeyPanel';

// import { standardOptionsCompat } from 'grafana-plugin-support';

/**
 * Grafana panel plugin main module
 *
 * @param {*} { panel: React.ComponentType<PanelProps<SankeyOptions>> | null }
 * @return {*} { builder: PanelOptionsEditorBuilder<SankeyOptions> }
 */
const buildStandardOptions = (): any => {
  const options = [
    FieldConfigProperty.Decimals,
    FieldConfigProperty.Unit,
    // FieldConfigProperty.Color,
  ];

  return standardOptionsCompat(options);
};

const monochromeBool = (monochrome: boolean) => (config: SankeyOptions) => config.monochrome === monochrome;

export const plugin = new PanelPlugin<SankeyOptions>(SankeyPanel)
  .setPanelOptions((builder) => {
    builder
      .addBooleanSwitch({
        path: 'monochrome',
        name: 'Single color only',
        defaultValue: false,
      })
      .addColorPicker({
        path: 'color',
        name: 'Color',
        showIf: monochromeBool(true),
        defaultValue: 'blue',
      });
  })
  .useFieldConfig({
    standardOptions: buildStandardOptions(),
  });
