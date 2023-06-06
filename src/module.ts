import { PanelPlugin, FieldConfigProperty, FieldOverrideContext, getFieldDisplayName } from '@grafana/data';
// import { standardOptionsCompat } from 'grafana-plugin-support';
import { SankeyOptions } from './types';
import { SankeyPanel } from './SankeyPanel';

/**
 * Grafana panel plugin main module
 *
 * @param {*} { panel: React.ComponentType<PanelProps<SankeyOptions>> | null }
 * @return {*} { builder: PanelOptionsEditorBuilder<SankeyOptions> }
 */

const monochromeBool = (monochrome: boolean) => (config: SankeyOptions) => config.monochrome === monochrome;

export const plugin = new PanelPlugin<SankeyOptions>(SankeyPanel)
  .setPanelOptions((builder) => {
    builder
      .addBooleanSwitch({
        path: 'monochrome',
        name: 'Single Link color only',
        defaultValue: false,
      })
      .addColorPicker({
        path: 'color',
        name: 'Link Color',
        showIf: monochromeBool(true),
        defaultValue: 'blue',
      })
      .addColorPicker({
        path: 'nodeColor',
        name: 'Node color',
        defaultValue: 'grey',
      })
      .addSliderInput({
        path: 'nodeWidth',
        name: 'Node width',
        defaultValue: 30,
        settings: {
          min: 5,
          max: 100,
          step: 1,
        },
      })
      .addSliderInput({
        path: 'nodePadding',
        name: 'Node padding',
        defaultValue: 30,
        settings: {
          min: 1,
          max: 100,
          step: 1,
        },
      })
      .addSelect({
        path: 'valueField',
        name: 'Value Field',
        description: 'Select the field that should be used for the link thickness',
        settings: {
          allowCustomValue: false,
          options: [],
          getOptions: async (context: FieldOverrideContext) => {
            const options = [];
            if (context && context.data) {
              for (const frame of context.data) {
                for (const field of frame.fields) {
                  const name = getFieldDisplayName(field, frame, context.data);
                  const value = name;
                  options.push({ value, label: name });
                }
              }
            }
            return Promise.resolve(options);
          },
        },
        // defaultValue: options[0],
      }).addSliderInput({
        path: 'iteration',
        name: 'Layout iterations',
        defaultValue: 7,
        settings: {
          min: 1,
          max: 30,
          step: 1,
        },
      });
  })
  .useFieldConfig({
    disableStandardOptions: [FieldConfigProperty.NoValue, FieldConfigProperty.Max, FieldConfigProperty.Min],
    standardOptions: {
      [FieldConfigProperty.Color]: {
        settings: {
          byValueSupport: true,
          bySeriesSupport: true,
          preferThresholdsMode: true,
        },
      },
    },
  });
