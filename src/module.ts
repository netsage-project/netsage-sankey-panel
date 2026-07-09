import { PanelPlugin, FieldConfigProperty, FieldOverrideContext, getFieldDisplayName } from '@grafana/data';
import { SankeyOptions } from './types';
import { SankeyPanel } from './SankeyPanel';

/**
 * Grafana panel plugin main module
 *
 * @param {*} { panel: React.ComponentType<PanelProps<SankeyOptions>> | null }
 * @return {*} { builder: PanelOptionsEditorBuilder<SankeyOptions> }
 */

export const plugin = new PanelPlugin<SankeyOptions>(SankeyPanel)
  .setPanelOptions((builder) => {
    builder
      .addBooleanSwitch({
        path: 'colorByValueMappings',
        name: 'Color links by value mappings',
        description:
          'Color each flow using the value mapping set on its source (first column) value. ' +
          'Values without a mapped color keep their palette color.',
        defaultValue: false,
      })
      .addBooleanSwitch({
        path: 'monochrome',
        name: 'Single Link color only',
        defaultValue: false,
        showIf: (config: SankeyOptions) => !config.colorByValueMappings,
      })
      .addColorPicker({
        path: 'color',
        name: 'Link Color',
        showIf: (config: SankeyOptions) => !config.colorByValueMappings && config.monochrome,
        defaultValue: 'blue',
      })
      .addTextInput({
        path: 'palette',
        name: 'Custom color palette',
        description:
          'Comma-separated colors (hex like #ff0000, CSS names, or Grafana color names) cycled ' +
          'across the flows. Leave empty to use the default palette.',
        defaultValue: '',
        showIf: (config: SankeyOptions) => !config.colorByValueMappings && !config.monochrome,
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
      .addSliderInput({
        path: 'labelSize',
        name: 'Label Size',
        description: 'The font size of the labels in px',
        defaultValue: 14,
        settings: {
          min: 6,
          max: 24,
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
      })
      .addRadio({
        path: 'linkMode',
        name: 'Link mode',
        description:
          'Columns as levels: each column is a level and each row a full path. ' +
          'Edge list: first two columns are source→target and nodes connect by name (for multilevel graphs).',
        defaultValue: 'columns',
        settings: {
          options: [
            { value: 'columns', label: 'Columns as levels' },
            { value: 'edgeList', label: 'Edge list (source → target)' },
          ],
        },
      })
      .addSliderInput({
        path: 'iteration',
        name: 'Layout iterations',
        defaultValue: 7,
        settings: {
          min: 1,
          max: 30,
          step: 1,
        },
      })
      .addRadio({
        path: 'nodeOrder',
        name: 'Node ordering',
        description: 'Order nodes vertically by the query/row order, or let the layout decide automatically',
        defaultValue: 'data',
        settings: {
          options: [
            { value: 'data', label: 'Query order' },
            { value: 'auto', label: 'Automatic' },
          ],
        },
      });
  })
  // NOTE: the standard Color field config below is enabled but is NOT currently consumed by
  // the render path — link colors come from the monochrome/color options + palette in
  // dataParser.ts, and node color from the `nodeColor` option. Left as-is to avoid changing
  // behavior; consolidating the two color systems is future work (see refactor_notes.md).
  //
  // The standard Data links option (FieldConfigProperty.Links) is enabled by default (it is not
  // in disableStandardOptions), and the panel now honors it: configured links are attached to
  // each flow via field.getLinks() in dataParser.ts and opened on click by DataLinksContextMenu.
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
