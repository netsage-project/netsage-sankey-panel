import { PanelPlugin, FieldConfigProperty } from '@grafana/data';
import { standardOptionsCompat } from 'grafana-plugin-support';
import { SankeyOptions, SankeyFieldConfig } from './types';
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

const monochromeBool = (monochrome: boolean) => (config: SankeyFieldConfig) => config.monochrome === monochrome;

export const plugin = new PanelPlugin<SankeyOptions>(SankeyPanel)
  // .setPanelOptions((builder) => {
  //   builder.addRadio({
  //     path: 'colorTheme',
  //     name: 'Color Theme',
  //     description: 'Choose whether colors should be warm or cool',
  //     settings: {
  //       options: [
  //         { value: 'warm', label: 'Warm' },
  //         { value: 'cool', label: 'Cool' },
  //       ],
  //     },
  //     defaultValue: 'warm',
  //   });
  // })
  .useFieldConfig({
    useCustomConfig: (builder) => {
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
    },
    standardOptions: buildStandardOptions(),
  });
