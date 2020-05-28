/*
 * @Descripttion: 
 * @version: 
 * @Author: Mengwei Li
 * @Date: 2020-04-02 14:46:45
 * @LastEditors: Anke Wang
 * @LastEditTime: 2020-05-28 14:43:53
 */

import * as d3 from 'd3';
import { nodeRange, linkRange } from './plotConfig'
//import { nodeHighlight, linkHighlight } from './partsHighlight'
//import { updateNodeTable } from './nodeTable';

export const setScale = (type, extent, range) => {
    let nodeScale;

    if (type === "sqrt") {
        nodeScale = d3.scaleSqrt()
            .domain(extent)
            .range(range);
    } else {
        nodeScale = d3.scaleLinear()
            .domain(extent)
            .range(range);
    }
    return nodeScale;
}

export const nodeLinkScale = (graph) => {

    let lineScale = d3.scalePow()
        .exponent(0.5)
        .domain(d3.extent(graph.links.map(a => a.distance)))
        .range(linkRange);

    let nodeScale = d3.scaleSqrt()
        .domain(d3.extent(graph.nodes.map(a => a.radius)))
        .range(nodeRange);

    return { lineScale, nodeScale }
}


export const nodeLink = (graph, plotCanvas) => {

    let tooltip = d3.select("body")
        .append("div")
        .attr("class", "d3-tip")
        .style("opacity", 0);
    
    let link = plotCanvas
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("stroke-width", 0.8)
        .attr("stroke", "#999")

    let node = plotCanvas
        .attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        .enter()
        .append("g")
        .attr("radius", d => d.radius)

/*    link.on("click", d => { 
        linkHighlight(node, link, d, 0.1) 
    })*/

    node.on('mouseover.tooltip', function(d) {
      	tooltip.transition()
        	.duration(300)
        	.style("opacity", .8);
			tooltip.html(d.group)
        	.style("left", (d3.event.pageX) + "px")
        	.style("top", (d3.event.pageY + 10) + "px");
			})
		.on("mouseout.tooltip", function() {
			tooltip.transition()
				.duration(100)
				.style("opacity", 0);
			});
		//.on('dblclick',releasenode);
    
    return { node, link }
}
