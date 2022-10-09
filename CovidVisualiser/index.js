var headerID=d3.select("#headerID");
console.log(headerID.text());
headerID.text("COVID-19 Visualiser");

const Test_Data = [
    {id: 'd1', value: 10, region: 'NZ'},
    {id: 'd2', value: 15, region: 'AUS'},
    {id: 'd3', value: 19, region: 'USA'},
    {id: 'd4', value: 17, region: 'UK'},
];

// Select all paragraphs in div, bind data, and add data as paragraphs for missing elements
// d3.select('div')
//     .selectAll('p')
//     .data(Test_Data)
//     .enter()
//     .append('p')
//     .text(dta => dta.region);

const xScale = d3.scaleBand().domain(Test_Data.map((dataPoint) => dataPoint.region)).rangeRound([0, 1000]).padding(0.2);
const yScale = d3.scaleLinear().domain([0, 20]).range([700, 0]);

const container = d3.select("svg")
    .classed("container", true)
    .style("border", "1px solid black")

container
    .selectAll(".bar")
    .data(Test_Data)
    .enter()
    .append("rect")
    .classed("bar", true)
    .attr("width", xScale.bandwidth())
    .attr("height", (data) => 700 - yScale(data.value))
    .attr("x", data => xScale(data.region))
    .attr("y", data => yScale(data.value));