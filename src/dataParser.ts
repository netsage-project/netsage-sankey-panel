import { DataFrameView, getFieldDisplayName } from '@grafana/data';

export function parseData(data, options) {
    const { valueFieldName } = options;

    var allData = data.series[0].fields;
    var numFields = allData.length - 1;

    // add data checker.  are there enough fields?

    // get display names
    let displayNames: Array<string> = [];
    allData.forEach(field => {
        displayNames.push(getFieldDisplayName(field));
    });

    // Find selected value field or default to the first number field and use for values.
    const valueField = valueFieldName
        ? data.series.map(series => series.fields.find(field => field.name === valueFieldName))
        : data.series.map(series => series.fields.find(field => field.type === 'number'));

    let values = [];
    valueField[0].values.buffer.map(value => {
        values.push([value, valueField[0].display(value), valueField[0].name]);
    })
    // display converts value to display value with units
    // name = name of field

    let pluginDataLinks: Array<{ source: number; target: number; value: number; id: string }> = [];
    let pluginDataNodes: Array<{ name: any }> = [];

    const series = data.series[0];
    const frame = new DataFrameView(series);

    // Retrieve panel data from panel

    frame.forEach((row) => {
        let currentLink = [];
        // go through columns to find all nodes
        for (let i = 0; i < numFields; i++) {
            let node = row[i];
            let index = pluginDataNodes.findIndex((e) => e.name === `${node} (col ${i})`);
            if (index === -1) {
                index = pluginDataNodes.push({ name: `${node} (col ${i})` }) - 1;
            }
            currentLink.push(index);
        }
            // create all the individual links, value is always the last column
            for (let i = 0; i < currentLink.length - 1; i++) {
                pluginDataLinks.push({ source: currentLink[i], target: currentLink[i + 1], value: row[numFields], id: `id ${row}` });
            }

        
    });
    const pluginData = { links: pluginDataLinks, nodes: pluginDataNodes };
    console.log(pluginData);

    //

    return { pluginData, displayNames };
}
