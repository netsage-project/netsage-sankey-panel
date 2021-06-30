// import * as d3 from 'd3';
// import * as d3Sankey from 'd3-sankey';

// export default class Sankey {
//   constructor(id) {
//     this.containerID = id;
//   }

//   /**
//    * Renders the sankey in the panel.
//    *
//    * @param
//    */

//   renderSankey(parsedData) {
//     if (!parsedData) {
//       return;
//     }

//     // SUPER IMPORTANT! This clears old chart before drawing new one...
//     d3.select('#' + this.containerID)
//       .select('svg')
//       .remove();
//     d3.select('#' + this.containerID)
//       .select('.tooltip')
//       .remove();
//     // ----------------------------------------------------------

//     console.log('rendering Graph...');

//     let panelWidth = document.getElementById(this.containerID).offsetWidth;
//     let panelHeight = document.getElementById(this.containerID).offsetHeight;

//     // set the dimensions and margins of the graph
//     var margin = { top: 50, right: 400, bottom: 25, left: 400 },
//       width = panelWidth - margin.left - margin.right,
//       height = panelHeight - margin.top - margin.bottom;

//     // append the svg object to the body of the page
//     var svg = d3
//       .select('#' + this.containerID)
//       .append('svg')
//       .attr('width', width + margin.left + margin.right)
//       .attr('height', height + margin.top + margin.bottom)
//       .append('g')
//       .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
//   }
// }
