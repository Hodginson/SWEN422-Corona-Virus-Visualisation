var width, height, projection, path, graticule, svg, dateArray = [],deathDate = [], currentDate = 0, playing = false;
var countryNames = [];
var shapes;
var deathWrold;
var mapColour = "total cases";
var totalCasesLines,newCasesLines,deathsLines;



// set the dimensions and margins of the graph
var lineMargin = {top: 10, right: 30, bottom: 30, left: 100},
    width = 1000 - lineMargin.left - lineMargin.right,
    height = 1000 - lineMargin.top - lineMargin.bottom;

// append the svg object to the body of the page
var LineSvg = d3.select("#line")
  .append("svg")
    .attr("width", width + lineMargin.left + lineMargin.right)
    .attr("height", height + lineMargin.top + lineMargin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + lineMargin.left + "," + lineMargin.top + ")");




tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

function init() {

  setMap();
  animateMap();

}

function setMap() {

  width = 960, height = 580;  // map width and height

  projection = d3.geoMercator()   // define the projection 
    .scale(110)
    .translate([width / 2, height / 2])
    .precision(.1);

  path = d3.geoPath()  // create path generator function
      .projection(projection);  

  graticule = d3.geoGraticule(); // create a graticule

  svg = d3.select("#map").append("svg")   // append a svg to our html div to hold our map
      .attr("width", width)
      .attr("height", height);

  svg.append("defs").append("path")   // prepare some svg for outer container of svg elements
      .datum({type: "Sphere"})
      .attr("id", "sphere")
      .attr("d", path);

  svg.append("use")   // use that svg to style with css
      .attr("class", "stroke")
      .attr("xlink:href", "#sphere");

  svg.append("path")    // use path generator to draw a graticule
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

  loadData();  

}

function loadData() {

  queue()   // queue function  to load data files 
    .defer(d3.json, "https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/world.geojson")  // load the map data
    .defer(d3.csv, "https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/totalCases.csv")  // load csv file
    .defer(d3.csv,"https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/deaths.csv")
    .defer(d3.csv,"https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/New_Cases.csv")
    .defer(d3.csv,"https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/totalCasesLine.csv",
    function(d){
      return { Date : d3.timeParse("%Y-%m-%d")(d.Date), World : d.World }
    })
    .defer(d3.csv,"https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/NewCasesLine.csv")
    .defer(d3.csv,"https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/DeathsLines.csv")
    .await(processData);   // once all files are loaded, call the processData function, pass the loaded objects as arguments
}

function processData(error,world,countryData, deathData,newData, totalLine, NewLine, DeathLine) {
  // function accepts any errors from the queue function as first argument, then
  // each data object in the order of chained defer() methods above

  var countries = world.features;  // store the path in variable
  deathWrold = world;
  var countriesDeaths = deathWrold.features;
 
  for (var i in countries) {    // for each geometry object
    countryNames.push({
      Country_Name: countries[i].properties.name, 
      iso_code: countries[i].id
    })   
    for (var j in countryData) {  // for each row in the CSV
      if(countries[i].id == countryData[j].iso_code) {   // if they match
        for(var k in countryData[i]) {   // for each column in the a row within the CSV
          if(k != 'name' && k != 'iso_code') {  // let's not add the name or id as props since we already have them
            if(dateArray.indexOf(k) == -1) { 
              dateArray.push(k);  // add new column headings to our array for later
            }
            countries[i].properties[k] = Number(countryData[j][k])  // add each CSV column key/value to geometry object
          } 
        }
        break; 
      }
      
      
    }
  }
  for (var m in countriesDeaths) { 
    for (var n in deathData) { 
  if(countriesDeaths[m].id == deathData[n].iso_code) {   // if they match
    for(var l in deathData[m]) {   // for each column in the a row within the CSV
      if(l != 'name' && l != 'iso_code') {  // let's not add the name or id as props since we already have them
        if(deathDate.indexOf(l) == -1) { 
          deathDate.push(l);  // add new column headings to our array for later
        }
        countriesDeaths[m].properties[l] = Number(deathData[n][l])  // add each CSV column key/value to geometry object
      } 
    }
    break; 
  }}}
  totalCasesLines = totalLine,newCasesLines = NewLine,deathsLines = DeathLine;
  console.log(totalCasesLines)
  d3.select('#clock').html(dateArray[currentDate]);  // populate the clock with the date
  drawMap(world);  // let's mug the map now with our newly populated data object
  drawLine(totalLine);
}

function drawMap(world) {
    
    shapes = svg.selectAll(".country")   // select country objects (which don't exist yet)
      .data(world.features)  // bind data to these non-existent objects
      .enter().append("path") // prepare data to be appended to paths
      .attr("class", "country") // give them a class for styling and access later
      .attr("id", function(d) { 
        return "code_" + d.properties.id; }, true)  // give each a unique id for access later
      .attr("d", path) // create them using the svg path generator defined above
      .on("mouseover", function(d) {
        console.log(d.properties)
        d3.selectAll(".country")
            .transition()
              .duration(200)
              .attr("fill-opacity", 0.3)
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill-opacity", 1)
        tooltip.transition()
        .duration(250)
        .style("opacity", 1);
        tooltip.html(
        "<p><strong>" + d.properties.name+" " + mapColour + " to date: </strong></p> " +  d.properties[dateArray[currentDate]])
        .style("left", (d3.event.pageX + 15) + "px")
        .style("top", (d3.event.pageY - 28) + "px")})
      .on("mouseleave", function(d) {
        var dataRange = getDataRange(); // get the min/max values from the current year's range of data values
        d3.selectAll('.country')  // select all the countries
          .attr("fill-opacity", 1)
          .attr('fill', function(d) {
            return getColor(d.properties[dateArray[currentDate]], dataRange);  // give them an opacity value based on their current value
        });

        tooltip.transition()
        //.duration(250)
        .style("opacity", 0);
      })
      .on("click", function(d){console.log(d.properties[dateArray[currentDate]])});


    var dataRange = getDataRange(); // get the min/max values from the current year's range of data values
    d3.selectAll('.country')  // select all the countries
    .attr('fill-opacity',0.8)
    .attr('fill', function(d) {
        return getColor(d.properties[dateArray[currentDate]], dataRange);  // give them an opacity value based on their current value
    });
}

function drawLine(data) {
  
  // Add X axis --> it is a date format
  var x = d3.scaleTime()
    .domain(d3.extent(data, function(d) { return d.Date; }))
    .range([ 0, width ]);
    LineSvg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));
  
// Add Y axis
  var y = d3.scaleLinear()
    .domain([0, d3.max(data, function(d) { return +d.World; })])
    .range([ height, 0 ]);
    LineSvg.append("g")
    .call(d3.axisLeft(y));
// Add the line
LineSvg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d3.line()
      .x(function(d) { return x(d.Date) })
      .y(function(d) { return y(d.World) })
    )
    console.log(data)
};



function sequenceMap() {
  
    var dataRange = getDataRange(); // get the min/max values from the current year's range of data values
    d3.selectAll('.country').transition()  //select all the countries and prepare for a transition to new values
      .duration(750)  // give it a smooth time period for the transition
      .attr('fill', function(d) {
        return getColor(d.properties[dateArray[currentDate]], dataRange);  // the end color value
      })

}

function getColor(valueIn, valuesIn) {
  if(typeof valueIn == "undefined"){

    valueIn = 0
  };
  if(mapColour == "total cases"){
  var color = d3.scaleSqrt() // create a linear scale
    .domain([valuesIn[0],valuesIn[1]])  // input uses min and max values
    .range(d3.schemeReds[7]);//[.3,1]);   // output for opacity between .3 and 1 %
  } else if(mapColour == "deaths"){
    var color = d3.scaleSqrt() // create a linear scale
    .domain([valuesIn[0],valuesIn[1]])  // input uses min and max values
    .range(d3.schemeBlues[7]);//[.3,1]);   // output for opacity between .3 and 1 %
  };

  return color(valueIn);  // return that number to the caller
}

function getDataRange() {
  // function loops through all the data values from the current data attribute
  // and returns the min and max values

  var min = Infinity, max = -Infinity;  
  d3.selectAll('.country')
    .each(function(d,i) {
      var currentValue = d.properties[dateArray[currentDate]];
      if(currentValue <= min && currentValue != -99 && currentValue != 'undefined') {
        min = currentValue;
      }
      if(currentValue >= max && currentValue != -99 && currentValue != 'undefined') {
        max = currentValue;
      }
  });
  return [min,max];  
}

function animateMap() {
  sequenceMap();  // update the representation of the map 
  d3.select('#clock').html(dateArray[currentDate]);  // update the clock
}

window.onload = init();  
const zoom = d3.zoom()
    .scaleExtent([1, 24])
    .on("zoom", zoomed);

svg.call(zoom);

function zoomed() {
  svg
      .selectAll('path') // To prevent stroke width from scaling
      .attr('transform', d3.event.transform);
}

var slider = d3.select(".slider")
.append("input")
.attr("type", "range")
.attr("min", 0)
.attr("max", 1002)
.attr("step", 0)
.on("input", function() {
  currentDate = this.value;
  animateMap();
}); 

var changemap = d3.select('#Deaths')  
    .on('click', function() {
      mapColour = "deaths"
      drawMap(deathWrold);
      
    });

 

