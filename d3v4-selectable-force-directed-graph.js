function createV4SelectableForceDirectedGraph(svg, data) {

    var set = '{"nodes":[],"links":[]}';
 
    var indice = 0;


    set = JSON.parse(set);

    console.log(data);

    for (let j = 0; j < 20;/* data.length; */ j++) {

        set.nodes.push({"id": data[j].hash , "group": 1, "input_count": data[j].input_count, "output_count": data[j].output_count, "input_value": data[j].input_value, "output_value": data[j].output_value, "fee": data[j].fee});
        indice++;

        for (let i = 0; i < data[j].inputs.length; i++) {
    
            set.nodes.push({'id': data[j].hash + '-i' + data[j].inputs[i].index, 'name': data[j].inputs[i].addresses[0] , 'group': 2});
            indice ++;
    
            set.links.push({"source": data[j].hash , "target": data[j].hash + "-i" + data[j].inputs[i].index , "value": 1});

        }

        for (let k = 0; k < data[j].outputs.length; k++) {
    
            set.nodes.push({'id': data[j].hash + "-o" + data[j].outputs[k].index, 'name': data[j].outputs[k].addresses[0] , 'group': 5});
            indice ++;
    
            set.links.push({"source": data[j].hash , "target": data[j].hash + "-o" + data[j].outputs[k].index , "value": 1}); 
        
        }
    }


/*     set.nodes.push({"id": data[9].hash , "group": 1});

    for (let i = 0; i < data[9].inputs.length; i++) {
  
      set.nodes.push({'id': data[9].inputs[i].addresses[0] , 'group': 3});
  
      set.links.push({"source": data[9].inputs[i].addresses[0] , "target": data[9].hash , "value": 1});
        
    } */

    // if both d3v3 and d3v4 are loaded, we'll assume
    // that d3v4 is called d3v4, otherwise we'll assume
    // that d3v4 is the default (d3)
    if (typeof d3v4 == 'undefined')
        d3v4 = d3;

    var width = +svg.attr("width"),
        height = +svg.attr("height");

    let parentWidth = d3v4.select('svg').node().parentNode.clientWidth;
    let parentHeight = d3v4.select('svg').node().parentNode.clientHeight;

    var svg = d3v4.select('#first')
    .attr('width', parentWidth)
    .attr('height', parentHeight)

    var second = d3v4.select('#second')
    .attr('width', parentWidth)
    .attr('height', parentHeight)

    var trans = d3v4.select('#tableTrans')

    var ins = d3v4.select('#tableInputs')

    var outs = d3v4.select('#tableOutputs')

    // remove any previous graphs
    svg.selectAll('.g-main').remove();

    var gMain = svg.append('g')
    .classed('g-main', true);

 /*    second.selectAll('.g-main').remove();

    var gMain2 = second.append('g')
    .classed('g-main', true); */

    var rect = gMain.append('rect')
    .attr('width', parentWidth)
    .attr('height', parentHeight)
    .style('fill', 'white')

    var gDraw = gMain.append('g');

    var zoom = d3v4.zoom()
    .on('zoom', zoomed)

    gMain.call(zoom).on("dblclick.zoom", null);


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
        .on("click", selectNode)
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

      svg.selectAll("circle").on('dblclick', function(d) {

        d.fx = null;
        d.fy = null;
        
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
            d.fx = d.x;
            d.fy = d.y;
        })
    }

    var label = ['Hover a node to show its hash'];

    var texts = ['Hover a node to show its hash', 'Hold the shift key to select nodes', 'Use the scroll wheel to zoom'];

    var search;

    function fillInputs(search) {

        var aux = search[0].inputs;

        ins.selectAll("text[role='row']").remove();

        ins.selectAll("tspan[role*='cell'").remove();

        for (let i = 0; i < aux.length; i++) {
        
            ins
            .append("text")
            .attr('x', 30)
            .attr('y', 60)
            .attr('font-size', '18px')
            .attr('text-anchor', 'middle')
            .attr('role', 'row'+i);

            ins.select("text[role='row"+i+"']")
            .append("tspan")
            .attr('x', 100)
            .attr('y', 30 * (i+2))
            .attr('role', function(d){ return 'cell0';})
            .data(aux[i].addresses)
            .text( aux[i].addresses[0])
            .on("mouseover", toolOver)
            .on("mousemove", toolMove)
            .on("mouseleave", toolLeave)
            .each(wrap);
    
            ins.select("text[role='row"+i+"']")
            .append("tspan")
            .attr('x', 200)
            .attr('y', 30 * (i+2))
            .attr('role', function(d,i){ return 'cell1';})
            .text(aux[i].index);
    
            ins.select("text[role='row"+i+"']")
            .append("tspan")
            .attr('x', 300)
            .attr('y', 30 * (i+2))
            .attr('role', function(d,i){ return 'cell2';})
            .text(aux[i].value);

        }



    }

    function fillOutputs(search) {

        var aux = search[0].outputs;

        outs.selectAll("text[role='row']").remove();

        outs.selectAll("tspan[role*='cell'").remove();

        for (let i = 0; i < aux.length; i++) {
        
            outs
            .append("text")
            .attr('x', 30)
            .attr('y', 60)
            .attr('font-size', '18px')
            .attr('text-anchor', 'middle')
            .attr('role', 'row'+i);

            outs.select("text[role='row"+i+"']")
            .append("tspan")
            .attr('x', 100)
            .attr('y', 30 * (i+2))
            .attr('role', function(d){ return 'cell0';})
            .data(aux[i].addresses)
            .text( aux[i].addresses[0])
            .on("mouseover", toolOver)
            .on("mousemove", toolMove)
            .on("mouseleave", toolLeave)
            .each(wrap);
    
            outs.select("text[role='row"+i+"']")
            .append("tspan")
            .attr('x', 200)
            .attr('y', 30 * (i+2))
            .attr('role', function(d,i){ return 'cell1';})
            .text(aux[i].index);
    
            outs.select("text[role='row"+i+"']")
            .append("tspan")
            .attr('x', 300)
            .attr('y', 30 * (i+2))
            .attr('role', function(d,i){ return 'cell2';})
            .text(aux[i].value);
            
        }

    }

    function wrap() {
        var self = d3.select(this),
            textLength = self.node().getComputedTextLength(),
            text = self.text();
            console.log(textLength);
        while (textLength > (90) && text.length > 0) {
            text = text.slice(0, -1);
            self.text(text + '...');
            textLength = self.node().getComputedTextLength();
        }
    } 

      // create a tooltip
      var tooltip = d3.select("#d3_selectable_force_directed_graph")
      .append("div")
        .style("opacity", 0)
        .style("text-align", "center")
        .attr("class", "tooltip")
        .style("font-size", "16px")

        var toolOver = function(d) {
            console.log(d);
            tooltip
              .transition()
              .duration(200)
              .style("position", "absolute")
              .style("opacity", 0.5)
            if(d.hash){
                tooltip
                .html("<span style='color:white'>" + d.hash + "</span>") // + d.Prior_disorder + "<br>" + "HR: " +  d.HR)
                .style("left", (d3.mouse(this)[0]+30) + "px")
                .style("top", (d3.mouse(this)[1]+30) + "px")
            } else {
                tooltip
                .html("<span style='color:white'>" + d + "</span>") // + d.Prior_disorder + "<br>" + "HR: " +  d.HR)
                .style("left", (d3.mouse(this)[0]+30) + "px")
                .style("top", (d3.mouse(this)[1]+30) + "px")
            }
          }
          var toolMove = function(d) {
            tooltip
              .style("left", (d3.mouse(this)[0]+700) + "px")
              .style("top", (d3.mouse(this)[1]+600) + "px")
          }
          var toolLeave = function(d) {
            tooltip
              .transition()
              .duration(200)
              .style("opacity", 0)
          }

    function selectNode(d){

        search=null;

        var nodo = [];

        nodo = d;

        search = data.filter( x => x.hash === nodo.id );

            if (search.length==0) {
                
                search = data.filter( x => x.hash === nodo.id.slice(0, -3));
                console.log(search);
            };

        fillInputs(search);

        fillOutputs(search);


            second.select("#trans_id")
            .text(search[0].hash);
        

        trans.selectAll("tspan[role*='cell'").remove();

/*     trans
        .append("text")
        .attr('x', 30)
        .attr('y', 60)
        .attr('font-size', '18px')
        .attr('text-anchor', 'middle')
        .attr('role', 'row'); */

        trans.selectAll("text[role='row']")
        .append("tspan")
        .attr('x', 100)
        .attr('y',function(d,i){ return 30*(2+i);})
        .attr('role', function(d){ return 'cell0';})
        .data(search)
        .text(search[0].hash)
        .on("mouseover", toolOver)
        .on("mousemove", toolMove)
        .on("mouseleave", toolLeave)
        .each(wrap);

        trans.selectAll("text[role='row']")
        .append("tspan")
        .attr('x', 200)
        .attr('y',function(d,i){ return 30*(2+i);})
        .attr('role', function(d,i){ return 'cell1';})
        .text(search[0].input_count);

        trans.selectAll("text[role='row']")
        .append("tspan")
        .attr('x', 300)
        .attr('y',function(d,i){ return 30*(2+i);})
        .attr('role', function(d,i){ return 'cell2';})
        .text(search[0].input_value);

        trans.selectAll("text[role='row']")
        .append("tspan")
        .attr('x', 400)
        .attr('y',function(d,i){ return 30*(2+i);})
        .attr('role', function(d,i){ return 'cell3';})
        .text(search[0].output_count);

        trans.selectAll("text[role='row']")
        .append("tspan")
        .attr('x', 500)
        .attr('y',function(d,i){ return 30*(2+i);})
        .attr('role', function(d,i){ return 'cell4';})
        .text(search[0].output_value);

/*         trans.selectAll("text")
        .selectAll("tspan[role='cell']")
        .text(function(){
            for (let i = 0; i < 5; i++) {
                console.log(d[i]);
                 return i;
                
            }
        }); */

    }



    svg.selectAll('text')
    .data(label)
    .enter()
    .append('text')
    .attr('x', 950)
    .attr('y', 20)
    .attr('id', function(d,i) { return 'text' + i;})
    .text(function(d) { return d; });

    svg.selectAll('text')
        .data(texts)
        .enter()
        .append('text')
        .attr('x', 950)
        .attr('y', function(d,i) { return 440 + i * 18; })
        .text(function(d) { return d; });

    second.selectAll('text')
    .data(texts)
    .enter()
    .append('text')
    .attr('x', 950)
    .attr('y', function(d,i) { return 440 + i * 18; })
    .text(function(d) { return d; });

    return set;
};