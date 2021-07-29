function createNetwork(data, day) {
    if (typeof d3v4 == 'undefined')
    d3v4 = d3;

    var set = '{"nodes":[],"links":[]}';
    set = JSON.parse(set);
    var selectedDate = new Date(day)
    var selectedDay = selectedDate.getDate()
    var selectedMonth = selectedDate.getMonth()
    console.log("Questo è il mese: " + selectedMonth)
    for (let j = 0; j < data.length; j++) {
        var currentDay = new Date (data[j].block_timestamp).getDate()
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

var svg = d3v4.select('#network');
var svgWidth = parseInt(svg.style('width'), 10);
var svgHeight = parseInt(svg.style('height'), 10);

// remove any previous graphs
svg.selectAll('.g-main').remove();

var gMain = svg.append('g')
.classed('g-main', true)
.attr('tabindex', 0);

var rect = gMain.append('rect')
.attr('width', svgWidth)
.attr('height', svgHeight)
.style('fill', 'white')
.style('stroke', 'black')

var gDraw = gMain.append('g');

var zoom = d3v4.zoom()
.on('zoom', zoomed)

gMain.call(zoom)

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
        var selected = []
        selected.push(d.id)
        filterTransactions(selected)
        node.style("opacity", function(o) {
            return neighboring(d.id, o) ? 1 : 0.3;
          });
        link.style('opacity', function (l) {
            return l.target == d || l.source == d ? 1 : 0.3;
        })

        node.classed('selected', function(o) {
            return o == d;
          });

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
    .force("center", d3v4.forceCenter(svgWidth / 2, svgHeight / 2))
    .force("x", d3v4.forceX(svgWidth / 2))
    .force("y", d3v4.forceY(svgHeight / 2));

   // zoomFit();

simulation
    .nodes(set.nodes)
    .on("tick", ticked)
    .on("end", 
    zoomFit(2000));;

simulation.force("link")
    .links(set.links);

function zoomFit(transitionDuration) {
    setTimeout(function(){
        var bounds = gMain.node().getBBox();
        var parent = gMain.node().parentElement;
        var fullWidth = parent.clientWidth || parent.parentNode.clientWidth;
        var fullHeight = parent.clientHeight || parent.parentNode.clientHeight;
        var width = bounds.width;
        var height = bounds.height;
        var midX = bounds.x + width / 2;
        var midY = bounds.y + height / 2;
        if (width == 0 || height == 0) return; // nothing to fit
        var scale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
        var translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
        
        //console.trace("zoomFit", translate, scale);
        
        var transform = d3.zoomIdentity
            .translate(translate[0], translate[1])
            .scale(scale);
    
        gMain
            .transition()
            .duration(transitionDuration || 0) // milliseconds
            .call(zoom.transform, transform);
        
        setBrushExtent(width, height)
    }, 3000)
        
}

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

function setBrushExtent(w, h){
    brush.extent([[-w, -h], [w, h]])
}

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

    resetTransactions();
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

    var selectedList = []
    node.filter(function(d) { return d.selected; })
    .each(function(d) { 
        selectedList.push(d.id)
    }) 
    filterTransactions(selectedList)

    node.style("opacity", function(o) {
        var isNeigh = false;
        var i = 0;
        while(isNeigh == false && i < selectedList.length) {
            isNeigh = neighboring(selectedList[i], o);
            i++;
        }
        return isNeigh ? 1 : 0.3;
      });

    link.style('opacity', function (l) {
        return selectedList.includes(l.target.id) || selectedList.includes(l.source.id) ? 1 : 0.3;
    })
}

gMain.on('keydown', keydown);
gMain.on('keyup', keyup);

var shiftKey;

function keydown() {
    shiftKey = d3v4.event.shiftKey;
    

    if (shiftKey) {
        // if we already have a brush, don't do anything
        if (gBrush)
            return;

        brushMode = true;

        if (!gBrush) {
            gBrush = gBrushHolder.append('g').classed('g-brush', true);
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
//let conteggio=0;  //questo per cambiare il mese

function createSlider(start, end) {
    var svgSlider = d3.select("#slider")
    svgSlider.selectAll("*").remove();
    /*var actualdate = new Date();                          //sempre per cambiare il mese
    var actualmonth = actualdate.getMonth();
    if (conteggio <3)
        {
            (console.log("Ho cambiato il conteggio"))       //sempre per cambiare il mese
            month=actualmonth;
            conteggio++
        }*/
        console.log("Ecco start: " + start)
        //new Date(start.setMonth(start.getMonth()+5));
        //new Date(end.setMonth(end.getMonth()+5));
    createNN("trans2010new", start)
  
    console.log("Ecco new date: " + start)
    createRadarChart(start)

    var formatDateIntoDay = d3.timeFormat("%d");
    var formatDate = d3.timeFormat("%d %b");

    var width = parseInt(d3.select('#slider').style('width'), 10)
    var height = parseInt(d3.select('#slider').style('height'), 10);
    
    var x = d3.scaleTime()
        .domain([start, end])
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
            .on("start drag", function() { update(x.invert(d3.event.x)); })
            .on("end", function(){ 
                createNN("trans2010new", x.invert(d3.event.x));
                createRadarChart(x.invert(d3.event.x)); }));

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
        .text(function(d) { return formatDateIntoDay(d); });

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 5);

    var label = slider.append("text")  
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(formatDate(start))
        .attr("transform", "translate(0," + (-10) + ")")

    function update(h) {
        // update position and text of label according to slider scale
        handle.attr("cx", x(h));
        label
          .attr("x", x(h))
          .text(formatDate(h));
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
    var svgGraph = d3.select('#transactionsGraph');

d3.json(month + '.json', function(error, data) {
    if (!error) {
        //console.log('graph', graph);
        createNetwork(data, day);
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
    var selectedDay = selectedDate.getDate()
    var selectedMonth = selectedDate.getMonth()
    for (let j = 0; j < data.length; j++) {
        var currentDay = new Date (data[j].block_timestamp).getDate()
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

    let parentWidth = d3v4.select('#transactionsGraph').node().parentNode.clientWidth;
    let parentHeight = d3v4.select('#transactionsGraph').node().parentNode.clientHeight;

    var svg = d3v4.select('#transactionsGraph')
  
    // remove any previous graphs
    svg.selectAll('.g-main').remove();

    var gMain = svg.append('g')
    .classed('g-main', true)
    .attr('tabindex', 0);

    var rect = gMain.append('rect')
    .attr('width', parseInt(d3.select('#transactionsGraph').style('width'), 10))
    .attr('height', parseInt(d3.select('#transactionsGraph').style('height'), 10))
    .style('fill', 'white')
    .style('stroke', 'black')

    var gDraw = gMain.append('g');

    var zoom = d3v4.zoom()
    .on('zoom', zoomed)

    //gMain.call(zoom).on("dblclick.zoom", null);
    gMain.call(zoom);
    // .call(zoom.transform, d3.zoomIdentity.translate(100, 50).scale(0.5))
    // .append("svg:g")
    // .attr("transform","translate(100,50) scale(.5,.5)");


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
    var gBrushHolder = gMain.append('g');
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

    gMain.on('keydown', keydown);
    gMain.on('keyup', keyup);

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

function createBarChart(myDay){

var formatTime =  d3.timeFormat("%d %b");
var lastUpdate = [0,0];

var h = parseInt(d3.select('#barChart').style('height'), 10);
var w = parseInt(d3.select('#barChart').style('width'), 10);

var margin = {top: 0, right: 0, bottom: h*28/100, left: w*11/100};
var margin2 = {top: h*82/100, right: 0, bottom: h*8/100, left: w*11/100};
var width = w - margin.left - margin.right;
var height = h - margin.top - margin.bottom;
var height2 = h - margin2.top - margin2.bottom;

// set the dimensions and margins of the graph
// var margin = {top: 20, right: 20, bottom: 30, left: 40},
// width = 960 - margin.left - margin.right,
// height = 500 - margin.top - margin.bottom;
/* var w = parseInt(d3.select('#barChart').style('width'), 10);
var h = parseInt(d3.select('#barChart').style('height'), 10);
var margin = {top: h*5/100, right: 0, bottom: h*8/100, left: w*11/100};
var margin2 = {top: 230, right: 20, bottom: 30, left: 50};

var width = parseInt(d3.select('#barChart').style('width'), 10) - margin.left;

var height = parseInt(d3.select('#barChart').style('height'), 10) - margin.bottom - margin.top;
var height2 = 300 - margin2.top - margin2.bottom; */

// set the ranges
var x = d3.scaleBand()
      .rangeRound([0, width])
      .padding(0.1);
var y = d3.scaleLinear()
      .range([0, height]);


var svg = d3.select('#barChart');

// remove any previous graphs
svg.selectAll('.g-main').remove();

var gMain = svg.append('g')
.classed('g-main', true)
.attr("transform", 
       "translate(" + margin.left + "," + 0 + ")");

var context = svg.append("g")
.attr("transform","translate("+margin2.left+","+(margin2.top)+")")
.attr("id", "context");

// get the data
d3.csv("daily_data.csv", function(error, data) {
if (error) throw error;

// format the data
data.forEach(function(d) {
    d.value = +d.value;
    });

console.log(new Date(data[260].date).getDate());

var maxHeight=d3.max(data,function(d){return d.value});
var minHeight=d3.min(data,function(d){return d.value});

var yScale2 = d3.scaleLinear()
.range([0,height2]);

      //add x axis
var xScale2 = d3.scaleBand().rangeRound([0,width]).padding(0.1);//scaleBand is used for  bar chart
xScale2.domain(d3.range(1,data.length+".5",1));

// Scale the range of the data in the domains
x.domain(d3.range(0,data.length,1));
y.domain([maxHeight, 0]);
yScale2.domain([maxHeight,0]);

// append the rectangles for the bar chart
var bars1 =gMain.selectAll(".bar")
  .data(data)
.enter().append("rect")
  .attr("id", function(d) { return d.day; })
  .attr("class", "bar")
  .attr("x", function(d) {return x(d.day); })
  .attr("width", x.bandwidth())
  .attr("y", function(d) { return y(d.value); })
  .attr("height", function(d) { return height - y(d.value); })
  .style("opacity", function(d) {
    return (d.id == d.day) ? 1.0 : 0.3;
})
  .on("click", function(d) {
    var selected = this;
    // Switch off the other bars
    d3.selectAll(".bar")
        .style("opacity", function() {
            return (this === selected) ? 1.0 : 0.3;
        })
    createLineChartWithBrush((d.day%12));
    
});

// add the x Axis
var xAxis = d3.axisBottom(x);

var xAxisGroup = gMain.append("g").call(xAxis).attr("transform", "translate(0,"+height+")");

var xAxis2 = d3.axisBottom(xScale2);
	var xAxisGroup2 = context.append("g").call(xAxis2).attr("transform", "translate(0,"+height2+")");

// add the y Axis
/* gMain.append("g")
  .call(d3.axisLeft(y)); */

  var yAxis = d3.axisLeft(y);
  var yAxisGroup = gMain.append("g").call(yAxis);

// text label for the x axis
gMain.append("text")
  .attr("transform", "translate(" + (width/2) + " ," + margin2.top + ")")
  .style("text-anchor", "middle")
  .text("Days");

  // text label for the y axis
gMain.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 0 - margin.left)
  .attr("x",0 - (height / 2))
  .attr("dy", "1em")
  .style("text-anchor", "middle")
  .text("# transactions"); 

  var bars2 = context.selectAll("rect").data(data).enter().append("rect");
  bars2.attr("x",function(d,i){
      return xScale2(i+1);//i*(width/dataset.length);
  })
  .attr("id", function(d) { return d.day; })
  .attr("y",function(d){
        return (yScale2(d.value)/1);        //change value to normalize view
  })//for bottom to top
  .attr("width", xScale2.bandwidth()/*width/dataset.length-barpadding*/)
  .attr("height", function(d){
    if ((height2 - yScale2(d.value)) < 0)
        return 0.1;
    return (height2 - yScale2(d.value)/1);      //change value to normalize view
  });
  bars2.attr("fill",function(d){
      return "steelblue";
  });

  var currentExtent = [0,0]
  
  var brush = d3.brushX()
  .extent([[0,0],[width,height2]])//(x0,y0)  (x1,y1)
  .on("brush start", updateCurrentExtent)
  .on("brush",brushed)//when mouse up, move the selection to the exact tick //start(mouse down), brush(mouse move), end(mouse up)
  .on("end",brushend);
  context.append("g")
  .attr("class","brush")
  .call(brush)
  .call(brush.move,[myDay+15,myDay+45]);

  function updateCurrentExtent() {
    currentExtent = d3.brushSelection(this);
}

var temp = [0,0];
var primo = false;

  function brushed(){
    if (!d3.event.sourceEvent) return; // Only transition after input.
      if (!d3.event.selection) return; // Ignore empty selections.
    if(d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-
    //scaleBand of bar chart is not continuous. Thus we cannot use method in line chart.
    //The idea here is to count all the bar chart in the brush area. And reset the domain

    var p = currentExtent;
    var s = d3.event.selection;	 
    var start;
    var end;

    if (s) {

        start = d3.min([s[0], s[1]])
        end = d3.max([s[0], s[1]])
    
        var startDay = scaleBandInvert(xScale2)(start);  // single invert
        var endDay = scaleBandInvert(xScale2)(end);  // single invert
        
        if (startDay != endDay && ((p[0] == s[0]) || (p[1] == s[1])||(p[1] == s[0]) || (p[0] == s[1]))) {
            var oldDay = scaleBandInvert(xScale2)(p[0]);  // single invert
            if (startDay == oldDay) {
                start = xScale2(endDay)
                end = xScale2(startDay)   
            } else {
                start = xScale2(endDay)
                end = xScale2(startDay)   
            }
        } else if (startDay != endDay) {
            if (p[0]<s[0]) { //right
                start = xScale2(endDay)
                end = xScale2(startDay) 
            } else { //left
                end = xScale2(startDay)
                start = xScale2(endDay)
            }
        }

    } else { // if no selection took place and the brush was just clicked
        var mouse = d3.mouse(this)[0];
        selectedDay = scaleBandInvert(xScale2)(mouse);
        start = xScale2(selectedDay)
        end = xScale2(selectedDay)
    }
    
    s = [end,start]

    var diff = s[1]-s[0];
    var limit = xScale2(130) - xScale2(100);
    if (diff < limit) {
        diff = limit
    }
    

    var newInput = [];

    if ((s[1]-s[0]) < limit) {
        lastUpdate = s;
    }

    console.log(s);
    console.log(lastUpdate);
    if ((s[1]-s[0]) > limit) {
        if (lastUpdate[0] == s[0]) {
            lastUpdate = s;
            temp[0] = s[1]-limit;
            temp[1] = s[1];
            primo = true;
            console.log("primo");
        } else if (lastUpdate[1] == s[1]) {
            lastUpdate = s;
            temp[0] = s[0]
            temp[1] = s[0]+limit;
            console.log("secondo");
        }
        if (lastUpdate[0]==0 && lastUpdate[1]==0)
            lastUpdate=s;
        console.log(lastUpdate);
    }
    
    xScale2.domain().forEach(function(d){
        var pos = xScale2(d) + xScale2.bandwidth()/2;
        if ((s[1]-s[0]) > limit) {
            if (pos >= temp[0] && pos <= temp[1]){
                newInput.push(d);
              }
        } else {
            if (pos >= s[0] && pos <= s[1]){
                newInput.push(d);
              }
        }
    });

    x.domain(newInput);
    //realocate the bar chart
    bars1.attr("x",function(d,i){//data set is still data
        return x(i)/*xScale(xScale.domain().indexOf(i))*/;
    })
    .attr("y",function(d){
        return y(d.value);
    })//for bottom to top
    .attr("width", x.bandwidth())//if you want to change the width of bar. Set the width to xScale.bandwidth(); If you want a fixed width, use xScale2.bandwidth(). Note because we use padding() in the scale, we should use xScale.bandwidth()
    .attr("height", function(d,i){
        if(x.domain().indexOf(i) === -1){
            return 0;
        }
        else
            return height - y(d.value);
    });
    
    xAxisGroup.call(xAxis);

}

function scaleBandInvert(scale) {
    var domain = scale.domain();
    var paddingOuter = scale(domain[0]);
    var eachBand = scale.step();
    return function (value) {
      var index = Math.floor(((value - paddingOuter) / eachBand));
      return domain[Math.max(0,Math.min(index, domain.length-1))];
    }
  }

function brushend(){
    if (!d3.event.sourceEvent) return; // Only transition after input.
      if (!d3.event.selection) return; // Ignore empty selections.
    if(d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-
    //scaleBand of bar chart is not continuous. Thus we cannot use method in line chart.
    //The idea here is to count all the bar chart in the brush area. And reset the domain
    var newInput = [];
    var brushArea = d3.event.selection;
    if(brushArea === null) brushArea = x.range();

    temp2 = brushArea;
    temp = temp2;
    console.log(brushArea);

    if (brushArea[1]-brushArea[0] > 30) {
        if (primo) {
            brushArea[0] = brushArea[1] - 30;
            primo = false;
            console.log("primo");
        } else if (temp2[1] == brushArea[1]) {
            brushArea[1] = brushArea[0] + 30;
            console.log("secondo");
        }
    }

    console.log(brushArea);
    
    xScale2.domain().forEach(function(d){
        var pos = xScale2(d) + xScale2.bandwidth()/2;
        if (pos >= brushArea[0] && pos <= brushArea[1]){
            console.log("log"+brushArea)
          newInput.push(d);
        }
    });

    lastUpdate = brushArea;
    lastUpdate[0] = Math.round(lastUpdate[0]);
    lastUpdate[1] = Math.round(lastUpdate[1]);
    //relocate the position of brush area
    var increment = 0;
    var left=xScale2(d3.min(newInput));
    var right = xScale2(d3.max(newInput))+xScale2.bandwidth();

    d3.select(this).transition().call(d3.event.target.move,[left,right]);//The inner padding determines the ratio of the range that is reserved for blank space between bands.
}

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
    .on("start", updateCurrentExtent)
    .on("end", brushed);

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
        var oldMonth = x2.invert(p[0]).getMonth();

        if (s) {
            start = d3.min([s[0], s[1]])
            end = d3.max([s[0], s[1]])
            startMonth = x2.invert(start).getMonth()
            endMonth = (x2.invert(end)).getMonth()
            
            if (startMonth != endMonth && ((p[0] == s[0]) || (p[1] == s[1]) || (p[1] == s[0]) || (p[0] == s[1]))) {
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
            var selectedMonth = x2.invert(mouse).getMonth();
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
        //createSlider(newMonth)
        createSlider(x2.invert(start), x2.invert(end))
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
let inputradar=true
let primo_cont_input, secondo_cont_input, terzo_cont_input;
let best_in = ["","",""];
let best_out = ["","",""];
let bestInputArray = [
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""]
];
let bestOutputArray =[
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""]
  ];
  let d = [
    [
    ""
    ],[
    ""
    ]
    ,[
    ""
      ]
  ];
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
let contatoreoutput1=[0, 0, 0];
let contatoreinput1=[0, 0, 0];
mantieni=""; //19uf6F6EDijkH4ZUaqsi3pZ2SVD6A5RG8X
primo="", primoinput=0, primonumtrans=0;
secondo="", secondoinput=0, secondonumtrans=0;
terzo="", terzoinput=0, terzonumtrans=0;
numtrans=0;
myDati="";
var testArray = [];
input_array = [];
output_array= [];

function createRadarChart(day){

    primo_cont_input, secondo_cont_input, terzo_cont_input;
    best_in = ["","",""];
    best_out = ["","",""];
    bestInputArray = [
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""]
      ]; 
    bestOutputArray = [
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""]
      ];
      d= [
        [
        ""
        ],[
        ""
        ]
        ,[
        ""
          ]
      ];
      console.log("Mo stampo qualcosa: Il 1° è: " + bestInputArray[0][0] + "\nHa speso: " + bestInputArray[0][1] + ";è stato input " + bestInputArray[0][2] + " volte\n" + "ha ricev: " + bestInputArray[0][3] + ";è stato output " + bestInputArray[0][4] + " volte")
     
    countinput = 0, countoutput=0;
    count2=0;
    conto = [0,0,0,0]
     conto_input = [0,0,0,0]
     conto_output = []
     contatoreinput= 0, contatoreoutput=0;
     conto_output2 = [0,0,0,0]
     conto_input2 = [0,0,0,0]
     contatoreinput2= [0, 0, 0];
    contatoreoutput2=[0, 0, 0];
    contatoreoutput1=[0, 0, 0];
    contatoreinput1=[0, 0, 0];
    mantieni=""; //19uf6F6EDijkH4ZUaqsi3pZ2SVD6A5RG8X
    primo="", primoinput=0, primonumtrans=0;
    secondo="", secondoinput=0, secondonumtrans=0;
    terzo="", terzoinput=0, terzonumtrans=0;
    numtrans=0;
    myDati="";
     testArray = [];
    input_array = [];
    output_array= [];





    var selectedDate = new Date(day)
    var oggi = selectedDate.getTime() //+ 3600000
    var domani = oggi + 86400000
    console.log("Oggi:   " + oggi)
    console.log("Domani: " + domani)


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
i=0, x=0, numtrans=0;
d3.json('trans2010new.json', function(error, data) {
  if (!error) {
      for (let j = 0; j < data.length; j++) { //controllo tutte le transazioni
          if(data[j].block_timestamp >= oggi && data[j].block_timestamp <= domani){
            numtrans++
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
      console.log("Nel periodo scelto sono presenti: " + numtrans + " transazioni")
      console.log("Nel periodo scelto sono presenti: " + countinput + " input")
      console.log("Nel periodo scelto sono presenti: " + countoutput + " output")

      console.log("****************************************INPUT****************************************")
      
      /*
      for (let j=0; j<input_array.length; j++){
        conto[0]=0
        contatoreinput=0
        numtrans=1
        mantieni= input_array[j][0]; //prendo un indirizzo input di riferimento
        for (let i = 0; i < input_array.length; i++) {
            if(input_array[i][0] === mantieni){ //se l'input preso come riferimento lo ritrovo (almeno una volta si, perchè riscorro tutto l'input_array)
              console.log(mantieni + " is an input in " + input_array[i][4])
              conto[0]+= input_array[i][1]
              contatoreinput++
            
            }
           
      }
        
        if (conto[0] > conto[1] && conto[0] > conto[2] && conto[0] > conto[3]){
            console.log("Sono entratooo nel primo")
          best_in[0] = mantieni
          primo_cont_input = contatoreinput
          primonumtrans=numtrans
          conto[1]=conto[0]
          console.log(conto[1])
        }
        else if (conto [0] <= conto[1] && conto[0] > conto[2] && conto[0] > conto[3]){
            console.log("Sono entratooo nel secondoooo")
            best_in[1] = mantieni
          secondo_cont_input = contatoreinput
          secondonumtrans=numtrans
          conto[2]=conto[0]
        }
        else if (conto [0] <= conto[1] && conto[0] <= conto[2] && conto[0] > conto[3]){
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


for (let q = 0; q < input_array.length; q++) {
    for (let z = 0; z < input_array.length-1; z++) {
        
        if (input_array[z][1] > input_array[z + 1][1]) {
            //console.log("Ciao sono ioooooo: "+ input_array[z][1])
            let tmp = input_array[z];
            input_array[z] = input_array[z + 1];
            input_array[z + 1] = tmp;
        }
    }
}

   
    
  
  console.log ("Ho: " + input_array.length + " input_arrayput!!!!!*****!!!!!*****!!!")
  for (let q = input_array.length-1; q >=0; q--) {
    console.log("Il numero " + (q+1) + " è: " + input_array[q][0] + " e ha questo input: " + input_array[q][1])
}
best_in[0] = input_array[input_array.length-1]
console.log("Numero di input qui dentro: " + input_array.length)
if (input_array.length ==1 ){
    best_in[1]=0
    best_in[2]=0
}
else if(input_array.length ==2){
    best_in[1]=input_array[input_array.length-2]
    best_in[2]=0
}
else{
best_in[1]=input_array[input_array.length-2]
best_in[2]=input_array[input_array.length-3]
}

console.log("Il primo è: " + best_in[0][0] + ", che ha questo input: " + best_in[0][1] )
console.log("Il secondo è: " + best_in[1][0] + ", che ha questo input: " + best_in[1][1] )
console.log("Il terzo è: " + best_in[2][0] + ", che ha questo input: " + best_in[2][1] )


    
for (let j=0; j<3; j++){
    conto_input2[j]=0
    contatoreinput2[j]=0
    contatoreinput1[j]=0

    for (let i = 0; i < input_array.length; i++) {
      if(input_array[i][0] === best_in[j][0]){ //se l'input preso come riferimento lo ritrovo tra gli input
        //console.log(in_primo + " is an input in " + input_array[i][4])
        if (input_array[i][3]!=best_in[j][3])
          best_in[j][1]+= input_array[i][1]
        contatoreinput1[j]++
      }
    }
    //console.log("L'indirizzo: " + best_in[j] + ";ha speso: " + conto_input2[j] + ";è stato input " + contatoreinput2[j] + " volte") 
  

    
    for (let i = 0; i < output_array.length; i++) {
      if(output_array[i][0] === best_in[j][0]){ //se l'input preso come riferimento lo ritrovo nell'output
        //console.log(out_primo + " is an input in " + input_array[i][4])
        conto_input2[j]+= output_array[i][1]
        contatoreinput2[j]++
      }
    }
    //console.log("L'indirizzo: " + best_out[j] + ";ha speso: " + conto_output2[j] + ";è stato input " + contatoreoutput2[j] + " volte") 

    bestInputArray[j][0] = best_in[j][0]        //HASH
    bestInputArray[j][1] = best_in[j][1]        //TOTAL INPUT VALUE
    bestInputArray[j][2] = contatoreinput1[j]   //TOTAL INPUT COUNT
    bestInputArray[j][3] = conto_input2[j]      //TOTAL OUTPUT VALUE
    bestInputArray[j][4] = contatoreinput2[j]   //TOTAL OUTPU COUNT

  }
      /* 
      console.log("Il 1° è: " + best_in[0][0] + "\nHa speso: " + best_in[0][1] + ";è stato input " + contatoreinput1[0] + " volte\n" + "ha ricev: " + conto_input2[0] + ";è stato output " + contatoreinput2[0] + " volte")
      console.log("Il 2° è: " + best_in[1][0] + "\nHa speso: " + best_in[1][1] + ";è stato input " + contatoreinput1[1] + " volte\n" + "ha ricev: " + conto_input2[1] + ";è stato output " + contatoreinput2[1] + " volte")
      console.log("Il 3° è: " + best_in[2][0] + "\nHa speso: " + best_in[2][1] + ";è stato input " + contatoreinput1[2] + " volte\n" + "ha ricev: " + conto_input2[2] + ";è stato output " + contatoreinput2[2] + " volte")
  */
      console.log("Il 1° è: " + bestInputArray[0][0] + "\nHa speso: " + bestInputArray[0][1] + ";è stato input " + bestInputArray[0][2] + " volte\n" + "ha ricev: " + bestInputArray[0][3] + ";è stato output " + bestInputArray[0][4] + " volte")
      console.log("Il 2° è: " + bestInputArray[1][0] + "\nHa speso: " + bestInputArray[1][1] + ";è stato input " + bestInputArray[1][2] + " volte\n" + "ha ricev: " + bestInputArray[1][3] + ";è stato output " + bestInputArray[1][4] + " volte")
      console.log("Il 3° è: " + bestInputArray[2][0] + "\nHa speso: " + bestInputArray[2][1] + ";è stato input " + bestInputArray[2][2] + " volte\n" + "ha ricev: " + bestInputArray[2][3] + ";è stato output " + bestInputArray[2][4] + " volte")
     
     


      
      



      /*********************************** OUTPUT **************************************** *********************************** OUTPUT **************************************** *********************************** OUTPUT **************************************** */

      console.log("****************************************OUTPUT****************************************")
      

      for (let q = 0; q < output_array.length; q++) {
        for (let z = 0; z < output_array.length-1; z++) {
            
            if (output_array[z][1] > output_array[z + 1][1]) {
                //console.log("Ciao sono ioooooo: "+ output_array[z][1])
                let tmp = output_array[z];
                output_array[z] = output_array[z + 1];
                output_array[z + 1] = tmp;
            }
        }
    }

        /*
        if (conto_output[0] > conto_output[1] && conto_output[0] > conto_output[2] && conto_output[0] > conto_output[3]){
          best_out[0] = mantieni
          primo_cont_output = contatoreoutput
          primonumtrans=numtrans
          conto_output[1]=conto_output[0]
          console.log("Dopo questo il conto_output0 è: " + conto_output[0] + "il conto_output1 è: " + conto_output[1] + " e il conto_output2 è: " + conto_output[2])
        }
        
        else if (conto_output[0] <= conto_output[1] && conto_output[0] > conto_output[2] && conto_output[0] > conto_output[3]){
            console.log("Sono entrato nel secondo outpuuuut")
            console.log("Dopo quest'altro il conto_output0 è: " + conto_output[0] + "il conto_output1 è: " + conto_output[1] + " e il conto_output2 è: " + conto_output[2])
          best_out[1] = mantieni
          secondo_cont_output = contatoreoutput
          secondonumtrans=numtrans
          conto_output[2]=conto_output[0]
        }
        else if (conto_output[0] <= conto_output[1] && conto_output[0] <= conto_output[2] && conto_output[0] > conto_output[3]){
          best_out[2] = mantieni
          terzo_cont_output = contatoreoutput
          terzonumtrans=numtrans
          conto_output[3]=conto_output[0]
        }
        */
        
      
      console.log ("Ho: " + output_array.length + " output!!!!!*****!!!!!*****!!!")
      for (let q = output_array.length-1; q >=0; q--) {
        console.log("Il numero " + (q+1) + " è: " + output_array[q][0] + " e ha questo output: " + output_array[q][1])
    }
    
    best_out[0] = output_array[output_array.length-1]
    console.log("Numero di output qui dentro: " + output_array.length)
if (output_array.length ==1 ){
    best_out[1]=0
    best_out[2]=0
}else if(output_array.length == 2){
    best_out[1]= output_array[output_array.length-2]
    best_out[2]=0 
}
    else{
    best_out[1]= output_array[output_array.length-2]
    best_out[2]= output_array[output_array.length-3]
    }
   

    console.log("Il primo è: " + best_out[0][0] + ", che ha questo output: " + best_out[0][1] )
    console.log("Il secondo è: " + best_out[1][0] + ", che ha questo output: " + best_out[1][1] )
    console.log("Il terzo è: " + best_out[2][0] + ", che ha questo output: " + best_out[2][1] )




      for (let j=0; j<3; j++){
      conto_output2[j]=0
      contatoreoutput2[j]=0
      contatoreoutput1[j]=0

      for (let i = 0; i < output_array.length; i++) {
        if(output_array[i][0] === best_out[j][0]){ //se l'output preso come riferimento lo ritrovo tra gli output
          //console.log(out_primo + " is an input in " + input_array[i][4])
          if (output_array[i][3]!=best_out[j][3])
            best_out[j][1]+= output_array[i][1]
          contatoreoutput1[j]++
        }
      }
      //console.log("L'indirizzo: " + best_out[j] + ";ha speso: " + conto_output2[j] + ";è stato input " + contatoreoutput2[j] + " volte") 
    

      
      for (let i = 0; i < input_array.length; i++) {
        if(input_array[i][0] === best_out[j][0]){ //se l'output preso come riferimento lo ritrovo nell'input
          //console.log(out_primo + " is an input in " + input_array[i][4])
          conto_output2[j]+= input_array[i][1]
          contatoreoutput2[j]++
        }
      }
      bestOutputArray[j][0] = best_out[j][0]       //HASH
      bestOutputArray[j][1] = conto_output2[j]    //TOTAL INPUT VALUE
      bestOutputArray[j][2] = contatoreoutput2[j]  //TOTAL INPUT COUNT
      bestOutputArray[j][3] = best_out[j][1]       //TOTAL OUTPUT VALUE
      bestOutputArray[j][4] = contatoreoutput1[j]  //TOTAL OUTPUT COUNT
  
    }

    if (input_array.length == 1){
        for (var q=0;q<5;q++){
            bestInputArray[1][q] = -0.001
            bestInputArray[2][q] = -0.001
        }
    }
    else if (input_array.length == 2){
        for (var q=0;q<5;q++){
            bestInputArray[2][q] = -0.001
        }
    }

    if (output_array.length == 1){
        for (var q=0;q<5;q++){
            bestOutputArray[1][q] = -0.001
            bestOutputArray[2][q] = -0.001
        }
    }
    else if (output_array.length == 2){
        for (var q=0;q<5;q++){
            bestOutputArray[2][q] = -0.001
        }
    }

    /*
    console.log("Il 1° è: " + best_out[0][0] + "\nHa ricev: " + best_out[0][1] + ";è stato output " + contatoreoutput1[0] + " volte\n" + "ha speso: " + conto_output2[0] + ";è stato input " + contatoreoutput2[0] + " volte")
    console.log("Il 2° è: " + best_out[1][0] + "\nHa ricev: " + best_out[1][1] + ";è stato output " + contatoreoutput1[1] + " volte\n" + "ha speso: " + conto_output2[1] + ";è stato input " + contatoreoutput2[1] + " volte")
    console.log("Il 3° è: " + best_out[2][0] + "\nHa ricev: " + best_out[2][1] + ";è stato output " + contatoreoutput1[2] + " volte\n" + "ha speso: " + conto_output2[2] + ";è stato input " + contatoreoutput2[2] + " volte")
*/
    
    console.log("Il 1° è: " + bestOutputArray[0][0] + "\nHa speso: " + bestOutputArray[0][1] + ";è stato input " + bestOutputArray[0][2] + " volte\n" + "ha ricev: " + bestOutputArray[0][3] + ";è stato output " + bestOutputArray[0][4] + " volte")
    console.log("Il 2° è: " + bestOutputArray[1][0] + "\nHa speso: " + bestOutputArray[1][1] + ";è stato input " + bestOutputArray[1][2] + " volte\n" + "ha ricev: " + bestOutputArray[1][3] + ";è stato output " + bestOutputArray[1][4] + " volte")
    console.log("Il 3° è: " + bestOutputArray[2][0] + "\nHa speso: " + bestOutputArray[2][1] + ";è stato input " + bestOutputArray[2][2] + " volte\n" + "ha ricev: " + bestOutputArray[2][3] + ";è stato output " + bestOutputArray[2][4] + " volte")
       
       

    var json = data;
    if (inputradar==true)
        setUserType("in",json)
    else
        setUserType("out",json)
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
      graph(data)
      
  } else {
     inputradar=false;
    graph(data)
    }
}

    //graph(data)
    function graph(data){

  var w = 500,
    h = 500;
  
  var colorscale = d3.scaleOrdinal(d3.schemeCategory10);

  
  //Legend titles
  var LegendOptions = ['First','Second', 'Third'];
  
   
  if (inputradar){

    console.log("**********STO ANALIZZANDO GLI INPUT**********\n")
    maxInpVal = Math.max(bestInputArray[0][1], bestInputArray[1][1], bestInputArray[2][1])+0.00001
    console.log("Massimo tra i total input value: " + maxInpVal)
    console.log("Il primo input è: " + bestInputArray[0][1])
    console.log("Il secondo input è: " + bestInputArray[1][1])
    console.log("Il terzo input è: " + bestInputArray[2][1])
    maxNumbInp = Math.max(bestInputArray[0][2], bestInputArray[1][2], bestInputArray[2][2])+0.00001
    console.log("Massimo tra i total input count: " + maxNumbInp)
    maxOutVal = Math.max(bestInputArray[0][3], bestInputArray[1][3], bestInputArray[2][3])+0.00001
    console.log("Massimo tra i total output value: " + maxOutVal)
    maxNumbOut = Math.max(bestInputArray[0][4], bestInputArray[1][4], bestInputArray[2][4])+0.00001
    console.log("Massimo tra i total output count: " + maxNumbOut)
    maxOp = Math.max((bestInputArray[0][2] + bestInputArray[0][4]), (bestInputArray[1][2] + bestInputArray[1][4]), (bestInputArray[2][2] + bestInputArray[2][4]))+0.00001
    console.log("Massimo tra i numeri di operazioni: " + maxOp)

    console.log("I Due fuori usciti sono questi: " + bestInputArray[1][1])

  //Data
  d = [
        [
        {axis:"Total Inputs value",value:((bestInputArray[0][1]+0.001) / (maxInpVal+0.001))},
        {axis:"Number of Inputs",value:((bestInputArray[0][2]+0.001) / (maxNumbInp+0.001))},
        {axis:"Total Outputs Value",value:((bestInputArray[0][3]+0.001) / (maxOutVal+0.001))},
        {axis:"Number of Outputs",value:((bestInputArray[0][4]+0.001) / (maxNumbOut+0.001))},
        {axis:"Number of operations",value:((bestInputArray[0][2]+0.001) + bestInputArray[0][4]) /(maxOp+0.001)}
        ],[
        {axis:"Total Inputs value",value:((bestInputArray[1][1]+0.001) / (maxInpVal+0.001))},
        {axis:"Number of Inputs",value:((bestInputArray[1][2]+0.001) / (maxNumbInp+0.001))},
        {axis:"Total Outputs Value",value:((bestInputArray[1][3]+0.001) / (maxOutVal+0.001))},
        {axis:"Number of Outputs",value:((bestInputArray[1][4]+0.001) / (maxNumbOut+0.001))},
        {axis:"Number of operations",value:((bestInputArray[1][2]+0.001) + bestInputArray[1][4]) /(maxOp+0.001)}
        ]
        ,[
        {axis:"Total Inputs value",value:((bestInputArray[2][1]+0.001) / (maxInpVal+0.001))},
        {axis:"Number of Inputs",value:((bestInputArray[2][2]+0.001) / (maxNumbInp+0.001))},
        {axis:"Total Outputs Value",value:((bestInputArray[2][3]+0.001) / (maxOutVal+0.001))},
        {axis:"Number of Outputs",value:((bestInputArray[2][4]+0.001) / (maxNumbOut+0.001))},
        {axis:"Number of operations",value:((bestInputArray[2][2]+0.001) + bestInputArray[2][4]) /(maxOp+0.001)}
          ]
      ];
    }

    else{    
        console.log("**********STO ANALIZZANDO GLI OUTPUT**********")
        
        maxInpVal = Math.max(bestOutputArray[0][1], bestOutputArray[1][1], bestOutputArray[2][1])+0.00001
        console.log("Massimo tra i total input value: " + maxInpVal)
        maxNumbInp = Math.max(bestOutputArray[0][2], bestOutputArray[1][2], bestOutputArray[2][2])+0.00001
        console.log("Massimo tra i total input count: " + maxNumbInp)
        maxOutVal = Math.max(bestOutputArray[0][3], bestOutputArray[1][3], bestOutputArray[2][3])+0.00001
        console.log("Massimo tra i total output value: " + maxOutVal)
        maxNumbOut = Math.max(bestOutputArray[0][4], bestOutputArray[1][4], bestOutputArray[2][4])+0.00001
        console.log("Massimo tra i total output count: " + maxNumbOut)
        maxOp = Math.max((bestOutputArray[0][2] + bestOutputArray[0][4]), (bestOutputArray[1][2] + bestOutputArray[1][4]), (bestOutputArray[2][2] + bestOutputArray[2][4]))+0.00001
        console.log("Massimo tra i numeri di operazioni: " + maxOp)
    
       //Data
       d = [
            [
            {axis:"Total Inputs value" + i ,value:((bestOutputArray[0][1]+0.001) / (maxInpVal+0.001))},
            {axis:"Number of Inputs",value:((bestOutputArray[0][2]+0.001) / (maxNumbInp+0.001))},
            {axis:"Total Outputs Value",value:((bestOutputArray[0][3]+0.001) / (maxOutVal+0.001))},
            {axis:"Number of Outputs",value:((bestOutputArray[0][4]+0.001) / (maxNumbOut+0.001))},
            {axis:"Number of operations",value:((bestOutputArray[0][2]+0.001) + bestOutputArray[0][4]) /(maxOp+0.001)}
            ],[
            {axis:"Total Inputs value",value:((bestOutputArray[1][1]+0.001) / (maxInpVal+0.001))},
            {axis:"Number of Inputs",value:((bestOutputArray[1][2]+0.001) / (maxNumbInp+0.001))},
            {axis:"Total Outputs Value",value:((bestOutputArray[1][3]+0.001) / (maxOutVal+0.001))},
            {axis:"Number of Outputs",value:((bestOutputArray[1][4]+0.001) / (maxNumbOut+0.001))},
            {axis:"Number of operations",value:((bestOutputArray[1][2]+0.001) + bestOutputArray[1][4]) /(maxOp+0.001)}
            ]
            ,[
            {axis:"Total Inputs value",value:((bestOutputArray[2][1]+0.001) / (maxInpVal+0.001))},
            {axis:"Number of Inputs",value:((bestOutputArray[2][2]+0.001) / (maxNumbInp+0.001))},
            {axis:"Total Outputs Value",value:((bestOutputArray[2][3]+0.001) / (maxOutVal+0.001))},
            {axis:"Number of Outputs",value:((bestOutputArray[2][4]+0.001) / (maxNumbOut+0.001))},
            {axis:"Number of operations",value:((bestOutputArray[2][2]+0.001) + bestOutputArray[2][4]) /(maxOp+0.001)}
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
        if(id.includes(d.name)){
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

function resetTransactions(){
    var svg = d3v4.select('#transactionsGraph');

    svg.selectAll("line")
    .style('opacity', 1);

    svg.selectAll("circle")
    .style("opacity", 1);
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

function createPCA(){
    // set the dimensions and margins of the graph
var h = parseInt(d3.select('#pca').style('height'), 10);
var w = parseInt(d3.select('#pca').style('width'), 10);

var margin = {top: h*5/100, right: w*5/100, bottom: h*15/100, left: w*15/100};
var width = w - margin.left - margin.right;
var height = h - margin.top - margin.bottom;

var x = d3.scaleLinear()
    .range([0, width]);

var y = d3.scaleLinear()
    .range([height, 0]);

var color = d3.scaleOrdinal(d3.schemeCategory10);

var xAxis = d3.axisBottom(x);

var yAxis = d3.axisLeft(y);

var svgPca = d3.select('#pca');

svgPca.selectAll("*").remove();

var svg = svgPca
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Define the div for the tooltip
var div = d3.select("#pca_div").append("div")	
    .attr("class", "tooltip")
    .style("visibility", "hidden");				
    // .style("opacity", 0);

d3.csv("pca_giorni.csv", function(error, data) {
  if (error) throw error;

  data.forEach(function(d) {
    d.y = +d.y;
    d.x = +d.x;
  });

  const colorValue = d => d.day;

  x.domain([d3.min(data,function(d){return d.x}), d3.max(data,function(d){return d.x})]).nice();
  y.domain([d3.min(data,function(d){return d.y}), d3.max(data,function(d){return d.y})]).nice();

/*   svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis); */

      svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")  
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  svg.selectAll(".dot")
      .data(data)
    .enter().append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", function(d) { return x(d.x); })
      .attr("cy", function(d) { return y(d.y); })
      .attr('fill', d => color(colorValue(d)))
      .attr('fill-opacity', 0.6)
      .on("mouseover", function(d) {		
        div.transition()		
            .duration(500)		
            .style("opacity", .9);		
        div	.html(d.hash)	
            .style("visibility", "visible")
            .style("left", d3.select(this).attr("cx") + "px")		
            .style("top", d3.select(this).attr("cy") + "px");	
        })					
    .on("mouseout", function(d) {		
        div.transition()		
            .duration(1000)
            .style("opacity", 0);
        div.style("visibility", "hidden");	
    });

});



}

