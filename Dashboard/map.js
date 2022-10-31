/*
Sources used to assist with code:

Line Chart help:
https://d3-graph-gallery.com/graph/line_basic.html
https://www.d3-graph-gallery.com/graph/line_cursor.html 
http://bl.ocks.org/lamchau/405f2d69fb3c80ad724a
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

const colors = ["palegreen","springgreen","mediumspringgreen","greenyellow","lawngreen","limegreen","forestgreen","green","darkgreen"];
const ranges = ["0 - 500","501 - 1000","1001 - 5000","5001 - 10000","10000 - 50000","50001 - 100000","100001 - 5000000","5000001 - 10000000","10000001 - 50000000"];
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

  width = 800, height = 460;  

  projection = d3.geoMercator()   // define the projection 
    .scale(100)
    .translate([width /2.5, height / 2])
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
  barCases(countries);
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

    svg.append('rect').attr("x", width * 0.8)
    .attr("y", height * 0.03)
    .attr("width", 200)
    .attr("height", height * 0.5)
    .attr("class", function(d){ return "Legend_cases" } )
    .attr("style", "outline: thin solid black")
    .style("visibility", "visible")
    .style("fill", "#878787")

    for (var i = 0; i < 9; i++) {
    svg.append('rect').attr("x", width * 0.97)
    .attr("y", height * 0.01 * (i * 5) + (height * 0.085))
    .attr("width", width * 0.02)
    .attr("class", function(d){ return "Legend_cases" } )
    .style("visibility", "visible")
    .attr("height", height * 0.04)
    .style("fill", colors[i])

    svg.append('text').attr("x", width * 0.801)
      .attr("y", height * 0.04 * (i*1.25) + (height * 0.118))
      .attr("width", width * 0.03)
      .attr("height", height * 0.05)
      .attr("class", function(d){ return "Legend_cases" } )
      .style("visibility", "visible")
      .text(ranges[i])
      .style("font-size", "14px")
      .style("fill", "#ffffff")  
    }

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
Bar Graph - Michael
##########################################*/

function barCases(baseData){
  const data = []
    for(var m in baseData){
      // if(m < 10){
        if(typeof baseData[m].properties[dateArray[currentDate]] == 'undefined'){
          baseData[m].properties[dateArray[currentDate]] = 0
        }
        tempData = {name: baseData[m].properties["name"], score: baseData[m].properties[dateArray[currentDate]]}
        data.push(tempData)
      // }
    }

  scores = []
  for(var i in data){
      scores.push(data[i].score)
  }
  maxScore = d3.max(scores)
  
  width = 800
  nbars = data.length
  margin = ({top: 50, right: 20, bottom: 70, left: 250})
  height = (nbars * 28) + margin.top
  range = d3.range(28, (nbars+1) * 28, 28)
  // colors = ["#596F7E", "#168B98", "#ED5B67", "#fd8f24","#919c4c"]
  bigFormat = d3.format(",.0f")
  arc = (r, sign) => r ? `a${r * sign[0]},${r * sign[1]} 0 0 1 ${r * sign[2]},${r * sign[3]}` : ""
  data.sort((a, b) => d3.descending(a.score, b.score))
  
  scaleY = d3.scaleOrdinal()
        .domain(data.map(d => d.name))
        .range(range);
  
  // console.log(data[0].score)
  
  scaleX = d3.scaleLinear()
      .domain([0, maxScore])
      .range([margin.left, width - margin.right]);
  
  // colorScale = d3.scaleOrdinal()
  //     .domain(d3.map(freedom_year, d => d.region_simple).keys())
  //     .range(colors);
  
  xAxis = g => g
      .attr("transform", `translate(0, ${margin.top})`)
      .call(d3.axisTop(scaleX).tickSizeOuter(0).ticks(3))
      .call(g => g.select(".domain").remove());
  
  yAxis = g => g
      .attr("transform", `translate(${margin.left}, ${margin.top - 15})`)
      .call(d3.axisLeft(scaleY).tickSizeOuter(0))
      .call(g => g.select(".domain").remove());
  
  
  
  function roundedRect(x, y, width, height, r) {
      r = [Math.min(r[0], height, width),
          Math.min(r[1], height, width),
          Math.min(r[2], height, width),
          Math.min(r[3], height, width)];
  
      return `M${x + r[0]},${y
      }h${width - r[0] - r[1]}${arc(r[1], [1, 1, 1, 1])
      }v${height - r[1] - r[2]}${arc(r[2], [1, 1, -1, 1])
      }h${-width + r[2] + r[3]}${arc(r[3], [1, 1, -1, -1])
      }v${-height + r[3] + r[0]}${arc(r[0], [1, 1, 1, -1])
      }z`;
  }
  
  
  function make_x_gridlines() {		
      return d3.axisBottom(scaleX)
          .ticks(3)
  };
  
  
  const svg = d3.select("#barCases").append("svg")
      .attr("width", width)
      .attr("height", height);
    
  svg
      .append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("fill", "#ccc");
  
  const barwidth = 25
  const corner = Math.floor((barwidth/2) + 5)
  //bars
  svg.append("g")
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("fill", "#596F7E")
      .attr("d", (d, i) => roundedRect(
      scaleX(0),
      (i * 28) + margin.top,
      1,
      barwidth,
      [0, 0, corner, 0]
      ))
      .transition().duration(1000)
      .attr("d", (d, i) => roundedRect(
      scaleX(0),
      (i * 28) + margin.top,
      scaleX(d.score) - scaleX(0),
      barwidth,
      [0, 0, corner, 0]
      ));
  
  //x axis
  svg.append("g")
      .call(xAxis)
      .style("font-size", "14px");
  //y axis
  svg.append("g")
      .call(yAxis)
      .style("font-size", "14px");
  
  svg.append("g")			
      .attr("class", "grid")
      .attr("transform", "translate(0," + (height - margin.bottom) + ")")
      .attr("stroke-opacity", 0.1)
      .call(make_x_gridlines()
          .tickSize(-height+margin.top+margin.bottom)
          .tickFormat("")
      )
  
  svg.append("line")
  .attr("x1", margin.left)
  .attr("x2", margin.left)
  .attr("y1", margin.top - 6)
  .attr("y2", height)
  .attr("stroke-width", "2px")
  .style("stroke", "black")
  .style("opacity", 1);
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

      var text = LineSvg
                .append('g')
                .append('text')
                .style("opacity", 1)
                .style("font-size", "14px")
                .style("stroke", "black")

            var mouseSVG = LineSvg.append("g")


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
                  mouseSVG.selectAll("path")
                    .style("opacity",1)
                  text
                    .style("opacity", 1);
              })
              .on('mousemove', function() { //for when the mouse moves
                var xpos = x.invert(d3.mouse(mouseSVG.node())[0]);
                var ypos = y.invert(d3.mouse(mouseSVG.node())[1]);

                //Drawing the actual dashed lines based off where the mouse is positioned
                var mouse = d3.mouse(this);
                d3.select("#verticalPosition")
                    .attr("d", function () { 
                        var d = "M" + mouse[0] + "," + lineHeight;
                        d += " " + mouse[0] + "," + 0;
                        return d;
                    })

                d3.select("#horizontalPosition")
                    .attr("d", function () { 
                        var d = "M" + lineWidth + "," + mouse[1];
                        d += " " + 0 + "," + mouse[1];
                        return d;
                    })

                text
                    .html(xpos.toDateString() + " : " + Math.round(ypos).toLocaleString())
                    .attr("x", x(xpos) + 5)
                    .attr("y", y(ypos) - 10)
            })
                .on('mouseout', function() { //remove everything when the mouse isn't on the line graph
                    mouseSVG.selectAll("path")
                        .style("opacity", 0);
                    text
                    .style("opacity", 0);
                    
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

