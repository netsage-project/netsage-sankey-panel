import { PanelPlugin } from '@grafana/data';

// module.ts -> SankeyPanel -> Sankey -> Link/Tooltip import from @grafana/ui, whose full index
// pulls in ESM react-calendar. Stub the few exports that chain touches so the plugin module can
// be imported without loading the whole UI kit.
jest.mock('@grafana/ui', () => ({
  useTheme2: () => ({ colors: { text: { primary: '#ffffff' } } }),
  VizTooltipContainer: ({ children }: any) => children,
  DataLinksContextMenu: ({ children }: any) => children({ triggerProps: {} }),
}));

import { plugin } from '../../src/module';

describe('module (plugin registration)', () => {
  it('exports a configured PanelPlugin with a panel component', () => {
    expect(plugin).toBeInstanceOf(PanelPlugin);
    expect((plugin as any).panel).toBeTruthy();
  });

  it('registers every panel option path (including the new refactor options)', () => {
    // Drive the real options supplier with a recording builder that captures each option `path`.
    const paths: string[] = [];
    const recorder: any = new Proxy(
      {},
      {
        get: () => (config: any) => {
          if (config && typeof config.path === 'string') {
            paths.push(config.path);
          }
          return recorder;
        },
      }
    );

    plugin.getPanelOptionsSupplier()(recorder, { data: [] } as any);

    expect(paths).toEqual(
      expect.arrayContaining([
        'colorByValueMappings', // feature #8
        'monochrome',
        'color',
        'palette', // feature #8
        'nodeColor',
        'nodeWidth',
        'nodePadding',
        'labelSize',
        'valueField',
        'linkMode', // feature #4
        'iteration',
        'nodeOrder', // feature #3
      ])
    );
  });
});
