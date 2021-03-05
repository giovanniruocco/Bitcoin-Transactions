function createV4SelectableForceDirectedGraph(svg, data) {

    var set = '{"nodes":[],"links":[]}';
 
    var indice = 0;


    set = JSON.parse(set);

    console.log(data);


    for (let j = 0; j < 20;/* data.length; */ j++) {

        set.nodes.push({"id": data[j].hash , "group": 1, "index": indice});
        indice++;

        for (let i = 0; i < data[j].inputs.length; i++) {
    
            set.nodes.push({'id': data[j].inputs[i].addresses[0] , 'group': 2, "index": indice});
            indice ++;
    
            //set.links.push({"source": data[j].hash , "target": data[j].inputs[i].addresses[0] , "value": 1});
        
        }

        for (let k = 0; k < data[j].outputs.length; k++) {
    
            set.nodes.push({'id': data[j].outputs[k].addresses[0] , 'group': 5, "index": indice});
            indice ++;
    
            //set.links.push({"source": data[j].hash , "target": data[j].outputs[k].addresses[0] , "value": 1}); 
        
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

    // remove any previous graphs
    svg.selectAll('.g-main').remove();

    var gMain = svg.append('g')
    .classed('g-main', true);

    var rect = gMain.append('rect')
    .attr('width', parentWidth)
    .attr('height', parentHeight)
    .style('fill', 'white')

    var gDraw = gMain.append('g');

    var zoom = d3v4.zoom()
    .on('zoom', zoomed)

    gMain.call(zoom);


    function zoomed() {
        gDraw.attr('transform', d3v4.event.transform);
    }

    var color = d3v4.scaleOrdinal(d3v4.schemeCategory20);

    if (! ("links" in set)) {
        console.log("Graph is missing links");
        return;
    }

    var nodes = {};
    var meme = 0;
    var meme2 = 0;
    var meme3 = 0;
    var i;
    for (i = 0; i < set.nodes.length; i++) {
        nodes[set.nodes[i].index] = set.nodes[i];
        set.nodes[i].weight = 1.01;

    }

    for (let j = 0; j < 20;/* data.length; */ j++) {
    

        for (let l = 0; l < data[j].inputs.length; l++) {
    
            set.links.push({"source": nodes[meme] , "target": nodes[l + meme + 1] , "value": 1});
        
            meme2 = l+1;
        }

        for (let k = 0; k < data[j].outputs.length; k++) {
                  
    
            set.links.push({"source": nodes[meme] , "target": nodes[k + meme + meme2 + 1] , "value": 1}); 

            meme3 = k+1;
        
        }meme = meme + meme2 + meme3 + 1;     
          
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
        svg.select('#text0')
          .text(d.id);
      });

      svg.selectAll("circle").on('auxclick', function(d) {

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

    function selectNode(d){
        console.log(d);

        second.select("#trans_id")
        .text(d.id);

        second.selectAll("tspan")
        .remove();

        second.selectAll("tspan")
        .data(data)
        .append('text')
        .text(function(d) {console.log(d); return d; });

    }

    var label = ['Hover a node to show its hash'];

    var texts = ['Hover a node to show its hash', 'Hold the shift key to select nodes', 'Use the scroll wheel to zoom'];

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