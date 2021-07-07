function createNetwork(svg, data, day) {
    febTimestamp = 1264982400000;
    inizioMar = 1267401600000;
    inizioApr = 1270080000000;
    inizioMag= 1272672000000;
    inizioDic = 1291161600000;
    inizioNov = 1288569600000;
    inizioOtt = 1285891200000;
    if (typeof d3v4 == 'undefined')
    d3v4 = d3;
    var svg = d3v4.select('#network')

    // remove any previous graphs
    svg.selectAll('.g-main').remove();
    var set = '{"nodes":[],"links":[]}';
    set = JSON.parse(set);
    var selectedDate = new Date(day)
    var selectedDay = selectedDate.getDay()
    var selectedMonth = selectedDate.getMonth()
    for (let j = 0; j < data.length; j++) {
        var currentDay = new Date (data[j].block_timestamp).getDay()
        var currentMonth = new Date (data[j].block_timestamp).getMonth()

        if(currentMonth == selectedMonth && currentDay == selectedDay){
        for (let k = 0; k < data[j].outputs.length; k++) {
            if(set.nodes.filter(x => x.id === data[j].outputs[k].addresses[0]).length == 0)
                set.nodes.push({'id': data[j].outputs[k].addresses[0], 'group': 5});   
        }
        for (let i = 0; i < data[j].inputs.length; i++) {
            if(set.nodes.filter(x => x.id === data[j].inputs[i].addresses[0]).length == 0)
                set.nodes.push({'id': data[j].inputs[i].addresses[0], 'group': 5});
            for (let k = 0; k < data[j].outputs.length; k++) {
                    set.links.push({"source": data[j].inputs[i].addresses[0], "target": data[j].outputs[k].addresses[0], "value": 1});
            }    
        }
    }

    }

    console.log("nodi-network:" + set.nodes.length)
    // function createForceNetwork(nodes, edges) {

    //     //create a network from an edgelist
    //     var node_data = nodes.map(function (d) {return d.id });
    //     var edge_data = edges.map(function (d) {return [d.source.id, d.target.id]; });
    //     G = new jsnx.Graph();
    //     G.addNodesFrom(node_data);
    //     G.addEdgesFrom(edge_data);
    //     setCentrality("bw");
    // }

var svg = d3v4.select('#network')

// remove any previous graphs
svg.selectAll('.g-main').remove();

var gMain = svg.append('g')
.classed('g-main', true);

var rect = gMain.append('rect')
.attr('width', parseInt(d3.select('#network').style('width'), 10))
.attr('height', parseInt(d3.select('#network').style('height'), 10))
.style('fill', '#343a40')

var gDraw = gMain.append('g');

var zoom = d3v4.zoom()
.on('zoom', zoomed)

//gMain.call(zoom);
//initial zoom !!!
gMain.call(zoom) 
.call(zoom.transform, d3.zoomIdentity.translate(100, 50).scale(0.5))
.append("svg:g")
.attr("transform","translate(100,50) scale(.5,.5)");



function zoomed() {
    gDraw.attr('transform', d3v4.event.transform);
}

var color = d3v4.scaleOrdinal(d3v4.schemeCategory20);

if (! ("links" in set)) {
    console.log("Graph is missing links");
    return;
}

// the brush needs to go before the nodes so that it doesn't
// get called when the mouse is over a node
var gBrushHolder = gDraw.append('g');
var gBrush = null;

var link = gDraw.append("g")
    .attr("class", "link")
    .selectAll("line")
    .data(set.links)
    .enter().append("line")
    .style("stroke-width", "1px")
    //.style("stroke", "#CC9999")
    .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

var node = gDraw.append("g")
    .attr("class", "node")
    .selectAll("circle")
    .data(set.nodes)
    .enter().append("circle")
    .attr("r", 5)
    .attr("fill", function(d) { 
        if ('color' in d)
            return d.color;
        else
            return color(d.group); 
    })
    .on('click', function(d) {
        filterTransactions(d.id)
        node.style("opacity", function(o) {
            return neighboring(d.id, o) ? 1 : 0.3;
          });
        link.style('opacity', function (l) {
            return l.target == d || l.source == d ? 1 : 0.3;
        })

      })
      .on("mouseover", function(d) {
        
        d3v4.select(this).transition()
        .duration(750)
        .attr("r", 10);    
    })
    .on("mouseout", function(d) {
        d3v4.select(this).transition()
        .duration(750)
        .attr("r", 5);        
    })
    .call(d3v4.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

  
// Make object of all neighboring nodes.
  var linkedByIndex = {};
  set.links.forEach(function(d) {
	  linkedByIndex[d.source + ',' + d.target] = 1;
	  linkedByIndex[d.target + ',' + d.source] = 1;
  });

  // A function to test if two nodes are neighboring.
  function neighboring(a, b) {
	  return linkedByIndex[a + ',' + b.id] || a == b.id;
  }
    

// add titles for mouseover blurbs
node.append("title")
    .text(function(d) { 
        if ('name' in d)
            return d.name;
        else
            return d.id; 
    });


var simulation = d3v4.forceSimulation()
    .force("link", d3v4.forceLink()
            .id(function(d) { return d.id; })
            .distance(function(d) { 
                return 30;
                //var dist = 20 / d.value;
                //console.log('dist:', dist);

                return dist; 
            })
          )
    .force("charge", d3v4.forceManyBody())
    .force("center", d3v4.forceCenter(parseInt(d3.select('#network').style('width'), 10) / 2, parseInt(d3.select('#network').style('height'), 10) / 2))
    .force("x", d3v4.forceX(parseInt(d3.select('#network').style('width'), 10)/2))
    .force("y", d3v4.forceY(parseInt(d3.select('#network').style('height'), 10)/2));

    

simulation
    .nodes(set.nodes)
    .on("tick", ticked);

simulation.force("link")
    .links(set.links);

function ticked() {
    // update node and line positions at every step of 
    // the force simulation
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
}

var brushMode = false;
var brushing = false;

var brush = d3v4.brush()
    .on("start", brushstarted)
    .on("brush", brushed)
    .on("end", brushended);

function brushstarted() {
    // keep track of whether we're actively brushing so that we
    // don't remove the brush on keyup in the middle of a selection
    brushing = true;

    node.each(function(d) { 
        d.previouslySelected = shiftKey && d.selected; 
    });
}

rect.on('click', () => {
    // Restore nodes and links to normal opacity.
    link.style('opacity', 1);
    node.style('opacity', 1);
    node.each(function(d) {
        d.selected = false;
        d.previouslySelected = false;
    });
    node.classed("selected", false);
});

function brushed() {
    if (!d3v4.event.sourceEvent) return;
    if (!d3v4.event.selection) return;

    var extent = d3v4.event.selection;

    node.classed("selected", function(d) {
        return d.selected = d.previouslySelected ^
        (extent[0][0] <= d.x && d.x < extent[1][0]
         && extent[0][1] <= d.y && d.y < extent[1][1]);
    });
}

function brushended() {
    if (!d3v4.event.sourceEvent) return;
    if (!d3v4.event.selection) return;
    if (!gBrush) return;

    gBrush.call(brush.move, null);

    if (!brushMode) {
        // the shift key has been release before we ended our brushing
        gBrush.remove();
        gBrush = null;
    }

    brushing = false;
}

d3v4.select('body').on('keydown', keydown);
d3v4.select('body').on('keyup', keyup);

var shiftKey;

function keydown() {
    shiftKey = d3v4.event.shiftKey;

    if (shiftKey) {
        // if we already have a brush, don't do anything
        if (gBrush)
            return;

        brushMode = true;

        if (!gBrush) {
            gBrush = gBrushHolder.append('g');
            gBrush.call(brush);
        }
    }
}

function keyup() {
    shiftKey = false;
    brushMode = false;

    if (!gBrush)
        return;

    if (!brushing) {
        // only remove the brush if we're not actively brushing
        // otherwise it'll be removed when the brushing ends
        gBrush.remove();
        gBrush = null;
    }
}

function dragstarted(d) {
  if (!d3v4.event.active) simulation.alphaTarget(0.9).restart();

    if (!d.selected && !shiftKey) {
        // if this node isn't selected, then we have to unselect every other node
        node.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; });
    }

    d3v4.select(this).classed("selected", function(p) { d.previouslySelected = d.selected; return d.selected = true; });

    node.filter(function(d) { return d.selected; })
    .each(function(d) { //d.fixed |= 2; 
      d.fx = d.x;
      d.fy = d.y;
    })

}

function dragged(d) {
  //d.fx = d3v4.event.x;
  //d.fy = d3v4.event.y;
        node.filter(function(d) { return d.selected; })
        .each(function(d) { 
            d.fx += d3v4.event.dx;
            d.fy += d3v4.event.dy;
        })
}

function dragended(d) {
  if (!d3v4.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
    node.filter(function(d) { return d.selected; })
    .each(function(d) { //d.fixed &= ~6; 
        d.fx = null;
        d.fy = null;
    })
}

    createForceNetwork(set.nodes, set.links);

return set;

}

function createSlider(month) {
    var svgSlider = d3.select("#slider")
    svgSlider.selectAll("*").remove();
    
    createNN("trans2010new", new Date(2010, month, 1))

    var formatDateIntoYear = d3.timeFormat("%d");
    var formatDate = d3.timeFormat("%d %b");

    var startDate = new Date(2010, month, 1);
    var endDate = new Date(2010, parseInt(month)+1, 0);

    var width = parseInt(d3.select('#slider').style('width'), 10)
    var height = parseInt(d3.select('#slider').style('height'), 10);
    
    var x = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, width -50])
        .clamp(true);

    var slider = svgSlider.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + 25 + "," + (height / 2) + ")");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { slider.interrupt(); })
            .on("start drag", function() { update(x.invert(d3.event.x)); }));

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 5 + ")")
        .selectAll("text")
        .data(x.ticks(10))
        .enter()
        .append("text")
        .attr("x", x)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function(d) { return formatDateIntoYear(d); });

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 5);

    var label = slider.append("text")  
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(formatDate(startDate))
        .attr("transform", "translate(0," + (-10) + ")")

    function update(h) {
        // update position and text of label according to slider scale
        handle.attr("cx", x(h));
        label
          .attr("x", x(h))
          .text(formatDate(h));
        createNN("trans2010new", h)
    }
}

function setCentrality(type) {
    if(type == 'bw'){
        var centrality = jsnx.betweennessCentrality(G);
    } else {
        var centrality = jsnx.eigenvectorCentrality(G);
    }

    var extent = d3v4.extent(d3v4.values(centrality._stringValues));
        
    var colorScale = d3v4.scaleLinear().domain([0,1]).range(["#ffff99", "#ff6600"]);
    var sizeScale = d3v4.scaleLinear().domain([0,1]).range([5,11]);
    
    sizeScale.domain(extent);
    colorScale.domain(extent);

    var svg = d3v4.select('#network')

    svg.selectAll("circle")
      .attr("r", function (d) {
          //console.log(G.degree(d.id))
          return sizeScale(centrality._stringValues[d.id])})

      .style("fill", function (d) {return colorScale(centrality._stringValues[d.id])})
      //.attr("r", 5)
}

function createNN(month, day){
    var svgNet = d3.select('#network');
    var svgGraph = d3.select('#transactionsGraph');

d3.json(month + '.json', function(error, data) {
    if (!error) {
        //console.log('graph', graph);
        createNetwork(svgNet, data, day);
        createTransactionsGraph(svgGraph, data, day)

    } else {
        console.error(error);
    }
});
}

function createTransactionsGraph(svg, data, day) {

    var set = '{"nodes":[],"links":[]}';

    set = JSON.parse(set);
    var selectedDate = new Date(day)
    var selectedDay = selectedDate.getDay()
    var selectedMonth = selectedDate.getMonth()
    for (let j = 0; j < data.length; j++) {
        var currentDay = new Date (data[j].block_timestamp).getDay()
        var currentMonth = new Date (data[j].block_timestamp).getMonth()

        if(currentMonth == selectedMonth && currentDay == selectedDay){

            set.nodes.push({"id": data[j].hash , "group": 1, "input_count": data[j].input_count, "output_count": data[j].output_count, "input_value": data[j].input_value, "output_value": data[j].output_value, "fee": data[j].fee});

            for (let i = 0; i < data[j].inputs.length; i++) {
        
                set.nodes.push({'id': data[j].hash + '-i' + data[j].inputs[i].index, 'name': data[j].inputs[i].addresses[0] , 'tx_hash':data[j].hash, 'group': 2});
        
                set.links.push({"source": data[j].hash , "target": data[j].hash + "-i" + data[j].inputs[i].index , "value": 1});

            }

            for (let k = 0; k < data[j].outputs.length; k++) {
        
                set.nodes.push({'id': data[j].hash + "-o" + data[j].outputs[k].index, 'name': data[j].outputs[k].addresses[0], 'tx_hash':data[j].hash, 'group': 5});
        
                set.links.push({"source": data[j].hash , "target": data[j].hash + "-o" + data[j].outputs[k].index , "value": 1}); 
            
            }
        }
    }
    
    console.log("nodi-txGraph:" + set.nodes.length)

    // if both d3v3 and d3v4 are loaded, we'll assume
    // that d3v4 is called d3v4, otherwise we'll assume
    // that d3v4 is the default (d3)
    if (typeof d3v4 == 'undefined')
        var d3v4 = d3;

    let parentWidth = d3v4.select('svg').node().parentNode.clientWidth;
    let parentHeight = d3v4.select('svg').node().parentNode.clientHeight;

    var svg = d3v4.select('#transactionsGraph')
  
    // remove any previous graphs
    svg.selectAll('.g-main').remove();

    var gMain = svg.append('g')
    .classed('g-main', true);

    var rect = gMain.append('rect')
    .attr('width', parseInt(d3.select('#transactionsGraph').style('width'), 10))
    .attr('height', parseInt(d3.select('#transactionsGraph').style('height'), 10))
    .style('fill', 'antiquewhite')

    var gDraw = gMain.append('g');

    var zoom = d3v4.zoom()
    .on('zoom', zoomed)

    //gMain.call(zoom).on("dblclick.zoom", null);
    gMain.call(zoom) 
    .call(zoom.transform, d3.zoomIdentity.translate(100, 50).scale(0.5))
    .append("svg:g")
    .attr("transform","translate(100,50) scale(.5,.5)");


    function zoomed() {
        gDraw.attr('transform', d3v4.event.transform);
    }

    var color = d3v4.scaleOrdinal(d3v4.schemeCategory20);

    if (! ("links" in set)) {
        console.log("Graph is missing links");
        return;
    }

    // the brush needs to go before the nodes so that it doesn't
    // get called when the mouse is over a node
    var gBrushHolder = gDraw.append('g');
    var gBrush = null;

    var link = gDraw.append("g")
        .attr("class", "link")
        .selectAll("line")
        .data(set.links)
        .enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

    var node = gDraw.append("g")
        .attr("class", "node")
        .selectAll("circle")
        .data(set.nodes)
        .enter().append("circle")

/*         .attr("r", function(d) { //max_inp:10=inp_value : r  max_inp=9699900000000
            if (d.group == 1)
                return 5 + ((15 * d.input_value)/9699900000000);
            else
                return 5; 
        }) */

        .attr("r", 5)
        .attr("fill", function(d) { 
            if ('color' in d)
                return d.color;
            else
                return color(d.group); 
        })
        .call(d3v4.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

      
    // add titles for mouseover blurbs
    node.append("title")
        .text(function(d) { 
            if ('name' in d)
                return d.name;
            else
                return d.id;       
        });

    svg.selectAll("circle").on('mouseover', function(d) {
        
        if ('name' in d) {
            svg.select('#text0')
            .text(d.name)
        }
        else {
            svg.select('#text0')
            .text(d.id)
        }
      });

    var simulation = d3v4.forceSimulation()
        .force("link", d3v4.forceLink()
                .id(function(d) { return d.id; })
                .distance(function(d) {
                    return 30;
                    //var dist = 20 / d.value;
                    //console.log('dist:', dist);

                    return dist; 
                })
              )
        .force("charge", d3v4.forceManyBody())
        .force("center", d3v4.forceCenter(parentWidth / 2, parentHeight / 2))
        .force("x", d3v4.forceX(parentWidth/2))
        .force("y", d3v4.forceY(parentHeight/2));

    simulation
        .nodes(set.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(set.links);

    function ticked() {
        // update node and line positions at every step of 
        // the force simulation
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    }

    var brushMode = false;
    var brushing = false;

    var brush = d3v4.brush()
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    function brushstarted() {
        // keep track of whether we're actively brushing so that we
        // don't remove the brush on keyup in the middle of a selection
        brushing = true;

        node.each(function(d) { 
            d.previouslySelected = shiftKey && d.selected; 
        });
    }

    rect.on('click', () => {
        node.each(function(d) {
            d.selected = false;
            d.previouslySelected = false;
        });
        node.classed("selected", false);
    });

    function brushed() {
        if (!d3v4.event.sourceEvent) return;
        if (!d3v4.event.selection) return;

        var extent = d3v4.event.selection;

        node.classed("selected", function(d) {
            return d.selected = d.previouslySelected ^
            (extent[0][0] <= d.x && d.x < extent[1][0]
             && extent[0][1] <= d.y && d.y < extent[1][1]);
        });
    }

    function brushended() {
        if (!d3v4.event.sourceEvent) return;
        if (!d3v4.event.selection) return;
        if (!gBrush) return;

        gBrush.call(brush.move, null);

        if (!brushMode) {
            // the shift key has been release before we ended our brushing
            gBrush.remove();
            gBrush = null;
        }

        brushing = false;
    }

    d3v4.select('body').on('keydown', keydown);
    d3v4.select('body').on('keyup', keyup);

    var shiftKey;

    function keydown() {
        shiftKey = d3v4.event.shiftKey;

        if (shiftKey) {
            // if we already have a brush, don't do anything
            if (gBrush)
                return;

            brushMode = true;

            if (!gBrush) {
                gBrush = gBrushHolder.append('g');
                gBrush.call(brush);
            }
        }
    }

    function keyup() {
        shiftKey = false;
        brushMode = false;

        
        if (!gBrush)
            return;

        if (!brushing) {
            // only remove the brush if we're not actively brushing
            // otherwise it'll be removed when the brushing ends
            gBrush.remove();
            gBrush = null;
        }
    }

    function dragstarted(d) {
      if (!d3v4.event.active) simulation.alphaTarget(0.9).restart();

        if (!d.selected && !shiftKey) {
            // if this node isn't selected, then we have to unselect every other node
            node.classed("selected", function(p) { return p.selected =  p.previouslySelected = false; });
        }

        d3v4.select(this).classed("selected", function(p) { d.previouslySelected = d.selected; return d.selected = true; });

        node.filter(function(d) { return d.selected; })
        .each(function(d) { //d.fixed |= 2; 
          d.fx = d.x;
          d.fy = d.y;
        })

    }

    function dragged(d) {
      //d.fx = d3v4.event.x;
      //d.fy = d3v4.event.y;
            node.filter(function(d) { return d.selected; })
            .each(function(d) { 
                d.fx += d3v4.event.dx;
                d.fy += d3v4.event.dy;
            })
    }

    function dragended(d) {
      if (!d3v4.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
        node.filter(function(d) { return d.selected; })
        .each(function(d) { //d.fixed &= ~6;
            d.fx = null;
            d.fy = null;
        })
    }

    return set;
}

function createBarChart(month){
    // set the dimensions and margins of the graph
// var margin = {top: 20, right: 20, bottom: 30, left: 40},
// width = 960 - margin.left - margin.right,
// height = 500 - margin.top - margin.bottom;
var w = parseInt(d3.select('#barChart').style('width'), 10);
var h = parseInt(d3.select('#barChart').style('height'), 10);
var margin = {top: h*5/100, right: 0, bottom: h*8/100, left: w*11/100};

var width = parseInt(d3.select('#barChart').style('width'), 10) - margin.left;

var height = parseInt(d3.select('#barChart').style('height'), 10) - margin.bottom - margin.top;

// set the ranges
var x = d3.scaleBand()
      .range([0, width])
      .padding(0.1);
var y = d3.scaleLinear()
      .range([height, 0]);
      

var svg = d3.select('#barChart');

// remove any previous graphs
svg.selectAll('.g-main').remove();

var gMain = svg.append('g')
.classed('g-main', true)
.attr("transform", 
       "translate(" + margin.left + "," + 0 + ")");

// get the data
d3.csv("monthly_data_2010.csv", function(error, data) {
if (error) throw error;

// format the data
data.forEach(function(d) {
d.value = +d.value;
});

// Scale the range of the data in the domains
x.domain(data.map(function(d) { return d.month; }));
y.domain([0, d3.max(data, function(d) { return d.value; })]);

// append the rectangles for the bar chart
gMain.selectAll(".bar")
  .data(data)
.enter().append("rect")
  .attr("class", "bar")
  .attr("x", function(d) { return x(d.month); })
  .attr("width", x.bandwidth())
  .attr("y", function(a) { return y(a.value); })
  .attr("height", function(d) { return height - y(d.value); })
  .style("opacity", function(d) {
    return (d.id == month) ? 1.0 : 0.3;
})
  .on("click", function(d) {
    var selected = this;
    // Switch off the other bars
    d3.selectAll(".bar")
        .style("opacity", function() {
            return (this === selected) ? 1.0 : 0.3;
        })
    createLineChartWithBrush(d.id)
    createSlider(d.id)
    

});

// add the x Axis
gMain.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x));

// add the y Axis
gMain.append("g")
  .call(d3.axisLeft(y));

// text label for the x axis
gMain.append("text")
  .attr("transform", "translate(" + (width/2) + " ," + (h - margin.bottom/2) + ")")
  .style("text-anchor", "middle")
  .text("Month");

  // text label for the y axis
gMain.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 0 - margin.left)
  .attr("x",0 - (height / 2))
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .text("# transactions"); 

});

}

function createLineChartWithBrush(month){

    queue()
    .defer(d3.csv, "prices.csv", type)
    .await(ready);

    var parseDate = d3.timeParse("%Y-%m-%d");
    var bisectDate = d3.bisector(function(d) { return d.date; }).left;


    function ready(error, data) {


    if (error) throw error;
    var svg = d3.select('#lineChart');

    var h = parseInt(d3.select('#lineChart').style('height'), 10);
    var w = parseInt(d3.select('#lineChart').style('width'), 10);

    var margin = {top: 0, right: 0, bottom: h*28/100, left: w*11/100};
    var margin2 = {top: h*82/100, right: 0, bottom: h*8/100, left: w*11/100};
    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;
    var height2 = h - margin2.top - margin2.bottom;
        
    var x = d3.scaleTime().range([0, width]);
    var x2 = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);
    var y2 = d3.scaleLinear().range([height2, 0]);

    var xAxis = d3.axisBottom(x);
    var xAxis2 = d3.axisBottom(x2);
    var yAxis = d3.axisLeft(y);

    var line = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.close); });

    var line2 = d3.line()
        .x(function(d) { return x2(d.date); })
        .y(function(d) { return y2(d.close); });
        
    // remove any previous graphs
    svg.selectAll("*").remove();

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
    .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("width", width)
        .attr("height", height);

    var focus2 = focus.append("g")
        .attr("class", "focus2")
        .style("display", "none")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    var context = svg.append("g")
        // <!-- .attr("class", "context") -->
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
        
    var currentExtent = [0,0]

    var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush start", updateCurrentExtent)
    .on("brush end", brushed);

    var zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[0, 0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.close; })]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    focus.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);

    focus.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

    // text label for the x axis
    focus.append("text")
        .attr("transform", "translate(" + (width/2) + " ," + (margin2.top) + ")")
        .style("text-anchor", "middle")
        .text("Date");

    focus.append("g")
    .attr("class", "axis axis--y")
    .call(yAxis);

    // text label for the y axis
    focus.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Value ($)"); 

    focus2.append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", height);

    focus2.append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", width)
    .attr("x2", width);

    focus2.append("circle")
    .attr("r", 4);

    focus2.append("text")
    .attr("x", 15)
        .attr("dy", ".31em");

    context.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line2);

    context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2.tickFormat(d3.timeFormat("%b")));

    context.append("g")
    .attr("class", "brush")
    .on("click", brushed)
    .call(brush)
    .call(brush.move, [new Date(2010,month,1),new Date(2010, parseInt(month)+1,0)].map(x));

    svg.append("rect")
    .attr("class", "zoom")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .on("mouseover", function() { focus2.style("display", null); })
    .on("mouseout", function() { focus2.style("display", "none"); })
    .on("mousemove", mousemove);
    //.call(zoom);
    
    function mousemove() {
        d3.select(this).style("cursor", "default"); 
        var x0 = x.invert(d3.mouse(this)[0]);
        
        var i = bisectDate(data, x0, 1);

        var d0 = data[i - 1];
        var d = data[i];
        //daaa = x0 - d0.year > d.year - x0 ? d : d0;
        focus2.attr("transform", "translate(" + x(d.date) + "," + y(d.close) + ")");
    focus2.select("text").text(function() { return d.close; });
    focus2.select(".x-hover-line").attr("y2", height - y(d.close));
    focus2.select(".y-hover-line").attr("x2", width + width);
    }
    function updateCurrentExtent() {
        currentExtent = d3.brushSelection(this);
    }

    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection;	 
        var p = currentExtent;
        var start;
        var end;
        var startMonth;
        var endMonth;

        if (s) {
            start = d3.min([s[0], s[1]])
            end = d3.max([s[0], s[1]])
            startMonth = x2.invert(start).getMonth()
            endMonth = (x2.invert(end)).getMonth()
            
            if (startMonth != endMonth && ((p[0] == s[0]) || (p[1] == s[1])||(p[1] == s[0]) || (p[0] == s[1]))) {
                var oldMonth = x2.invert(p[0]).getMonth()
                if (startMonth == oldMonth) {
                    start = x2(new Date(2010, endMonth, 1))
                } else {
                    end = x2(new Date(2010, startMonth+1, 0))
                }
            } else if (startMonth != endMonth) {
                if (p[0]<s[0]) { //right
                    start = x2(new Date(2010, endMonth, 1))
                    end = s[1] + start - s[0]
                } else { //left
                    end = x2(new Date(2010, startMonth+1, 0))
                    start = s[0] - (s[1] - end)
                }
            }

        } else { // if no selection took place and the brush was just clicked
            var mouse = d3.mouse(this)[0];
            selectedMonth = x2.invert(mouse).getMonth()
            start = x2(new Date(2010, selectedMonth, 1))
            end = x2(new Date(2010, selectedMonth+1, 0))
        }
        s = [start,end]

    var diff = s[1]-s[0];
    var limit = x2(new Date(2010, 2, 11)) - x2(new Date(2010, 2, 10));
    if (diff < limit) {
        diff = limit
    }
    
    x.domain(s.map(x2.invert, x2));
    focus.select(".line").attr("d", line);
    focus.select(".axis--x").call(xAxis);
    svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
                                                .scale(width / diff)
                                                .translate(-s[0], 0));

    var newMonth = x2.invert(start).getMonth();
    changeBarChartMonth(newMonth)
    createSlider(newMonth)
    }

    function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;
    x.domain(t.rescaleX(x2).domain());
    focus.select(".line").attr("d", line);
    focus.select(".axis--x").call(xAxis);
    context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }

    }

    function type(d) {
    d.date = parseDate(d.date);
    d.close = +d.close;
    return d;
    }

}

let primo_cont_input, secondo_cont_input, terzo_cont_input;
let best_in = ["","",""];
let best_out = ["","",""];
let countinput = 0, countoutput=0;
let count2=0;
let conto = [0,0,0,0]
let conto_input = [0,0,0,0]
let conto_output = [0,0,0,0]
let contatoreinput= 0, contatoreoutput=0;
let conto_output2 = [0,0,0,0]
let conto_input2 = [0,0,0,0]
let contatoreinput2= [0, 0, 0];
let contatoreoutput2=[0, 0, 0];
mantieni=""; //19uf6F6EDijkH4ZUaqsi3pZ2SVD6A5RG8X
primo="", primoinput=0, primonumtrans=0;
secondo="", secondoinput=0, secondonumtrans=0;
terzo="", terzoinput=0, terzonumtrans=0;
numtrans=0;
myDati="";
var testArray = [];
input_array = [];
output_array= [];

function createRadarChart(){

febbraio = 1264982400000;
marzo = 1267401600000;
aprile = 1270080000000;
maggio= 1272672000000;
giugno= 1275350400000;
luglio = 1277942400000;
agosto= 1280620800000;
settembre= 1283299200000;
ottobre = 1285891200000;
novembre = 1288569600000;
dicembre = 1291161600000;
i=0, x=0;
d3.json('trans2010new.json', function(error, data) {
  if (!error) {
      for (let j = 0; j < data.length; j++) { //controllo tutte le transazioni
          if(data[j].block_timestamp >= febbraio && data[j].block_timestamp < marzo){
            for (let w=0; w < data[j].input_count; w++) //controllo tutti gli input di ogni transazione con un ciclo da 0 a input_count
            {
              input_array[i] = [data[j].inputs[w].addresses[0], data[j].inputs[w].value, data[j].input_count, data[j].block_timestamp, data[j].hash]
              //console.log(input_array[i])  // stampo tutti gli input di ogni transazione 
              countinput++ //mi restituirà a fine ciclo il numero tutti gli input presenti in quel periodo temporale
              i++ //incremento la posizione nell'input_array a ogni ciclo
            }
            for (let w=0; w < data[j].output_count; w++) //controllo tutti gli input di ogni transazione con un ciclo da 0 a input_count
            {
              output_array[x] = [data[j].outputs[w].addresses[0], data[j].outputs[w].value, data[j].output_count, data[j].block_timestamp, data[j].hash]
              //console.log(output_array[x])  // stampo tutti gli output di ogni transazione 
              countoutput++ //mi restituirà a fine ciclo il numero tutti gli output presenti in quel periodo temporale
              x++ //incremento la posizione nell'input_array a ogni ciclo
            }



      }
      }
      console.log("Nel periodo scelto sono presenti: " + countinput + " input")
      console.log("Nel periodo scelto sono presenti: " + countoutput + " output")

      console.log("****************************************INPUT****************************************")
      
      for (let j=0; j<input_array.length; j++){
        conto[0]=0
        contatoreinput=0
        numtrans=1
        mantieni= input_array[j][0]; //prendo un indirizzo input di riferimento
        for (let i = 0; i < input_array.length; i++) {
            if(input_array[i][0] === mantieni){ //se l'input preso come riferimento lo ritrovo (almeno una volta si, perchè riscorro tutto l'input_array)
              //console.log(mantieni + " is an input in " + input_array[i][4])
              conto[0]+= input_array[i][1]
              contatoreinput++
            
            }
           
      }
        /*if (conto[0]>1)
        console.log(conto[0])*/
        if (conto[0] > conto[1] && conto[0] > conto[2] && conto[0] > conto[3]){
          best_in[0] = mantieni
          primo_cont_input = contatoreinput
          primonumtrans=numtrans
          conto[1]=conto[0]
        }
        else if (conto [0] < conto[1] && conto[0] > conto[2] && conto[0] > conto[3]){
          best_in[1] = mantieni
          secondo_cont_input = contatoreinput
          secondonumtrans=numtrans
          conto[2]=conto[0]
        }
        else if (conto [0] < conto[1] && conto[0] < conto[2] && conto[0] > conto[3]){
          best_in[2] = mantieni
          terzo_cont_input = contatoreinput
          terzonumtrans=numtrans
          conto[3]=conto[0]
        }
        
      }
      /*console.log("Il 1° è: " + best_in[0] + ";ha speso: " + conto[1] + ";è stato input " + primo_cont_input + " volte")
      console.log("Il 2° è: " + best_in[1] + ";ha speso: " + conto[2] + ";è stato input " + secondo_cont_input + " volte")
      console.log("Il 3° è: " + best_in[2] + ";ha speso: " + conto[3] + ";è stato input " + terzo_cont_input + " volte")
*/


      for (let j=0; j<3; j++){
        //testArray=[];
        conto_input2[j]=0
        contatoreinput2[j]=0
        for (let i = 0; i < output_array.length; i++) {
          if(output_array[i][0] === best_in[j]){ //se l'input preso come riferimento lo ritrovo nell'output
            conto_input2[j]+= output_array[i][1]
            contatoreinput2[j]++
          }
        }
        /* METODO SERIO PER NUMERO DI TRANSAZIONI IN CUI SONO CONVOLTI GLI INPUT
        for (let i = 0; i < input_array.length; i++) {
          if(input_array[i][0] === best_in[j]){ //se l'input preso come riferimento lo ritrovo nell'output
            testArray.push(input_array[i][4])
            console.log(best_in[j] + " is an input in " +testArray)
            
          }
        }
*/



        //console.log("L'indirizzo: " + best_out[j] + ";ha speso: " + conto_output2[j] + ";è stato input " + contatoreoutput2[j] + " volte") 
      }
  
      console.log("Il 1° è: " + best_in[0] + "\nHa speso: " + conto[1] + ";è stato input " + primo_cont_input + " volte\n" + "ha ricev: " + conto_input2[0] + ";è stato output " + contatoreinput2[0] + " volte")
      console.log("Il 2° è: " + best_in[1] + "\nHa speso: " + conto[2] + ";è stato input " + secondo_cont_input + " volte\n" + "ha ricev: " + conto_input2[1] + ";è stato output " + contatoreinput2[1] + " volte")
      console.log("Il 3° è: " + best_in[2] + "\nHa speso: " + conto[3] + ";è stato input " + terzo_cont_input + " volte\n" + "ha ricev: " + conto_input2[2] + ";è stato output " + contatoreinput2[2] + " volte")
  

     
     


      
      



      /*********************************** OUTPUT **************************************** *********************************** OUTPUT **************************************** *********************************** OUTPUT **************************************** */

      console.log("****************************************OUTPUT****************************************")
      
      for (let j=0; j<output_array.length; j++){
        conto_output[0]=0
        contatoreoutput=0
        numtrans=1
        mantieni= output_array[j][0]; //prendo un indirizzo output di riferimento
        for (let i = 0; i < output_array.length; i++) {
            if(output_array[i][0] === mantieni){ //se l'output preso come riferimento lo ritrovo (almeno una volta si, perchè riscorro tutto l'output_array)
              //console.log(mantieni + " is an output in " + output_array[i][4])
              conto_output[0]+= output_array[i][1]
              contatoreoutput++
            
            }
           
      }
        /*if (conto[0]>1)
        console.log(conto[0])*/
        if (conto_output[0] > conto_output[1] && conto_output[0] > conto_output[2] && conto_output[0] > conto_output[3]){
          best_out[0] = mantieni
          primo_cont_output = contatoreoutput
          primonumtrans=numtrans
          conto_output[1]=conto_output[0]
        }
        else if (conto_output [0] < conto_output[1] && conto_output[0] > conto_output[2] && conto_output[0] > conto_output[3]){
          best_out[1] = mantieni
          secondo_cont_output = contatoreoutput
          secondonumtrans=numtrans
          conto_output[2]=conto_output[0]
        }
        else if (conto_output [0] < conto_output[1] && conto_output[0] < conto_output[2] && conto_output[0] > conto_output[3]){
          best_out[2] = mantieni
          terzo_cont_output = contatoreoutput
          terzonumtrans=numtrans
          conto_output[3]=conto_output[0]
        }
        
      }

     


      for (let j=0; j<3; j++){
      conto_output2[j]=0
      contatoreoutput2[j]=0
      
      for (let i = 0; i < input_array.length; i++) {
        if(input_array[i][0] === best_out[j]){ //se l'output preso come riferimento lo ritrovo nell'input
          //console.log(out_primo + " is an input in " + input_array[i][4])
          conto_output2[j]+= input_array[i][1]
          contatoreoutput2[j]++
        }
      }
      //console.log("L'indirizzo: " + best_out[j] + ";ha speso: " + conto_output2[j] + ";è stato input " + contatoreoutput2[j] + " volte") 
    }

    console.log("Il 1° è: " + best_out[0] + "\nHa ricev: " + conto_output[1] + ";è stato output " + primo_cont_output + " volte\n" + "ha speso: " + conto_output2[0] + ";è stato input " + contatoreoutput2[0] + " volte")
    console.log("Il 2° è: " + best_out[1] + "\nHa ricev: " + conto_output[2] + ";è stato output " + secondo_cont_output + " volte\n" + "ha speso: " + conto_output2[1] + ";è stato input " + contatoreoutput2[1] + " volte")
    console.log("Il 3° è: " + best_out[2] + "\nHa ricev: " + conto_output[3] + ";è stato output " + terzo_cont_output + " volte\n" + "ha speso: " + conto_output2[2] + ";è stato input " + contatoreoutput2[2] + " volte")

    var json = data;
    setUserType("in",json)
    graph(json);
  } else {
    console.error(error);
}
});

}
//createRadarChart();
//setMeme("in")

function setUserType(type, data) {

  if(type == 'in'){
      inputradar = true;
      console.log("input")
      graph(data)
      
  } else {
     inputradar=false;
    console.log("output")
    graph(data)
    }
}

    //graph(data)
    function graph(data){
   
    console.log("CIaoooo: " + primo_cont_input)
  var w = 500,
    h = 500;
  
  var colorscale = d3.scaleOrdinal(d3.schemeCategory10);

  
  //Legend titles
  var LegendOptions = ['First','Second', 'Third'];
  
  if (inputradar){
  let maxNumbInp = Math.max(primo_cont_input, secondo_cont_input, terzo_cont_input)
  let maxInpVal = Math.max(conto[1], conto[2],conto[3])
  let maxNumbOut = Math.max(contatoreinput2[0], contatoreinput2[1], contatoreinput2[2])
  let maxOutVal = Math.max(conto_input2[0], conto_input2[1],conto_input2[2])
  let maxOp = Math.max((primo_cont_input + contatoreinput2[0]), (secondo_cont_input + contatoreinput2[1]), (terzo_cont_input + contatoreinput2[2]))

  //Data
  var d = [
        [
        {axis:"Number of Inputs",value:((primo_cont_input+0.001) / (maxNumbInp+0.001))},
        {axis:"Total Inputs value",value:((conto[1]+0.001) / (maxInpVal+0.001))},
        {axis:"Number of Outputs",value:(contatoreinput2[0]+0.001) / (maxNumbOut+0.001) },
        {axis:"Total Outputs Value",value:(conto_input2[0]+0.001) / (maxOutVal+0.001)},
        {axis:"Number of operations",value:((primo_cont_input+0.001) + contatoreinput2[0]) /( maxOp +0.001)}
        ],[
        {axis:"Number of Inputs",value:((secondo_cont_input+0.001) / (maxNumbInp+0.001)) },
        {axis:"Total Inputs value",value:((conto[2]+0.001) / (maxInpVal+0.001)) },
        {axis:"Number of Outputs",value:(contatoreinput2[1]+0.001) / (maxNumbOut+0.001) },
        {axis:"Total Outputs Value",value:(conto_input2[1]+0.001) / (maxOutVal+0.001) },
        {axis:"Number of operations",value:((secondo_cont_input+0.001) + contatoreinput2[1]) / (maxOp+0.001)}
        ]
        ,[
        {axis:"Number of Inputs",value:((terzo_cont_input+0.001) / (maxNumbInp+0.001)) },
        {axis:"Total Inputs value",value:((conto[3]+0.001) / (maxInpVal+0.001)) },
        {axis:"Number of Outputs",value:(contatoreinput2[2]+0.001) / (maxNumbOut+0.001) },
        {axis:"Total Outputs Value",value:(conto_input2[2]+0.001) / (maxOutVal+0.001) },
        {axis:"Number of operations",value:((terzo_cont_input+0.001) + contatoreinput2[2]) / (maxOp+0.001)}
          ]
      ];
    }

    else{
      let maxNumbInp = Math.max(contatoreoutput2[0], contatoreoutput2[1], contatoreoutput2[2])
      let maxInpVal = Math.max(conto_output2[0], conto_output2[1],conto_output2[2])
      let maxNumbOut = Math.max(primo_cont_output, secondo_cont_output, terzo_cont_output)
      let maxOutVal = Math.max(conto_output[1], conto_output[2],conto_output[3])
      let maxOp = Math.max((contatoreoutput2[0] + primo_cont_output), (contatoreoutput2[1] + secondo_cont_output), (contatoreoutput2[2] + terzo_cont_output))
      //Data
      var d = [
            [
            {axis:"Number of Inputs",value:((contatoreoutput2[0]+0.001) / (maxNumbInp + 0.001))},
            {axis:"Total Inputs value",value:((conto_output2[0]+0.001) / (maxInpVal + 0.001))},
            {axis:"Number of Outputs",value:(primo_cont_output+0.001)/ (maxNumbOut + 0.001) },
            {axis:"Total Outputs Value",value:(conto_output[1]+0.001) / (maxOutVal + 0.001) },
            {axis:"Number of operations",value:((contatoreoutput2[0]+0.001) + primo_cont_output) / (maxOp + 0.001) }
            ],[
            {axis:"Number of Inputs",value:((contatoreoutput2[1]+0.001) /  (maxNumbInp + 0.001)) },
            {axis:"Total Inputs value",value:((conto_output2[1]+0.001) / (maxInpVal + 0.001)) },
            {axis:"Number of Outputs",value:(secondo_cont_output +0.001)/ (maxNumbOut + 0.001) },
            {axis:"Total Outputs Value",value:(conto_output[2]+0.001) / (maxOutVal + 0.001)},
            {axis:"Number of operations",value:((contatoreoutput2[1]+0.001) + secondo_cont_output) / (maxOp + 0.001)}
            ]
            ,[
            {axis:"Number of Inputs",value:((contatoreoutput2[2]+0.001) /  (maxNumbInp + 0.001))},
            {axis:"Total Inputs value",value:((conto_output2[2]+0.001) / (maxInpVal + 0.001)) },
            {axis:"Number of Outputs",value:(terzo_cont_output +0.001)/ (maxNumbOut + 0.001) },
            {axis:"Total Outputs Value",value:(conto_output[3]+0.001) / (maxOutVal + 0.001) },
            {axis:"Number of operations",value:((contatoreoutput2[2]+0.001) + terzo_cont_output) / (maxOp + 0.001)}
              ]
          ];
        }






    

  //Options for the Radar chart, other than default
  var mycfg = {
    w: w,
    h: h,
    maxValue: 0.6,
    levels: 6,
    ExtraWidthX: 300
  }
  
  //Call function to draw the Radar chart
  //Will expect that data is in %'s
  RadarChart.draw("#chart", d, mycfg);
  
  ////////////////////////////////////////////
  /////////// Initiate legend ////////////////
  ////////////////////////////////////////////
  
  var svg = d3.select('#body')
    .selectAll('svg')
    .append('svg')
    .attr("width", w+300)
    .attr("height", h)
  
  //Create the title for the legend
  var text = svg.append("text")
    .attr("class", "title")
    .attr('transform', 'translate(90,0)') 
    .attr("x", w - 70)
    .attr("y", 10)
    .attr("font-size", "12px")
    .attr("fill", "#404040")
    .text("Memeeee");
      
  //Initiate Legend	
  var legend = svg.append("g")
    .attr("class", "legend")
    .attr("height", 100)
    .attr("width", 200)
    .attr('transform', 'translate(90,20)') 
    ;
    //Create colour squares
    legend.selectAll('rect')
      .data(LegendOptions)
      .enter()
      .append("rect")
      .attr("x", w - 65)
      .attr("y", function(d, i){ return i * 20;})
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", function(d, i){ return colorscale(i);})
      ;
    //Create text next to squares
    legend.selectAll('text')
      .data(LegendOptions)
      .enter()
      .append("text")
      .attr("x", w - 52)
      .attr("y", function(d, i){ return i * 20 + 9;})
      .attr("font-size", "11px")
      .attr("fill", "#737373")
      .text(function(d) { return d; })
      ;	


    }
  //}

function createForceNetwork(nodes, edges) {

    //create a network from an edgelist
    var node_data = nodes.map(function (d) {return d.id });
    var edge_data = edges.map(function (d) {return [d.source.id, d.target.id]; });
    G = new jsnx.Graph();
    G.addNodesFrom(node_data);
    G.addEdgesFrom(edge_data);
    setCentrality("bw");
}

function filterTransactions(id){
    var svg = d3v4.select('#transactionsGraph')

    var txs = []
    var insOuts = []

    svg.selectAll("circle").each(function (d){
        if(id == d.name){
            txs.push(d.tx_hash)
        }
    })

    svg.selectAll("line")
    .style('opacity', function (l) {
        if(txs.includes(l.source.id)){
            insOuts.push(l.target.id)
        }
        return txs.includes(l.source.id) ? 1 : 0.3;
        
    })

    svg.selectAll("circle")
    .style("opacity", function(o) {
        return txs.includes(o.id) || insOuts.includes(o.id) ? 1 : 0.3;
      });

}

function changeBarChartMonth(month){
    d3.select('#barChart').selectAll(".bar")
    .style("opacity", function(d) {
        return (d.id == month) ? 1.0 : 0.3;
    })
}

function appoggio(){

    febTimestamp = 1264982400000;
    inizioMar = 1267401600000;
    inizioApr = 1270080000000;
    inizioMag= 1272672000000;
    giu= 1275350400000;
    lug = 1277942400000;
    ago= 1280620800000;
    sett= 1283299200000;
    inizioDic = 1291161600000;
    inizioNov = 1288569600000;
    inizioOtt = 1285891200000;
    count = 0;
    d3.json('trans2010new.json', function(error, data) {
        if (!error) {
            for (let j = 0; j < data.length; j++) {
                if(data[j].block_timestamp >= inizioNov && data[j].block_timestamp < inizioDic){
               count++
            }
        
            }
            console.log(count, "nov")
            /*gen 52
            feb 148
            mar 197
            apr 4053
            mag 1272
            giu 1932
            lug 18613
            ago 5952
            sett 7640
            ott 8491
            nov 57501
            dic 11534
            */

    
        } else {
            console.error(error);
        }
    });
}

function httpGet()
{

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "https://blockchain.info/rawaddr/1D4nMKjsr4QJfXArBHAC8KUJXKivpxB2MW?limit=0", false ); // false for synchronous request
    //xmlHttp.open( "GET", "https://blockchain.info/multiaddr?active=1D4nMKjsr4QJfXArBHAC8KUJXKivpxB2MW|1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s&n=0", false ); // false for synchronous request


    xmlHttp.send( null );
    response = xmlHttp.responseText
    console.log(response)
}

