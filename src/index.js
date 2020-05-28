/*
 * @Descripttion: 
 * @version: 
 * @Author: Anke Wang
 * @Date: 2020-05-28 13:53:39
 * @LastEditors: Anke Wang
 * @LastEditTime: 2020-05-28 15:05:07
 */ 
import './css/index.css';
//import './sass/button.min.css';
import * as d3 from 'd3';
import { getUniqueCountry, getUniqueDate, getUniqueVirus } from './dataProcess';
import { buildNode } from './buildNode';
import { nodeLink, setScale } from './nodeLink';
import { defaultColor, defaultBehaviors, linkRange, nodeRange, chargeRange } from './plotConfig';
//import { globalSearch } from './search';
//import { nodeHighlight, linkHighlight } from './partsHighlight';
import 'bootstrap';
import 'select2';
//import { drawBarPlot, drawHeatmapDate } from './datePlot';
//import { playStart } from './player';
//import { setCountryCoord, drawMap, drawCircle } from './mapPlot';
import { setSimulation } from './simulation';
//import { drawGeneStructure } from './geneSturcture';
import { saveSvgAsPng } from 'save-svg-as-png';
//import { refreshNodeTable, updateNodeTable, updateNodeTableByVirus } from "./nodeTable";


d3.json("https://bigd.big.ac.cn/ncov/rest/variation/haplotype/json?date=freq&area=world&frequency=0.001").then(graph => {

    let uniqueCountry = getUniqueCountry(graph);
    let uniqueDate = getUniqueDate(graph)
    let uniqueVirus = getUniqueVirus(graph)
    let infor = graph.infor;

    let colorCustom = defaultColor;
    let nodeExtent = d3.extent(graph.nodes.map(a => a.radius))
    let linkExtent = d3.extent(graph.links.map(a => a.distance))

    let nodeScale = setScale("sqrt", nodeExtent, nodeRange)
    let linkScale = setScale("sqrt", linkExtent, linkRange)
    let charge = chargeRange

    let width = $('.network-panel').width();
    let height = $('.network-panel').height();

    let svg = d3.select("#plot").append("svg")
        .attr("id", "svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom().on("zoom", zoomed))
        .on("wheel.zoom", null)
        .on("dblclick.zoom", null);

    function zoomed() {
        plotCanvas.attr("transform", d3.event.transform);
    }

    const zoom = d3.zoom()
        .scaleExtent([0.1, 40])
        .on("zoom", zoomed);

    let plotCanvas = svg.append('g')
        .call(() => zoom)
        .on("wheel.zoom", null)
        .on("dblclick.zoom", null);

    d3.select("#zoomReset")
        .on("click", () => plotCanvas.transition().call(zoom.scaleTo, 1))

    d3.select("#zoomIn")
        .on("click", () => plotCanvas.transition().call(zoom.scaleBy, 1.2))

    d3.select("#zoomOut")
        .on("click", () => plotCanvas.transition().call(zoom.scaleBy, 0.8))

    let { node, link } = nodeLink(graph, plotCanvas)

    let simulation = setSimulation(linkScale, nodeScale, charge, width, height)

    node.each(function (d) {
        buildNode(d3.select(this), nodeScale(d.radius), d.pieChart, uniqueCountry, d.id)
    });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    $("input[name='linkScaleType'],input[name='nodeScaleType'],#linkMin,#linkMax,#nodeMin,#nodeMax,#charge").on("change", e => {

        let linkRange = [parseInt($("#linkMin").val()), parseInt($("#linkMax").val())]
        let nodeRange = [parseInt($("#nodeMin").val()), parseInt($("#nodeMax").val())]
        let charge = $("#charge").val();

        linkScale = setScale($("input[name='linkScaleType']:checked").val(), linkExtent, linkRange)
        nodeScale = setScale($("input[name='nodeScaleType']:checked").val(), nodeExtent, nodeRange)

        simulation.stop()
        simulation = setSimulation(linkScale, nodeScale, charge, width, height)
        simulation
            .nodes(graph.nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(graph.links);


        d3.selectAll("#plot>svg>.nodes>g>*").remove()

        node.each(function (d) {
            buildNode(d3.select(this), nodeScale(d.radius), d.pieChart, uniqueCountry, d.id)
        });

    });

    node
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    function ticked() {

        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        d3.select("#plot").selectAll("path")
            .attr("transform", d => "translate(" + d.x + "," + d.y + ")")

        d3.select("#plot").selectAll("circle").attr("cx", d => d.x)
            .attr("cy", d => d.y);

        d3.select("#plot").selectAll("text.t1")
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active)
            simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    defaultBehaviors(uniqueCountry, uniqueDate, graph)


});
    
    $('.fa-info-circle').tooltip({
        html: true,
        placement: 'left',
        title: "Scale: Set the type of scale for mapping data.<br>Size: Set the domain of the size of items.<br>Charge: Set repulsive force of the nodes to prevent overlapping."
    });
    
    $("#exportSvg").on("click", function () {
        saveSvg(document.getElementById("svg"), "haplotype_ncov2019_from_NGDC.svg")
    })

    $("#exportPng").on("click", function () {
        saveSvgAsPng(document.getElementById("svg"), "haplotype_ncov2019_from_NGDC.png");
    })

    function saveSvg(svgEl, name) {
        svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        var svgData = svgEl.outerHTML;
        var preface = '<?xml version="1.0" standalone="no"?>\r\n';
        var svgBlob = new Blob([preface, svgData], { type: "image/svg+xml;charset=utf-8" });
        var svgUrl = URL.createObjectURL(svgBlob);
        var downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = name;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }