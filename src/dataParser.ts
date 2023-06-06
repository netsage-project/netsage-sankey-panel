import { DataFrameView, Field, getFieldDisplayName, Vector } from '@grafana/data';
// import { color } from 'd3';
/**
 * Takes data from Grafana query and returns it in the format needed for this panel
 *
 * @param data the data returned by the query
 * @param options the field options from the editor panel
 * @param monochrome the boolean in the editor panel that sets whether the sankey is single or multi colored
 * @param color the color chosen in the editor panel for the sankey links if monochrome bool is true
 * @return {pluginData} the node and link data for the d3-sankey
 * @return {displayNames} the display names for the headers
 * @return {rowDisplayNames}
 * @return {valueField[0]}
 */
export function parseData(data: { series: any[] }, options: { valueField: any }, monochrome: boolean, color: any) {
  const valueFieldName = options.valueField;

  /**
   * Colors
   * if monochrome = true, set all colors to value: color
   * else, set to multi color
   */

  function fixColor(color: string) {
    switch (color) {
      case 'dark-green':
        color = '#1A7311';
        break;
      case 'semi-dark-green':
        color = '#36872D';
        break;
      case 'light-green':
        color = '#73BF68';
        break;
      case 'super-light-green':
        color = '#96D88C';
        break;
      case 'dark-yellow':
        color = 'rgb(207, 159, 0)';
        break;
      case 'semi-dark-yellow':
        color = 'rgb(224, 180, 0)';
        break;
      case 'light-yellow':
        color = 'rgb(250, 222, 42)';
        break;
      case 'super-light-yellow':
        color = 'rgb(255, 238, 82)';
        break;
      case 'dark-red':
        color = 'rgb(173, 3, 23)';
        break;
      case 'semi-dark-red':
        color = 'rgb(196, 22, 42)';
        break;
      case 'light-red':
        color = 'rgb(242, 73, 92)';
        break;
      case 'super-light-red':
        color = 'rgb(255, 115, 131)';
        break;
      case 'dark-blue':
        color = 'rgb(18, 80, 176)';
        break;
      case 'semi-dark-blue':
        color = 'rgb(31, 96, 196)';
        break;
      case 'light-blue':
        color = 'rgb(87, 148, 242)';
        break;
      case 'super-light-blue':
        color = 'rgb(138, 184, 255)';
        break;
      case 'dark-orange':
        color = 'rgb(229, 84, 0)';
        break;
      case 'semi-dark-orange':
        color = 'rgb(250, 100, 0)';
        break;
      case 'light-orange':
        color = 'rgb(255, 152, 48)';
        break;
      case 'super-light-orange':
        color = 'rgb(255, 179, 87)';
        break;
      case 'dark-purple':
        color = 'rgb(124, 46, 163)';
        break;
      case 'semi-dark-purple':
        color = 'rgb(143, 59, 184)';
        break;
      case 'light-purple':
        color = 'rgb(184, 119, 217)';
        break;
      case 'super-light-purple':
        color = 'rgb(202, 149, 229)';
        break;
      default:
        break;
    }
    return color;
  }

  const colorArray: string[] = [];

  if (monochrome) {
    colorArray.push(fixColor(color));
    // colorArray.push(color);
  } else {
    colorArray.push('#018EDB');
    colorArray.push('#DB8500');
    colorArray.push('#7C00DB');
    colorArray.push('#DB0600');
    colorArray.push('#00DB57');
  }

  let allData = data.series[0].fields;
  let numFields = allData.length - 1;

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

  // initialize arrays
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
  let rowDisplayNames: Array<{ name: any; display: any }> = [];

  let rowId = 0; // update after each row
  let currentColor;

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
    let rowDisplay = `${pluginDataNodes[currentLink[0]].name}`;
    for (let i = 0; i < currentLink.length - 1; i++) {
      let fieldValues = valueField[0].display(row[numFields]);
      let displayValue;
      if (fieldValues.suffix) {
        displayValue = `${fieldValues.text} ${fieldValues.suffix}`;
      } else {
        displayValue = `${fieldValues.text}`;
      }

      pluginDataLinks.push({
        source: currentLink[i],
        target: currentLink[i + 1],
        value: row[numFields],
        displayValue: displayValue,
        id: `row${rowId}`,
        color: rowColor,
        node0: currentLink[0],
      });
      rowDisplay = rowDisplay.concat(` -> ${pluginDataNodes[currentLink[i + 1]].name}`);
    }
    rowDisplayNames.push({ name: `row${rowId}`, display: rowDisplay });
    rowId++;
  });
  const pluginData = { links: pluginDataLinks, nodes: pluginDataNodes };

  return [pluginData, displayNames, rowDisplayNames, valueField[0], fixColor];
}
