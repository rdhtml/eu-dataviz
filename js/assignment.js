var margin = {left:60, right:200, top:50, bottom:150};

var width = 800 - margin.left - margin.right;
var height = 575 - margin.top - margin.bottom;

var tooltip = { width: 100, height: 100, x: 10, y: -30 };

var g = d3.select("#chart-area").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate("+  margin.left +" ,"+ margin.top +")");

var time = 0;
var interval;
var formattedData;

var tip = d3.tip().attr("class", "d3-tip")
    .html( function(d) {
        var text = "<p><strong>Council: </strong> <span style='color: red'>" + d.council + "</span></p>";
        text += "<p><strong>Complaints: </strong> <span style='color: red; text-transform: capitalize'>" + d.complaints + "</span></p>";
        text += "<p><strong>Complaints per 1000: </strong> <span style='color: red'>" + d.complaints_per_1000 + "</span></p>";
        text += "<p><strong>Formal action cases: </strong> <span style='color: red'>" + d.formal_action_cases + "</span></p>";
        text += "<p><strong>Population: </strong> <span style='color: red'>" + d3.format(',.0f')(d.population) + "</span></p>";
        return text;
    });
g.call(tip);

var x = d3.scaleLinear()
    .range([0,width])
    .domain([1996, 2008]);

var y = d3.scaleLinear()
    .range([height, 0])
    .domain([0,12000]);

var councilColour = d3.scaleOrdinal(d3.schemeCategory10);

g.append("text")
    .attr("class", "x axis-label")
    .attr("y", height + 50)
    .attr("x", width / 2)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Year");

g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("class", "y axis-label")
    .attr("x", -160)
    .attr("y", -45)
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .text("Complaints Received");

var xAxisCall = d3.axisBottom(x)
    .tickValues([0, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008])
    .tickFormat(d3.format(""));
g.append("g")
    .attr("class", "x-axis")
    .attr("transform","translate(0, " + height + ")")
    .call(xAxisCall);

var yAxisCall = d3.axisLeft(y)
    .tickFormat(function(d) {
        return +d;
    });
g.append("g")
    .attr("class", "y-axis")
    .call(yAxisCall);

var councils = ["Aberdeen City", "Aberdeenshire", "Angus", "Argyll and Bute", "City of Edinburgh", "Clackmannanshire", "Dumfries and Galloway", "Dundee City",
    "East Ayrshire", "East Dunbartonshire", "East Lothian", "East Renfrewshire", "Falkirk", "Fife", "Glasgow City", "Highland", "Inverclyde", "Midlothian",
    "Moray", "North Ayrshire", "North Lanarkshire", "Orkney Islands", "Perth and Kinross", "Renfrewshire", "Scottish Borders", "Shetland Islands", "South Ayrshire",
    "South Lanarkshire", "Stirling", "West Dunbartonshire", "West Lothian"];

var legend = g.append("g")
    .attr("class", "council-legend-container")
    .attr("transform", "translate(" + (width + margin.right - 20) + ",-50)");

councils.forEach(function (council, i) {

    var legendRow = legend.append("g")
        .attr("transform", "translate(0," + (i * 15) + ")");

    legendRow.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", councilColour(council));

    legendRow.append("text")
        .attr("x", -10)
        .attr("y", 10)
        .attr("class", "council-legend")
        .attr("text-anchor", "end")
        .style("text-transform", "capitalize")
        .style("font-size", "0.8em")
        .style("color","#ddd")
        .text(council);

});

d3.json("/data/noise-complaints.json").then(function(data){

    // Clean data
    formattedData = data.map(function(year){

        return year["councils"].filter(function(council){
            var dataExists = (council.complaints && council.complaints_per_1000 && council.population);
            return dataExists
        }).map(function(council){
            council.complaints = +council.complaints;
            council.complaints_per_1000 = +council.complaints_per_1000;
            council.population = +council.population;
            council.year = +council.year;
            return council;
        })

    });

    //First run of the visualization
    update(formattedData[0]);

});

$("#play-button").on('click', function () {

    var button = $(this);

    if(button.text() === "Play"){
        button.text("Pause");
        interval = setInterval(step,500);
    } else {
        button.text("Play");
        clearInterval(interval);
    }

});

$("#reset-button").on('click', function () {
    time = 0
    update(formattedData[0]);
});

$("#council-select").on("change", function () {
    update(formattedData[time])
});

$("#date-slider").slider({
    max: 2008,
    min: 1997,
    step: 1,
    slide: function(event, ui) {
        time = ui.value - 1997;
        update(formattedData[time]);
    }
});

function step() {
    time = (time < 12) ? time+1 : 0;
    update(formattedData[time]);
}

function update(data) {

    // Standard transition time for the visualization
    var t = d3.transition().duration(200);

    var council = $("#council-select").val();
    data = data.filter(function (d) {

        if(council === "all") {
            return true;
        } else {
            return d.council == council;
        }
    });

    // JOIN new data with old elements.
    var circles = g.selectAll("circle").data(data, function(d){
        return d.council;
    });

    // EXIT old elements not present in new data.
    circles.exit()
        .attr("class", "exit")
        .remove();

    // ENTER new elements present in new data.
    circles.enter()
        .append("circle")
        .attr("class", "enter")
        .attr("fill", function(d) { return councilColour(d.council); })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        .merge(circles)
        .transition(t)
        .attr("cy", function(d){  return y(d.complaints); })
        .attr("cx", function(d){ return x(d.year) })
        .attr("r", function(d){ return d.population/20000;  });

    $(".x-axis .tick text").removeAttr('style');
    $(".council-legend").removeAttr('style');
    if(parseInt($(".x-axis .tick:nth-child(" + parseInt(time+3) + ") text").text()) === time + 1997) {
        $(".x-axis .tick:nth-child(" + parseInt(time+3) + ") text").css({"font-weight":"bold", "font-size":"1.25em"});
    }


    $(".x-axis .tick text").filter(function() {
        return $(this).first().text() === time + 1997;
    }).css("font-weight", "bold");

    $(".council-legend").filter(function() {
        return $(this).text() === council;
    }).css({'font-weight':'bold','font-size':'1.05em'});


    $("#year").text(+(time + 1997));

    $("#date-slider").slider("value", +(time + 1997));
}
