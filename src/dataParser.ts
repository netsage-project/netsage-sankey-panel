import { DataFrameView, Field, getFieldDisplayName, Vector } from '@grafana/data';

export function parseData(data: { series: any[] }, options: { valueFieldName: any }, monochrome: boolean, color: any) {
  const { valueFieldName } = options;

  /**
   * Colors
   * if monochrome = true, set all colors to value: color
   * else, set to multi color
   */
  const colorArray: string[] = [];
  if (monochrome) {
    colorArray.push(color);
  } else {
    colorArray.push('#018EDB');
    colorArray.push('#DB8500');
    colorArray.push('#7C00DB');
    colorArray.push('#DB0600');
    colorArray.push('#00DB57');
  }

  var allData = data.series[0].fields;
  var numFields = allData.length - 1;

  // add data checker.  are there enough fields?

  // get display names
  let displayNames: string[] = [];
  allData.forEach((field: Field<any, Vector<any>>) => {
    displayNames.push(getFieldDisplayName(field));
  });

  // Find selected value field or default to the first number field and use for values.
  const valueField = valueFieldName
    ? data.series.map((series: { fields: any[] }) =>
        series.fields.find((field: { name: any }) => field.name === valueFieldName)
      )
    : data.series.map((series: { fields: any[] }) =>
        series.fields.find((field: { type: string }) => field.type === 'number')
      );

  let values = [];
  valueField[0].values.buffer.map((value: any) => {
    values.push([value, valueField[0].display(value), valueField[0].name]);
  });
  // display converts value to display value with units
  // name = name of field

  const series = data.series[0];
  const frame = new DataFrameView(series);

  let pluginDataLinks: Array<{
    source: number;
    target: number;
    value: number;
    displayValue: any;
    id: string;
    color: any;
    node0: any;
  }> = [];
  let pluginDataNodes: Array<{ name: any; id: any; colId: number }> = [];
  let col0: Array<{ name: any; index: number; color: any }> = [];
  var rowId = 0; // update after each row
  var currentColor;

  // Retrieve panel data from panel
  frame.forEach((row) => {
    let currentLink: number[] = [];
    // go through columns to find all nodes
    for (let i = 0; i < numFields; i++) {
      let node = row[i];
      let index = pluginDataNodes.findIndex((e) => e.name === node && e.colId === i);
      if (index === -1) {
        index = pluginDataNodes.push({ name: node, id: [`row${rowId}`], colId: i }) - 1;
        if (i === 0) {
          currentColor = colorArray[col0.length % colorArray.length];
          col0.push({ name: node, index: index, color: currentColor });
        }
      } else {
        pluginDataNodes[index].id.push(`row${rowId}`); // might not need?
      }
      currentLink.push(index);
    }
    // create all the individual links, value is always the last column
    // let rowColor = colorArray[currentLink[0] % colorArray.length];
    let rowColor = col0.find((e) => e.index === currentLink[0])?.color;
    for (let i = 0; i < currentLink.length - 1; i++) {
      var fieldValues = valueField[0].display(row[numFields]);
      // var displayValue = JSON.stringify(fieldValues);
      var displayValue = `${fieldValues.text} ${fieldValues.suffix}`;
      pluginDataLinks.push({
        source: currentLink[i],
        target: currentLink[i + 1],
        value: row[numFields],
        displayValue: displayValue,
        id: `row${rowId}`,
        color: rowColor,
        node0: currentLink[0],
      });
    }
    rowId++;
  });
  const pluginData = { links: pluginDataLinks, nodes: pluginDataNodes };
  console.log(pluginData);

  return [pluginData, displayNames];
}
