/*
Sources used to assist with code:

https://d3-graph-gallery.com/graph/line_basic.html

*/

//Global variables
var width, height, projection, path, graticule, svg, dateArray = [],deathDate = [], newCaseDate=[],currentDate = 0, playing = false;
var countryNames = [];
var shapes;
var deathWorld,newCaseWorld,World;
var currentLineData;
var mapColour = "total cases";
var totalCasesLines,newCasesLines,deathsLines;

var currentArray;
//Setup the Line SVG

// set the dimensions and margins of the graph
var lineMargin = {top: 10, right: 30, bottom: 30, left: 80},
    lineWidth = 1850 - lineMargin.left - lineMargin.right,
    lineHeight = 400 - lineMargin.top - lineMargin.bottom;

// append the svg object to the body of the page
var LineSvg = d3.select("#line")
  .append("svg")
    .attr("width", lineWidth + lineMargin.left + lineMargin.right)
    .attr("height", lineHeight + lineMargin.top + lineMargin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + lineMargin.left + "," + lineMargin.top + ")");



//Tooltip for hovering in the map
tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

function init() {

  setMap();
  animateMap();

}

function setMap() { //Setitng up the map layout

  width = 700, height = 460;  

  projection = d3.geoMercator()   // define the projection 
    .scale(100)
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
    .defer(d3.csv, "https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/totalCasesv3.csv")  // load csv file
    .defer(d3.csv,"https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/deathsv3.csv")
    .defer(d3.csv,"https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/New_Casesv3.csv")
    .defer(d3.csv,"https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/totalCasesLinev2.csv")
    .defer(d3.csv,"https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/New_CasesLinesv2.csv")
    .defer(d3.csv,"https://raw.githubusercontent.com/Hodginson/SWEN422_A3/main/deathsLinev2.csv")
    .await(processData);   // once all files are loaded, call the processData function, pass the loaded objects as arguments
}

function processData(error,world,countryData, deathData,newCaseData, totalLine, NewLine, DeathLine) {
  // function accepts any errors from the queue function as first argument, then each dataset in the order called above
  World=JSON.parse(JSON.stringify(world)); //we need to vcreate deep copies here so that we get unique records for each data source
  deathWorld = JSON.parse(JSON.stringify(world));
  newCaseWorld = JSON.parse(JSON.stringify(world));
 
  var countries = World.features;  // store the path in variable
  var countriesDeaths = deathWorld.features;
  var countriesNewCases = newCaseWorld.features;

 
 
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
  }}}
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

  for (var q in countriesNewCases) { 
    for (var r in newCaseData) { 
      if(countriesNewCases[q].id == newCaseData[r].iso_code) {   // if they match
        for(var s in newCaseData[q]) {   // for each column in the a row within the CSV
          if(s != 'name' && s != 'iso_code') {  // let's not add the name or id as props since we already have them
            if(newCaseDate.indexOf(s) == -1) { 
              newCaseDate.push(s);  // add new column headings to our array for later
            }
            countriesNewCases[q].properties[s] = Number(newCaseData[r][s])  // add each CSV column key/value to geometry object
          } 
        }
      break; 
  }}}

  totalCasesLines = totalLine,newCasesLines = NewLine,deathsLines = DeathLine;
  currentLineData = totalCasesLines;
  d3.select('#clock').html(dateArray[currentDate]);  // populate the clock with the date
  drawMap(World);  // let's mug the map now with our newly populated data object
  drawLine(currentLineData,"World");
  console.log(World)
  console.log(countries) 
  var slider = d3.select(".slider")
  .append("input")
  .attr("type", "range")
  .attr("min", 0)
  .attr("max", dateArray.length-1)
  .attr("step", 0)
  .on("input", function() {
    currentDate = this.value;
    animateMap();
  }); 

}

/*##########################################
Map - Zane
##########################################*/

function drawMap(world) {
    
    shapes = svg.selectAll(".country")   // select country objects (which don't exist yet)
      .data(world.features)  // bind data to these non-existent objects
      .enter().append("path") // prepare data to be appended to paths
      .attr("class", "country") // give them a class for styling and access later
      .attr("id", function(d) { 
        return "code_" + d.properties.id; }, true)  // give each a unique id for access later
      .attr("d", path) // create them using the svg path generator defined above
      .on("mouseover", function(d) {
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
      .on("click", function(d){
        var filter;
        for(i in countryNames){
          if(countryNames[i].Country_Name == d.properties.name){
            filter = countryNames[i].iso_code;
            break;
          }
        };
        console.log(filter)
        LineSvg.selectAll("path").remove();
        LineSvg.selectAll("g").remove();
        drawLine(currentLineData,filter);
      });


    var dataRange = getDataRange(); // get the min/max values from the current year's range of data values
    d3.selectAll('.country')  // select all the countries
    .attr('fill-opacity',0.8)
    .attr('fill', function(d) {
        return getColor(d.properties[dateArray[currentDate]], dataRange);  // give them an opacity value based on their current value
    });
}





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
    .domain([500,1000,5000,10000,50000,100000,5000000,10000000,50000000])  // input uses min and max values
    .range(["palegreen","springgreen","mediumspringgreen","greenyellow","lawngreen","limegreen","forestgreen","green","darkgreen"]);
  } else if(mapColour == "deaths"){
    var color = d3.scaleSqrt() // create a linear scale
    .domain([20,100,250,1000,5000,1000,50000,100000,500000])  // input uses min and max values
    .range(["pink","lightpink","palevioletred","salmon","indianred","tomato","orangered","crimson","firebrick"]);
  } else if(mapColour == "new cases"){
    var color = d3.scaleThreshold() // create a linear scale
    .domain([20,100,500,5000,10000,50000,250000,500000,1000000])  // input uses min and max values
    .range(["powderblue","skyblue","lightskyblue","cornflowerblue","dodgerblue","steelblue","royalblue","mediumblue","midnightblue"]);
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
    .scaleExtent([1, 5])
    .on("zoom", zoomed);

svg.call(zoom);

function zoomed() {
  svg
      .selectAll('path') // make sure that the stroke width doesn't scale
      .attr('transform', d3.event.transform);
}


/*##########################################
Line Graph
##########################################*/
    function drawLine(data,filter) {
      console.log(filter)
      // Add X axis --> it is a date format
      var x = d3.scaleTime()
        .domain(d3.extent(data, function(d) { return d3.timeParse("%d/%m/%Y")(d.Date); }))
        .range([ 0, lineWidth ]);
        LineSvg.append("g")
        .attr("transform", "translate(0," + lineHeight + ")")
        .call(d3.axisBottom(x).ticks(20));
      
    // Add Y axis
      var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return +d[filter]; })])
        .range([ lineHeight, 0 ]);
        LineSvg.append("g")
        .call(d3.axisLeft(y));
    // Add the line
    LineSvg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(function(d) { return x(d3.timeParse("%d/%m/%Y")(d.Date)) })
          .y(function(d) { return y(d[filter]) })
        )

        var focusText = LineSvg
                .append('g')
                .append('text')
                .style("opacity", 1)
                .attr("text-anchor", "left")
                .attr("alignment-baseline", "middle")
                .style("font-size", "14px")
                .style("stroke", "black")

            var mouseSVG = LineSvg.append("g")
                .attr("class", "mouse-over-effects");

            mouseSVG.append("path")
            .attr("id", "verticalPosition") //Vertical dashed line
            .style("stroke", "black")
            .style("stroke-width", "1.5px")
            .style("stroke-dasharray", "10,10")


            mouseSVG.append("path")
                .attr("id", "horizontalPosition") //Horizontal dashed line
                .style("stroke", "black")
                .style("stroke-width", "1.5px")
                .style("stroke-dasharray", "10,10")

                mouseSVG.append('svg:rect') //create a rect to record mouse movements
                .attr('width', lineWidth) 
                .attr('height', lineHeight)
                .attr('fill', 'none')
                .attr('pointer-events', 'all')
                .on('mouseover', function() { //display the position and values when on the graph
                  d3.select("#verticalPosition")
                      .style("opacity", 1);
                  d3.select("#horizontalPosition")
                      .style("opacity", 1);
                  focusText.style("opacity", 1)
              })
              .on('mousemove', function() { //Mouse moving over canvas
                var xpos = x.invert(d3.mouse(mouseSVG.node())[0]);
                var ypos = y.invert(d3.mouse(mouseSVG.node())[1]);

                //Drawing the cross hair lines
                var mouse = d3.mouse(this);
                d3.select("#verticalPosition")
                    .attr("d", function () { //This draws the path for the vertical line
                        var d = "M" + mouse[0] + "," + lineHeight;
                        d += " " + mouse[0] + "," + 0;
                        return d;
                    })
                    .style("display", "block");

                d3.select("#horizontalPosition")
                    .attr("d", function () { //This draws the path for the horizontal line
                        var d = "M" + lineWidth + "," + mouse[1];
                        d += " " + 0 + "," + mouse[1];
                        return d;
                    })
                    .style("display", "block");

                focusText
                    .html(xpos.toDateString() + " : " + Math.round(ypos).toLocaleString())
                    .attr("x", x(xpos) + 5)
                    .attr("y", y(ypos) - 10)
            })
                .on('mouseout', function() { //remove everything when the mouse isn't on the line graph
                    d3.select("#verticalPosition")
                        .style("opacity", 0);
                    d3.select("#horizontalPosition")
                        .style("opacity", 0);
                    focusText.style("opacity", 0)
                });
    };

    

    /*##########################################
    Buttons
    ##########################################*/

    var deathButton = d3.select('#Deaths')  
    .on('click', function() {
      mapColour = "deaths"
      currentLineData = deathsLines;
      LineSvg.selectAll("path").remove();
      LineSvg.selectAll("g").remove();
      drawMap(deathWorld);
      drawLine(currentLineData,"World")
    });



    var newCasesButton = d3.select('#New')  
    .on('click', function() {
      mapColour = "new cases"
      currentLineData = newCasesLines;
      LineSvg.selectAll("path").remove();
      LineSvg.selectAll("g").remove();
      drawMap(newCaseWorld);
      drawLine(currentLineData,"World")
    });

    var totalCasesButton = d3.select('#Total')  
    .on('click', function() {
      mapColour = "total cases"
      LineSvg.selectAll("path").remove();
      LineSvg.selectAll("g").remove();
      drawMap(World);
      drawLine(totalCasesLines,"World")
    });

