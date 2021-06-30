import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';

export default class Sankey {
    constructor(id) {
        this.containerID = id;
    }

    /**
     * Renders the sankey in the panel.
     *
     * @param
     */

    renderSankey(parsedData) {
        if (!parsedData) {
            return;
        }

        // SUPER IMPORTANT! This clears old chart before drawing new one...
        d3.select('#' + this.containerID)
            .select('svg')
            .remove();
        d3.select('#' + this.containerID)
            .select('.tooltip')
            .remove();
        // ----------------------------------------------------------

        console.log('rendering Graph...');

        let panelWidth = document.getElementById(this.containerID).offsetWidth;
        let panelHeight = document.getElementById(this.containerID).offsetHeight;

        // set the dimensions and margins of the graph
        var margin = { top: 50, right: 400, bottom: 25, left: 400 },
            width = panelWidth - margin.left - margin.right,
            height = panelHeight - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3
            .select('#' + this.containerID)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    }
    /**
   * Create Sankey rectangular nodes with text
   *
   * @param {*} { index, x0, x1, y0, y1, name, length }
   * @return {*}  {*}
   */
    const Rect = ({ index, x0, x1, y0, y1, name, length }: any): any => {
        return (
            <>
                <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} data-index={index} />
                <text
                    x={x0 < width / 2 ? x1 + 6 : x0 - 6}
                    y={(y1 + y0) / 2}
                    style={{
                        // fill: d3
                        //     .rgb(colors(index / length))
                        //     .darker()
                        //     .toString(),
                        alignmentBaseline: 'middle',
                        fontSize: 16,
                        textAnchor: x0 < width / 2 ? 'start' : 'end',
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                >
                    {name}
                </text>
            </>
        );
    };

    /**
     * Create Sankey links between nodes
     *
     * @param {*} { data, width, length }
     * @return {*}
     */
    const Link = ({ data, width, length }: any): any => {
        const link: any = d3Sankey.sankeyLinkHorizontal();

        return (
            <path
                d={link(data)}
                fill={'none'}
                stroke={`url(#gradient-${data.index})`}
                strokeOpacity={0.5}
                strokeWidth={width}
            />
        );
    };
    /**
     * Main Sankey generator
     *
     */
    const Sankey = (): any => {
        const sankey: any = d3Sankey
            .sankey()
            .nodeAlign(d3Sankey.sankeyJustify)
            .nodeWidth(20)
            .nodePadding(20)
            .extent([
                [0, 0],
                [width, height],
            ]);

        // Return an SVG group only if data exists
        if (pluginData) {
            // graph.current = sankey(pluginData);
            // const { links, nodes } = graph.current;
            const { links, nodes } = sankey(pluginData);

            return (
                <svg width={width} height={height}>
                    <g>
                        {links.map((d: { width: any }, i: any) => (
                            <Link key={i} data={d} width={d.width} length={nodes.length} colors={colors} />
                        ))}
                    </g>
                    <g>
                        {nodes.map((d: { index: any; x0: any; x1: any; y0: any; y1: any; name: any; value: any }, i: any) => (
                            <Rect
                                key={i}
                                index={d.index}
                                x0={d.x0}
                                x1={d.x1}
                                y0={d.y0}
                                y1={d.y1}
                                name={d.name}
                                value={d.value}
                                length={nodes.length}
                                colors={colors}
                            />
                        ))}
                    </g>
                </svg>
            );
        }

        return <svg width={width} height={height}></svg>;
    }
}
