
var margin = { left:80, right:100, top:50, bottom:100 },
    height = 500 - margin.top - margin.bottom,
    width = 800 - margin.left - margin.right;

var svg = d3.select("#chart-area").append("svg")
    .attr("width", width + (margin.left * 2) + (margin.right * 2))
    .attr("height", height + margin.top + margin.bottom);

var g = svg.append("g")
    .attr("transform", "translate(" + margin.left +
        ", " + margin.top + ")");

var t = function(){ return d3.transition().duration(1000); }

var time = 0;

var interval;

var filteredData;

// For tooltip
var bisectDate = d3.bisector(function(d) { return d.year; }).left;

// Add the line for the first time
g.append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "grey")
    .attr("stroke-width", "3px");

// Labels
var xLabel = g.append("text")
    .attr("class", "x axisLabel")
    .attr("y", height + 50)
    .attr("x", width / 2)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Year");

var yLabel = g.append("text")
    .attr("class", "y axisLabel")
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .attr("x", -170)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Complaints");

// Scales
var x = d3.scaleTime().range([0, width]);

var y = d3.scaleLinear().range([height, 0]);

// Axis generators
var xAxisCall = d3.axisBottom()
    .tickFormat(d3.format(""));

var yAxisCall = d3.axisLeft();

// Axis groups
var xAxis = g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")");

var yAxis = g.append("g")
    .attr("class", "y axis")

// Event listeners
$("#council-select").on("change", update)

// Add jQuery UI slider
$("#date-slider").slider({
    range: true,
    max: 2008,
    min: 1997,
    step: 1, // One year
    values: [1997, 2008],
    slide: function(event, ui){
        $("#dateLabel1").text(ui.values[0]);
        $("#dateLabel2").text(ui.values[1]);
        update();
    }
});

d3.json("../data/noise-complaints-line.json").then(function(data) {


    console.log(data);

    // Prepare and clean data
   filteredData = {};
    for (var council in data) {
        if (!data.hasOwnProperty(council)) {
            continue;
        }
        filteredData[council] = data[council].filter(function(d){
            return !(d["complaints"] == null)
        })
        filteredData[council].forEach(function(d){
            d["complaints"] = +d["complaints"];
            d["complaints_per_1000"] = +d["complaints_per_1000"];
            d["formal_action_cases"] = +d["formal_action_cases"];
            d["population"] = d["population"];
            d["year"] = d["year"];
        });
    }

    //console.log('FD');
    //console.log(filteredData);

    update();

});

function update() {

    // Filter data based on selections
    var council = $("#council-select").val();

    console.log('FD');
    console.log(council);
    console.log(filteredData);

    var sliderLowerYear =  parseInt($("#dateLabel1").text());
    var sliderUpperYear =  parseInt($("#dateLabel2").text());

    var dataTimeFiltered = filteredData[council].filter(function(d){
        return ((d.year >= sliderLowerYear) && (d.year <= sliderUpperYear))
    });

    // Update scales
    x.domain(d3.extent(dataTimeFiltered, function(d){ return d.year; }));
    y.domain([d3.min(dataTimeFiltered, function(d){ return d.complaints; }) / 1.005,
        d3.max(dataTimeFiltered, function(d){ return d.complaints; }) * 1.005]);

    // Update axes
    xAxisCall.scale(x);
    xAxis.transition(t()).call(xAxisCall);
    yAxisCall.scale(y);
    yAxis.transition(t()).call(yAxisCall);

    // Clear old tooltips
    d3.select(".focus").remove();
    d3.select(".overlay").remove();

    // Tooltip code
    var focus = g.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("line")
        .attr("class", "x-hover-line hover-line")
        .attr("y1", 0)
        .attr("y2", height);

    focus.append("line")
        .attr("class", "y-hover-line hover-line")
        .attr("x1", 0)
        .attr("x2", width);

    focus.append("circle")
        .attr("r", 5);

    focus.append("rect")
        .attr("class", "tooltip")
        .attr("width", 220)
        .attr("height", 75)
        .attr("x", 10)
        .attr("y", -22)
        .attr("rx", 4)
        .attr("ry", 4);

    focus.append("text")
        .attr("class", "tooltip-complaints")
        .attr("x", 18)
        .attr("y", -2)
        .text("Complaints: ");

    focus.append("text")
        .attr("class", "tooltip-complaints-num")
        .attr("x", 110)
        .attr("y", -2);

    focus.append("text")
        .attr("class", "tooltip-complaints-per-1000")
        .attr("x", 18)
        .attr("y", 18)
        .text("Complaints per 1000: ");

    focus.append("text")
        .attr("class", "tooltip-complaints-per-1000-num")
        .attr("x", 180)
        .attr("y", 18);

    focus.append("text")
        .attr("class", "tooltip-population")
        .attr("x", 18)
        .attr("y", 38)
        .text("Population: ");

    focus.append("text")
        .attr("class", "tooltip-population-num")
        .attr("x", 105)
        .attr("y", 38);

    svg.append("rect")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove)

    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(dataTimeFiltered, x0, 1),
            d0 = dataTimeFiltered[i - 1],
            d1 = dataTimeFiltered[i],
            d = (d1 && d0) ? (x0 - d0.year > d1.year - x0 ? d1 : d0) : 0;
        focus.attr("transform", "translate(" + x(d.year) + "," + y(d.complaints) + ")");
        focus.select(".tooltip-complaints-num").text(d.complaints);
        focus.select(".tooltip-complaints-per-1000-num").html(d.complaints_per_1000);
        focus.select(".tooltip-population-num").text(d.population);
        focus.select(".x-hover-line").attr("y2", height - y(d.complaints));
        focus.select(".y-hover-line").attr("x2", -x(d.year));
    }

    // Path generator
    line = d3.line()
        .x(function(d){ return x(d.year); })
        .y(function(d){ return y(d.complaints); });

    // Update our line path
    g.select(".line")
        .transition(t)
        .attr("d", line(dataTimeFiltered));

}


