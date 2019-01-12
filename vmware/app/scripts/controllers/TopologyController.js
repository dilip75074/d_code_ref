


/*******************************************************************************
 * Copyright (c) 2014 VMware, Inc. All rights reserved.
 ******************************************************************************/


/**
 * 
 * This javascript file contains the code to build the network topology
 * Network topology is divided into 3 phases. 
 * 1st Dashboard View : is a smaller topology image,
 * as seen on the dashboard.
 * 2nd Toplevel view : is when you click this topology image on the dashboard.
 * We show a larger image here with more information about Spine switches and Racks.
 * 3rd Rack level view: is when you click on particular Rack. It displays expanded view of Rack with Tors,
 * Managements and Hosts present in Rack.
 * 4th phase : is initiated, when we click on the switches in the 2nd and 3rd phase.
 * This shows detailed device view.
 */


/*
 * This will be used to create layout on UI for 1St 2nd and 3rd View in form of Graph.
 * @param scope : Scope of the directive
 * @param networkObject : Information about the topology(Devices and their connections)
 * @param el : The element inside which the topology is to be drawn
 * @param displayInformation : Depending on the screen size and the number of devices present,
 * the size of the devices are adjusted to fit maximum number of devices on the screen, while maintaining 
 * readability.
 */
function buildD3Layout(scope,networkObject,el,displayInformation,description,phase,prevSelectedVlan){

	var svg = d3.select(el[0])
	.each(function() { this.focus(); })
	.append("svg")
	.attr("width", displayInformation.proposedWidth)
	.attr("height", displayInformation.proposedHeight)
	/*
	 * When the mouse leaves the screen, all selected nodes should be unselected
	 */
	.on("mouseleave",function(d){
		d3.selectAll(".selected").classed("selected",function(d){return d.selected = false;});
	});


	svg.append("rect")
	.attr("width", "100%")
	.attr("height", "100%")
	.attr("fill", "white");

	/*
	 *  Clears header of the view and puts new one
	 */
	$("#topoheader").width( displayInformation.proposedWidth );
	$('#topoheader').html("");
	$('#topoheader').append(description);
	$('#backtotop').width( displayInformation.proposedWidth );
	$('#vlans').width( displayInformation.proposedWidth-70 );
	/*
	 *  brush can be used to drag across the topology to select more than one node.
	 */
	var brush = svg.append("g")
	.datum(function() { return {selected: false}; })
	.attr("class", "brush");
	var curves = svg.append("g")
	.attr("class","paths")
	.selectAll(".paths");

	networkObject.nodes.forEach(function (d) { 
		d.mouseClicked=false;
	});

	/*
	 * For drop down for tagged and Untagged Vlans. dataT is the array which will contain all tagged and untagged vlans.
	 */

	$('#vlans').html("");
	var setT = Object.create(null);
	var dataT=[];
	dataT.push("Available VLANs");
	networkObject.nodes.forEach(function (d) { 
		for(i in d.taggedVlans){
			if("Tagged - "+d.taggedVlans[i] in setT){

			}else{
				setT["Tagged - "+d.taggedVlans[i]]=true;
				dataT.push("Tagged - "+d.taggedVlans[i]);
			}
		}
	});

	networkObject.nodes.forEach(function (d) { 
		for(i in d.untaggedVlans){
			if("UnTagged - "+d.untaggedVlans[i] in setT){

			}else{
				setT["UnTagged - "+d.untaggedVlans[i]]=true;
				dataT.push("UnTagged - "+d.untaggedVlans[i]);
			}
		}
	});
	// Dropdown for vlans
	var dropDowntVlan = d3.select("#vlans").append("select")
	.attr("id","taggedVlan")
	.attr("name", "tvlan-list")
	.classed("styled-dropbox",true);

	var optionsT = dropDowntVlan.selectAll("option")
	.data(dataT)
	.enter()
	.append("option");


	optionsT.text(function (d) { return d; })
	.attr("value", function (d) { return d; });


	dropDowntVlan.on("change", menuChangedForTaggedVlan);

	/*
	 * On change for Tagged/Untagged vlans drop down
	 */
	function menuChangedForTaggedVlan(prevSelectedVlaue) {

		// Reset all highlighted paths
		d3.selectAll(".paths")
		.style("stroke-width", 4);
		networkObject.links.forEach(function (d) { 
			d3.selectAll('#'+d.linkID)
			.style("stroke-width", 1);
		});

		//Get the name of the selected option for tagged vlans
		var selectedValue=null;
		if(prevSelectedVlaue==null || prevSelectedVlaue=='undefined')
			selectedValue = d3.event.target.value; 
		else
			selectedValue=prevSelectedVlaue;


		var splittedValue=selectedValue.split("-");
		var vlanType=splittedValue[0].trim();
		var vlanName=splittedValue[1].trim();
		// Processing links for selected value of the path
		networkObject.links.forEach(function (d) { 

			var sourceIfHasVlan=false;
			var targetIfHasVlan=false;
			var highlightenLink=false;

			// If vlan is present on the source device which is rack. This will be true in case of top level topology.
			if(d.source.type.toLowerCase()=="rack")
			{
				// If tagged vlan is selected
				if(vlanType=="Tagged")
				{
					for(i in d.source.taggedVlans){
						if(d.source.taggedVlans[i]==vlanName){
							sourceIfHasVlan=true;
							break;
						}
					}
				}
				// If untagged vlan is selected
				else
				{
					for(i in d.source.untaggedVlans){

						if(d.source.untaggedVlans[i]==vlanName){

							sourceIfHasVlan=true;
							break;
						}
					}
				}

			}
			// If vlan is present on the source interface of the source device which is other than rack. This will be true in case of rack level view.
			else
			{
				var sourcePort=d.sport;

				if(sourcePort.indexOf(",") > -1){
					var sportArr=sourcePort.split(",");
					sourcePort=sportArr[0];
				}
				if(vlanType=="Tagged")
				{
					for(i in d.source.interfaces){

						if(sourcePort==d.source.interfaces[i].portName){
							var vlans=d.source.interfaces[i].taggedVlans;

							for(i in vlans){
								if(vlans[i]==vlanName){
									sourceIfHasVlan=true;
									break;
								}
							}
							if(sourceIfHasVlan){
								break;
							}
						}

					}
				}else{
					for(i in d.source.interfaces){

						if(sourcePort==d.source.interfaces[i].portName){

							var vlans=d.source.interfaces[i].untaggedVlans;
							console.log("Source"+vlans);
							for(i in vlans){
								if(vlans[i]==vlanName){
									sourceIfHasVlan=true;
									break;
								}
							}
							if(sourceIfHasVlan){
								break;
							}
						}

					}
				}
			}
			// If vlan is present on the target device which is rack. This will be true in case of top level topology.
			if(d.target.type.toLowerCase()=="rack")
			{
				if(vlanType=="Tagged")
				{
					for(i in d.target.taggedVlans){

						if(d.target.taggedVlans[i]==vlanName){
							targetIfHasVlan=true;
							break;
						}
					}
				}else{
					for(i in d.target.untaggedVlans){

						if(d.target.taggedVlans[i]==vlanName){
							targetIfHasVlan=true;
							break;
						}
					}
				}

			}
			// If vlan is present on the target interface of the target device which is other than rack. This will be true in case of rack level view.
			else
			{
				var targetPort=d.tport;
				if(targetPort.indexOf(",") > -1){
					var tportArr=targetPort.split(",");
					targetPort=tportArr[0];
				}

				if(vlanType=="Tagged")
				{
					for(i in d.target.interfaces){

						if(targetPort==d.target.interfaces[i].portName){
							var vlans=d.target.interfaces[i].taggedVlans;
							for(i in vlans){
								if(vlans[i]==vlanName){

									targetIfHasVlan=true;
									break;
								}
							}
							if(targetIfHasVlan){
								break;
							}
						}

					}
				}else{
					for(i in d.target.interfaces){

						if(targetPort==d.target.interfaces[i].portName){
							var vlans=d.target.interfaces[i].untaggedVlans;
							console.log("Target"+vlans);
							for(i in vlans){
								if(vlans[i]==vlanName){

									targetIfHasVlan=true;
									break;
								}
							}
							if(targetIfHasVlan){
								break;
							}
						}
					}
				}
			}


			// In case of link between Switch and Switch || Switch and Rack, vlans on both devices will be matched 
			if((d.source.type.toLowerCase() =="switch" && d.target.type.toLowerCase() =="switch") || 
					(d.source.type.toLowerCase() =="rack" && d.target.type.toLowerCase() =="switch") ||
					(d.source.type.toLowerCase() =="switch" && d.target.type.toLowerCase() =="rack"))
			{
				highlightenLink=sourceIfHasVlan && targetIfHasVlan;
			}
			// In case of link between Switch and Host , vlans on switch will be considered
			else
			{
				highlightenLink=sourceIfHasVlan || targetIfHasVlan;
			}
			// Final result
			if(highlightenLink)
			{
				d3.selectAll('#'+d.linkID)
				.style("stroke-width", 4);
			}

		});}

	// Tool tip
	var div = d3.select(el[0]).append("div")   
	.attr("class", "tooltip")               
	.style("opacity", 0);

	var divLink = d3.select(el[0]).append("div")   
	.attr("class", "tooltip")               
	.style("opacity", 0);

	// Device Node Creation
	var node = svg.selectAll(".node")
	.data(networkObject.nodes)
	.enter()
	.append("g")
	.attr("id",function(d){return d.name;})
	.attr("class","node")
	.attr("transform", function(d) {
		return "translate(" + d.x + "," + d.y + ")"; })
		.on("mouseover", function(d) { 
			div.transition()        
			.duration(200)      
			.style("opacity", .9);   
			// Tool tip when hovered on particular device node
			if(d.type.toLowerCase()=="rack"){
				div.html("<b>Rack Details: </b><br/><br/>"+"<b>Rack Id: </b>"+d.name +"<br/>"+"<b>TOR Switches: </b>"+d.tor+"<br/>"+"<b>Management Switches: </b>"+d.mgmt+"<br/>"+"<b>Hosts: </b>"+d.host+"<br/>"+"<b>Status: </b>"+d.errorst+"<br/>")  
				.style("left", (d3.event.pageX) + "px")     
				.style("top", (d3.event.pageY - 28) + "px");    
			}else if(d.type.toLowerCase()=="switch" && d.role.toLowerCase()=="spine"){
				div.html("<b>Switch Details: </b><br/><br/>"+"<b>Switch Id: </b>"+d.name +"<br/>"+ "<b>Role: </b>"+d.role+"<br/>"+"<b>IP Address: </b>"+d.ip+"<br/>"+"<b>Status: </b>"+d.errorst+"<br/>")  
				.style("left", (d3.event.pageX) + "px")     
				.style("top", (d3.event.pageY - 28) + "px");    
			}else if(d.type.toLowerCase()=="switch"){
				div.html("<b>Switch Details: </b><br/><br/>"+"<b>Switch Id: </b>"+d.name +"<br/>"+ "<b>Role: </b>"+d.role+"<br/>"+"<b>Rack: </b>"+d.rack+"<br/>"+"<b>IP Address: </b>"+d.ip+"<br/>"+"<b>Status: </b>"+d.errorst+"<br/>")  
				.style("left", (d3.event.pageX) + "px")     
				.style("top", (d3.event.pageY - 28) + "px");    
			}else if(d.type.toLowerCase()=="host"){
				div.html("<b>Host Details: </b><br/><br/>"+"<b>Host Id: </b>"+d.name +"<br/>"+"<b>Rack: </b>"+d.rack+"<br/>"+"<b>IP Address: </b>"+d.ip+"<br/>"+"<b>Status: </b>"+d.errorst+"<br/>")  
				.style("left", (d3.event.pageX) + "px")     
				.style("top", (d3.event.pageY - 28) + "px");
			}else if(d.type.toLowerCase()=="corporate"){
				div.html("<b>Corporate Network</b><br/><br/>")  
				.style("left", (d3.event.pageX) + "px")     
				.style("top", (d3.event.pageY - 28) + "px");
			}
		})                  
		.on("mouseout", function(d) { 
			div.transition()        
			.duration(100)      
			.style("opacity", 0);   
		});

	// Setting the source and targets based on the "links" in the networkObject
	networkObject.links.forEach(function(d) {
		d.source = networkObject.nodes[d.source];
		d.target = networkObject.nodes[d.target];
	});
	// Drawing links between device nodes
	curvers = curves.data(networkObject.links).enter().append("path")
	.attr("d", function(d){
		if((d.source.type.toLowerCase()=="switch" && d.target.type.toLowerCase()=="switch") && (d.source.group!=d.target.group))
		{
			return "M "+d.source.x+" "+d.source.y+" L "+d.target.x+" "+d.target.y;
		}
		else if((d.source.type.toLowerCase()=="rack" || d.target.type.toLowerCase()=="rack"))
		{
			return "M "+d.source.x+" "+d.source.y+" L "+d.target.x+" "+d.target.y;
		}
		else if((d.source.type.toLowerCase()=="corporate" || d.target.type.toLowerCase()=="corporate"))
		{
			return "M "+d.source.x+" "+d.source.y+" L "+d.target.x+" "+d.target.y;
		}
		else{
			// Curved links
			return "M "+d.source.x+" "+d.source.y
			+" Q "+(d.source.x+d.target.x)/2+" "+(d.target.y  -100) +" "
			+d.target.x+" "+d.target.y;
		}
	})
	.attr("id",function(d){
		return d.linkID;})
		.style("stroke-width", 0.7)
		.style("fill", "none")
		.on("mouseover", function(d) {  
			divLink.transition()        
			.duration(200)      
			.style("opacity", .9); 
			// When links are hovered, tool tip is created
			if(d.source.type.toLowerCase()=="rack" || d.target.type.toLowerCase()=="rack")
			{
				divLink.html("<b>Link Details: </b><br/><br/>"+"<b>Link Id: </b>"+d.linkID +"<br/>"
						+"<b>Device1: </b>"+d.source.name+"<br/>"+ "<b>Device2: </b>"+d.target.name+"<br/>") 
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 28) + "px");
			}else{
				divLink.html("<b>Link Details: </b><br/><br/>"+"<b>Link Id: </b>"+d.linkID +"<br/>"+"<b>Link Speed: </b>"+d.linkSpeed+"<br/>"
						+"<b>Device1: </b>"+d.source.name+"<br/>"+ "<b>Ports at Device1: </b>"+d.sport+"<br/>"+"<b>Device2: </b>"+d.target.name+"<br/>"
						+ "<b>Ports at Device2: </b>"+d.tport+"<br/>") 
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 28) + "px");
			}
		})                  
		.on("mouseout", function(d) { 
			divLink.transition()        
			.duration(500)      
			.style("opacity", 0);  

		});



	// brush used to drag and select multiple nodes
	brush.call(d3.svg.brush()
			.x(d3.scale.identity().domain([0, displayInformation.proposedWidth]))
			.y(d3.scale.identity().domain([0, displayInformation.proposedHeight]))
			.on("brush", function() {
				var extent = d3.event.target.extent();
				node.classed("selected", function(d) {
					return d.selected = 
						(extent[0][0] <= d.x && d.x < extent[1][0]
						&& extent[0][1] <= d.y && d.y < extent[1][1]);
				});
			})
			.on("brushend", function() {
				d3.event.target.clear();
				d3.select(this).call(d3.event.target);
			}));

	// A based on the type of the device, respective images should be added.
	node.append("image")
	.attr("xlink:href", function(d){
		// Role based images for switch device
		if(d.type.toLowerCase() == "switch"){
			if(d.errorst!="Healthy"){
				return getImageBasedOnDeviceType(d.role+" "+"error");
			}else{
				return getImageBasedOnDeviceType(d.role);
			}
		}else{
			if(d.errorst.toLowerCase()!="healthy"){
				return getImageBasedOnDeviceType(d.type+" "+"error");
			}else{
				return getImageBasedOnDeviceType(d.type);
			}
		}
	})
	.attr("width", displayInformation.proposedNodeRadius*2)
	.attr("height", displayInformation.proposedNodeRadius*2)
	.attr("x", -displayInformation.proposedNodeRadius)
	.attr("y", -displayInformation.proposedNodeRadius);

	//	Adding lables to all devices with their IP Address
	node.append('text')
	.attr("class","label")
	.text(function(d){ 
		if(d.type.toLowerCase()=="rack" || d.type.toLowerCase()=="ExternalDevice"){
			return d.name;
		}else{	
			return d.name+" - "+d.ip;
		}
	})
	.attr("x",0)
	.attr("y",-displayInformation.proposedNodeRadius);



	/*
	 * Operations on the node
	 */
	node = node.on("mousedown",function(d){
		if(d3.select(this).attr("class") != "node selected"){
			node.filter(function(d){return d.selected;}).classed("selected",false);
			node.each(function(d) {d.selected = false;});
		}
		d3.select(this).classed("selected", d.selected = true);
	})
	.on("mouseup",function(d){
		d3.selectAll(".selected").classed("selected",function(d){return d.selected = false;});
	})
	//  On click User is routed to next view if device clickes is Switch/Host. If Rack, it will be expanded into number of switch and hosts.
	.on("click",function(d){
		if (d3.event.defaultPrevented) 
		{
			return;
		}
		else if(phase.toLowerCase()=="racktopology" && d.type!=null && (d.type.toLowerCase()=="switch" || d.type.toLowerCase()=="host"))
		{
			return scope.onDeviceClick({item : d,prevSelectedVlan:$('#taggedVlan').val()});
		}
		else if(d.type.toLowerCase()=="rack" ){
			return scope.onRackClick({item : d,prevSelectedVlan:$('#taggedVlan').val()});	
		}

	})
	.call(d3.behavior.drag()
			.on("drag",function(d){ nudge(d3.event.dx,d3.event.dy);})
	);

	/*
	 * This is used for dragging.
	 * Positions the selected nodes at the new dragged location and links with respect to them will be redrawn.
	 */
	function nudge(dx,dy){
		// filters to select only the SELECTED nodes and moves them
		// to the new location
		node.filter(function(d) { return d.selected; })
		.attr("transform", function moveNode(d) {
			(d.x+dx+displayInformation.proposedNodeRadius > displayInformation.proposedWidth || 
					d.x+dx-displayInformation.proposedNodeRadius < 0	
					? d.x=d.x : d.x += dx);
			(d.y+dy+displayInformation.proposedNodeRadius > displayInformation.proposedHeight ||
					d.y+dy-displayInformation.proposedNodeRadius < 0
					? d.y=d.y : d.y += dy);
			return "translate(" + d.x + "," + d.y+ ")"; 
		});

		curvers.filter(function (d){ return d.source.selected;})
		.attr("d",function(d){
			if((d.source.type.toLowerCase()=="switch" && d.target.type.toLowerCase()=="switch") && (d.source.group!=d.target.group))
			{
				return "M "+d.source.x+" "+d.source.y+" L "+d.target.x+" "+d.target.y;
			}else if((d.source.type.toLowerCase()=="rack" || d.target.type.toLowerCase()=="rack"))
			{
				return "M "+d.source.x+" "+d.source.y+" L "+d.target.x+" "+d.target.y;
			}
			else if((d.source.type.toLowerCase()=="corporate" || d.target.type.toLowerCase()=="corporate"))
			{
				return "M "+d.source.x+" "+d.source.y+" L "+d.target.x+" "+d.target.y;
			}
			else{

				return "M "+d.source.x+" "+d.source.y
				+" Q "+(d.source.x+d.target.x)/2+" "+(d.target.y  -100) +" "
				+d.target.x+" "+d.target.y;
			}
		});

		curvers.filter(function (d){ return d.target.selected;})
		.attr("d",function(d){
			if((d.source.type.toLowerCase()=="switch" && d.target.type.toLowerCase()=="switch") && (d.source.group!=d.target.group))
			{
				return "M "+d.source.x+" "+d.source.y+" L "+d.target.x+" "+d.target.y;
			}else if((d.source.type.toLowerCase()=="rack" || d.target.type.toLowerCase()=="rack"))
			{
				return "M "+d.source.x+" "+d.source.y+" L "+d.target.x+" "+d.target.y;
			}
			else if((d.source.type.toLowerCase()=="corporate" || d.target.type.toLowerCase()=="corporate"))
			{
				return "M "+d.source.x+" "+d.source.y+" L "+d.target.x+" "+d.target.y;
			}
			else{
				return "M "+d.source.x+" "+d.source.y
				+" Q "+(d.source.x+d.target.x)/2+" "+(d.target.y  -100) +" "
				+d.target.x+" "+d.target.y;
			}
		});

	}

	/*
	 *	When jumping from one rack to other vlan selection will persist
	 */
	if(prevSelectedVlan!=null)
	{
		menuChangedForTaggedVlan(prevSelectedVlan);	
		$('#taggedVlan').val(prevSelectedVlan);
	}
	else{

	}

}
/**
 * 
 * @param deviceType Type of device as a string. e.g : "switch" or "server"
 * @returns {String} returns the image depending on the type of device
 */
function getImageBasedOnDeviceType(deviceType){
	switch(deviceType.toLowerCase()){
	case "externaldevice":
		return "app/img/cloud2.png";
	case "rack":
		return "app/img/Rack.png";
	case "corporate":
		return "app/img/cloud-icon.png";
	case "rack error":
		return "app/img/Rack-Error.png";
	case "spine":
		return "app/img/Spine.png";	
	case "spine error":
		return "app/img/Spine-Error.png";
	case "management":
		return "app/img/Management.png";	
	case "management error":
		return "app/img/Management-Error.png";	
	case "tor":
		return "app/img/Tor.png";	
	case "tor error":
		return "app/img/Tor-Error.png";	
	case "host":
		return "app/img/VMW-State-Icon-Short.png";
	case "host error":
		return "app/img/VMW-State-Icon-Short-Error.png";
	default :
		return "app/img/VMW-State-Icon-Warning_Medium.png";
	}
}
/**
 * This is used to build the 1st phase  ie. dashboard view of the topology display(See Top of the file for more information phases)
 * @param networkObject : Information about the topology
 * @param el : The directive element which calls this method
 * @param displayInformation : See addPositionInformation() for more information
 */
function buildMinimalD3Layout(networkObject,el,displayInformation){

	svg = d3.select(el[0])
	.each(function() { this.focus(); })
	.append("svg")
	.attr("width", displayInformation.proposedWidth)
	.attr("height", displayInformation.proposedHeight);

	var curves = svg.append("g")
	.attr("class","paths")
	.selectAll(".paths");
	var node = svg.selectAll(".nodeMinimal")
	.data(networkObject.nodes)
	.enter()
	.append("g")
	.attr("id",function(d){return d.name;})
	.attr("class","nodeMinimal")
	// nodes have been appended with (x,y) positions where they should be
	// placed( see the addPositionInformation() for more details
	.attr("transform", function(d) { 
		return "translate(" + d.x + "," + d.y + ")"; });

	networkObject.links.forEach(function(d) {
		d.source = networkObject.nodes[d.source];
		d.target = networkObject.nodes[d.target];
	});

	curvers = curves.data(networkObject.links).enter().append("path")
	.attr("d", function(d){
		console.log(d.linkID);
		if(d.source.group==d.target.group)
		{	
			return "M "+d.source.x+" "+d.source.y
			+" Q "+(d.source.x+d.target.x)/2+" "+(d.target.y-50) +" "
			+d.target.x+" "+d.target.y;}
		else{
			return "M "+d.source.x+" "+d.source.y+" L "+d.target.x+" "+d.target.y;
		}
	})
	.style("stroke-width", 1)
	.style("fill", "none");
	node.append("image")
	.attr("xlink:href", function(d){
		if(d.type.toLowerCase() == "switch"){
			if(d.errorst.toLowerCase()!="healthy"){
				return getImageBasedOnDeviceType(d.role.toLowerCase()+" "+"error");
			}else{
				return getImageBasedOnDeviceType(d.role.toLowerCase());
			}
		}else{
			if(d.errorst.toLowerCase()!="healthy"){
				return getImageBasedOnDeviceType(d.type.toLowerCase()+" "+"error");
			}else{
				return getImageBasedOnDeviceType(d.type.toLowerCase() );
			}
		}})
		.attr("width", displayInformation.proposedNodeRadius*2)
		.attr("height", displayInformation.proposedNodeRadius*2)
		.attr("x", -displayInformation.proposedNodeRadius)
		.attr("y", -displayInformation.proposedNodeRadius);
}


/**
 * This updates the networkObject with more information about positions for each node(devices)
 * @param networkObject : Information about the devices, their levels (more about levels at the top)
 * and the connection between them
 * @param networkInformation : Contains some derived information about networkObject e.g Total number of levels etc
 * @param displayInformation : Depending on the screen size and the number of devices present,
 * the size of the devices are adjusted to fit maximum number of devices on the screen, while maintaining 
 * readability.
 * @returns : An updated networkObject with (x,y) positions of where each node should be placed
 */

function addPositionInformation(networkObject,networkInformation,displayInformation,headerSize){
	var xPosArray = [];
	var yPosArray = [];
	var yInterval;
	var xInterval;
	//yInterval = displayInformation.proposedHeight/(networkInformation.numberOfLevels);
	yInterval=displayInformation.vpadding;

	for(i in networkObject.nodes){
		var level = networkObject.nodes[i].group;
		var numberOfDevicesInThisLevel = networkInformation.numberOfDevicesInEachLevel[level];
		xInterval = displayInformation.proposedWidth/numberOfDevicesInThisLevel;

		if(typeof xPosArray[level] == "undefined"){
			xPosArray[level] = xInterval - 0.5*xInterval;
			yPosArray[level] = (level * yInterval - 0.5*yInterval) ;
		}else{
			xPosArray[level] += xInterval;
		}
		networkObject.nodes[i]["x"] = xPosArray[level];
		networkObject.nodes[i]["y"] = yPosArray[level];
	}

	return networkObject;
}
/**
 * 	Additional method which will set position information differently when rack is expanded to keep more spacing between switches 
 * 	and less spacing between hosts.
 * @param networkObject
 * @param networkInformation
 * @param displayInformation
 * @param headerSize
 * @returns
 */
function addPositionInformationForTopo(networkObject,networkInformation,displayInformation,headerSize){
	var xPosArray = [];
	var yPosArray = [];
	var yInterval;
	var xInterval;
	//yInterval = displayInformation.proposedHeight/(networkInformation.numberOfLevels);
	yInterval=displayInformation.vpadding;
	for(i in networkObject.nodes){
		if(networkObject.nodes[i].type.toLowerCase()!="host"){
			var level = networkObject.nodes[i].group;
			var numberOfDevicesInThisLevel = networkInformation.numberOfDevicesInEachLevel[level];
			xInterval = displayInformation.proposedWidth/numberOfDevicesInThisLevel;

			if(typeof xPosArray[level] == "undefined"){
				xPosArray[level] = xInterval - 0.5*xInterval;
				yPosArray[level] = (level * yInterval - 0.5*yInterval) ;
			}else{
				xPosArray[level] += xInterval;
			}
			networkObject.nodes[i]["x"] = xPosArray[level];
			networkObject.nodes[i]["y"] = yPosArray[level];

		}
	}
	var cumulativex=0;
	var count=0;
	for(i in networkObject.nodes){
		if(networkObject.nodes[i].type.toLowerCase()=="switch" && networkObject.nodes[i].role.toLowerCase()!="spine" &&
				networkObject.nodes[i].role.toLowerCase()!="management"){
			count=count+1;
			cumulativex=cumulativex+networkObject.nodes[i]["x"];
		}
	}
	// If Tors are not available then position of Hosts will be middle of SVG otherwise between TORs
	if(cumulativex==0){
		cumulativex=displayInformation.proposedWidth/2;
	}else{
		cumulativex=cumulativex/count;
	}

	yIntervalForHost=displayInformation.hostpadding;
	for(i in networkObject.nodes){

		if(networkObject.nodes[i].type.toLowerCase()=="host"){
			var level = networkObject.nodes[i].group;
			networkObject.nodes[i]["x"] = cumulativex;
			networkObject.nodes[i]["y"] =((2*yInterval)+((level-2) * yIntervalForHost) - 0.5*yIntervalForHost);
		}
	}

	return networkObject;
}

/*
 * Method sets SVG width and height, size of icons, distance between devices.
 * It calculates number of levels present overall. For example if there are 2 Spines(On level 1) 2 tors and 1 management (on level 2) and 2 hosts (Level 3 and 4). In this case
 * Maximum number of level will be 4. Based on this level calculation it will calculate required height for levels (4 * padding) which will be assigned as height of SVG.
 * Width calculation is done based on max number of devices available in any of the level. In above stated scenario level 2 has max devices(ie. 3). In this case
 * width of SVG will be padding * 3
 */

/**
 *  @param networkInformation
 * @param isMinimalDisplay
 * @param width
 * @param height
 * @param hostpadding
 * @param vpadding
 * @param padding
 * @param minDiameter
 * @param maxDiameter
 */
function calculateDisplayInformation(networkInformation,isMinimalDisplay,width,height,hostpadding,vpadding,hpadding,minDiameter,maxDiameter){

	var widthAfterPadding=0;
	var heightAfterPadding=0;
	var proposedWidth = width,proposedHeight = height, proposedNodeDiameter =maxDiameter;
	if(networkInformation.numberOfLevels<=2){
		widthAfterPadding = 2*hpadding*(networkInformation.maxNoOfDevicesInAnyLevel);
		heightAfterPadding =2*vpadding*(networkInformation.numberOfLevels);

	}else{
		widthAfterPadding = 2*hpadding*(networkInformation.maxNoOfDevicesInAnyLevel);
		heightAfterPadding =(2*vpadding*2)+hostpadding*(networkInformation.numberOfLevels-2);

	}
	if(!isMinimalDisplay){
		if(widthAfterPadding>proposedWidth){
			proposedWidth=widthAfterPadding;
		}
		if(heightAfterPadding>proposedHeight){
			proposedHeight=heightAfterPadding;
		}
	}else{
		proposedNodeDiameter=maxDiameter;
	}

	var finalWidth = (isMinimalDisplay ? width : proposedWidth);
	var finalHeight = (isMinimalDisplay ? height : proposedHeight);

	return {
		"proposedNodeRadius":proposedNodeDiameter/2,
		"proposedWidth":finalWidth,
		"proposedHeight":finalHeight,
		"vpadding":vpadding,
		"hostpadding":hostpadding
	};
}

/**
 * Derives additional information from the nodes likw number of levels and max number of devices in any of the level.
 * @param nodes : All nodes(devices)
 * @returns total number of levels, devices on each level, maxNoOfDevicesInAnyLevel
 */
function getNetworkInformation(nodes){
	var numberOfLevels = 0;
	var numberOfDevicesInEachLevel = [];
	var maxNoOfDevicesInAnyLevel = 0;
	for(i in nodes){
		if(typeof numberOfDevicesInEachLevel[nodes[i].group] == "undefined"){
			numberOfDevicesInEachLevel[nodes[i].group] = 1;
			numberOfLevels++;
		}else{
			numberOfDevicesInEachLevel[nodes[i].group]++;
		}

		if(maxNoOfDevicesInAnyLevel < numberOfDevicesInEachLevel[nodes[i].group]){
			maxNoOfDevicesInAnyLevel = numberOfDevicesInEachLevel[nodes[i].group];
		}
	}
	return {"numberOfLevels":numberOfLevels,"numberOfDevicesInEachLevel":numberOfDevicesInEachLevel,"maxNoOfDevicesInAnyLevel":maxNoOfDevicesInAnyLevel};
}

/*********************DIRECTIVE*************************************/
/*
 * 	Directive for Dashboard view.
 */
vrmUI.directive('minimalTopology',function(){ 
	function preLink(scope,el,attr){
		var networkObject = scope.networkData;
		var tempVar=null;
		var idForFirstViewObject="main";
		
		/*
		 * Hardcoded width and height to suite dashboard window,
		 */
		var width=165;
		var	height=145;
		var hpadding=70;
		var vpadding=70;
		var hostpadding=0;
		var minDiameter=30;
		var maxDiameter=40;
		networkObject=networkObject.complete;
		/*
		 * JSON created with MAIN id will be used here to render UI.
		 */
		for(i in networkObject){
			if(networkObject[i].id==idForFirstViewObject){
				tempVar=networkObject[i];
				break;
			}
		}
		networkObject=tempVar;
		networkInformation = getNetworkInformation(networkObject.nodes);
		var displayInformation = calculateDisplayInformation(networkInformation,true,width,height,hostpadding,vpadding,hpadding,minDiameter,maxDiameter); 
		networkObject = addPositionInformation(networkObject,networkInformation,displayInformation);
		buildMinimalD3Layout(networkObject,el,displayInformation);

	}
	return{
		restrict : 'E',
		scope : {networkData : '=',
			topologyDisplayed : '&'},
			compile : function compile(scope,el,attr){
				return{
					pre: preLink,
					post : function postLink(scope,el,attr){
						scope.topologyDisplayed();
					}
				};
			}
	};
});
/**********************************************************************************/
/*
 * Directive used for Top level second view. 
 */
vrmUI.directive('completeTopology',function(){ 
	function link(scope,el,attr){
		var tempVar=null;
		var networkObject = scope.networkData;
		var idForSecondViewObject="main";
		var titleForSecondView="Top Level View of Topology";
		var phase="COMPLETETOPOLOGY";
		// Horizontal and Vertical Padding
		var hpadding=40;
		var vpadding=200;
		var hostpadding=0;
		// Max and Min size of device icons.
		var minDiameterOfDeviceIcon=65;
		var maxDiameterOfDeviceIcon=70;
		networkObject=networkObject.complete;
		for(i in networkObject){
			if(networkObject[i].id==idForSecondViewObject){
				tempVar=JSON.parse(JSON.stringify(networkObject[i]));
				break;
			}
		}
		networkObject=tempVar;
		var networkInformation = getNetworkInformation(networkObject.nodes);
		var height = $(window).height() - $('.header-content').height();
		var width = $(window).width() - $('.side-panel').width();
		var displayInformation = calculateDisplayInformation(networkInformation,false,width,height,hostpadding,vpadding,hpadding,minDiameterOfDeviceIcon,maxDiameterOfDeviceIcon);
		networkObject = addPositionInformation(networkObject,networkInformation,displayInformation);

		buildD3Layout(scope,networkObject,el,displayInformation,titleForSecondView,phase);

	}
	return{
		restrict : 'E',
		link: link,
		scope : {
			networkData : '=',
			onRackClick : '&rackClick',
			onDeviceClick: '&deviceClick'
		},
		replace: true
	};

});


/*******************************************************************************************************************************************************/
/*
 *  These two directives toggle to show expanded third view of racks.
 */

vrmUI.directive('expandedView',function(){ 
	function link(scope,el,attr){

		createRackLevelView(scope,el,attr);
	}
	return{
		restrict : 'E',
		link: link,
		scope : {
			clickedRack : '=',
			networkData : '=',
			prevSelectedVlan : '=',
			onRackClick : '&rackClick',
			onDeviceClick : '&deviceClick'
		},
		replace: true

	};
});
/*******************************************************************************************************************************************************/

vrmUI.directive('expandedViewextra',function(){ 
	function link(scope,el,attr){
		createRackLevelView(scope,el,attr);

	}
	return{
		restrict : 'E',
		link: link,
		scope : {
			clickedRack : '=',
			networkData : '=',
			prevSelectedVlan : '=',
			onRackClick : '&rackClick',
			onDeviceClick : '&deviceClick'
		},
		replace: true
	};
});

/*******************************************************************************************************************************************************/

/*
 * When clicked on Rack in 2nd Rack level view this function updates nodes and links to show updated view with one of the rack expanded.
 */
function createRackLevelView(scope,el,attr){

	var phase="RACKTOPOLOGY";
	var padding=100;
	var vpadding=200;
	var hostpadding=100;
	var minDiameter=65;
	var maxDiameter=70;
	var idForSecondViewObject="main";
	var rack=scope.clickedRack;
	var rackName=rack.name;
	var titleForSecondView="Top Level View of Topology: "+rackName;
	var networkObject = scope.networkData;
	var mainObject=null;
	var rackObject=null;
	var cumulativeObject=null;
	/*
	 * While jumping from one rack to other vlan selection will persist. Here prevSelectedVlan stores selection and later while creating layout calls function with 
	 * this selection to render UI to show vlan selection.
	 */
	var prevSelectedVlan=scope.prevSelectedVlan;
	console.log("prevSelectedVlan "+prevSelectedVlan);
	var selectedValue=scope.prevSelectedVlan;
	if(selectedValue=="Available VLANs"){
		prevSelectedVlan=null;
	}
	
	/*
	 * When clicked on Rack we need to show expanded rack but at the same time keep remaining view as it is. Hence we update nodes and links by addion additional 
	 * nodes and links of particular selected rack. 
	 */
	networkObject=networkObject.complete;
	for(i in networkObject){
		if(networkObject[i].id==idForSecondViewObject){
			mainObject=JSON.parse(JSON.stringify(networkObject[i]));
			break;
		}
	}

	for(i in networkObject){
		if(networkObject[i].id==rackName){
			rackObject=JSON.parse(JSON.stringify(networkObject[i]));
			break;
		}
	}
	
	cumulativeObject=JSON.parse(JSON.stringify(rackObject));

	cumulativeObject.nodes=[];
	/*
	 * Adding all the nodes of spine switches and corporate.
	 */
	for(x in mainObject.nodes){
		var switchNode=mainObject.nodes[x];
		var type=switchNode.type;
		var role=switchNode.role;
		if((type.toLowerCase()=="switch" && role.toLowerCase()=="spine") || type.toLowerCase()=="corporate"){
			cumulativeObject.nodes.push(JSON.parse(JSON.stringify(mainObject.nodes[x])));
		}
	}
	/*
	 *  Adding hosts of selected rack.
	 */
	for(x in rackObject.nodes){
		var switchNode=rackObject.nodes[x];
		var type=switchNode.type;
		if(type.toLowerCase()!="switch" && type.toLowerCase()!="corporate"){
			cumulativeObject.nodes.push(JSON.parse(JSON.stringify(rackObject.nodes[x])));
		}
	}

	var rackObjectClone1=JSON.parse(JSON.stringify(rackObject));
	var rackObjectClone2=JSON.parse(JSON.stringify(rackObject));
	var mainObjectClone=JSON.parse(JSON.stringify(mainObject));
	var loopFlag=true;
	var torsAvailable=false;
	
	
	for(j in mainObjectClone.nodes){
		var rackNode1=mainObjectClone.nodes[j];
		var name1=rackNode1.name;
		var type1=rackNode1.type;
		/*
		 * Adding racks other than selected one
		 */
		if((type1.toLowerCase()=="rack") && name1!=rackName){
			cumulativeObject.nodes.push(JSON.parse(JSON.stringify(rackNode1)));
		}else if(type1.toLowerCase()=="rack" && name1==rackName){
			
			for(z in rackObjectClone1.nodes){
				var switchNode2=rackObjectClone1.nodes[z];
				var type2=switchNode2.type;
				var role2=switchNode2.role;
				/*
				 * Adding Tor and Management switches. To keep management switch in between and Tor Switch at the end, it first adds first tor and then iterates again
				 * to add management switch. Once all the management switches are added it adds next Tor switch. Hence Two tors will be at the opposite ends where as
				 * Management switch will remain always at the center. This is done so that Hosts will be displayed in appropriate way between two tors.
				 */
				if(type2.toLowerCase()=="switch" && role2.toLowerCase()=="tor"){
					cumulativeObject.nodes.push(JSON.parse(JSON.stringify(switchNode2)));
					torsAvailable=true;
					if(loopFlag){
						for(y in rackObjectClone2.nodes){
							var switchNode2=rackObjectClone2.nodes[y];
							var type=switchNode2.type;
							var role=switchNode2.role;
							if(type.toLowerCase()=="switch" && role.toLowerCase()=="management"){
								cumulativeObject.nodes.push(JSON.parse(JSON.stringify(switchNode2)));
							}

						}
						loopFlag=false;
					}
				}

			}
			/*
			 * In case if Tors are not available then only Management Switch will be added.
			 */
			if(!torsAvailable){
				for(y in rackObjectClone2.nodes){
					var switchNode2=rackObjectClone2.nodes[y];
					var type=switchNode2.type;
					var role=switchNode2.role;
					if(type.toLowerCase()=="switch" && role.toLowerCase()=="management"){
						cumulativeObject.nodes.push(JSON.parse(JSON.stringify(switchNode2)));
					}

				}
			}
		}else{

		}
	}

	/*
	 * All the links which are not connected to selected Rack will be added
	 */
	for(k in mainObject.links){
		var sourceDev=mainObject.links[k].sourceName;
		var targetDev=mainObject.links[k].targetName;
		if(sourceDev!=rackName && targetDev!=rackName)
		{
			cumulativeObject.links.push(JSON.parse(JSON.stringify(mainObject.links[k])));
		}
	}

	var setT = Object.create(null);
	for(i in cumulativeObject.nodes){
		setT[cumulativeObject.nodes[i].name]=i;
	}

	/*
	 * Since new nodes are added in the array we need to update links so that Source and Target will point to right device.
	 */
	for(i in cumulativeObject.links){
		cumulativeObject.links[i].source=setT[cumulativeObject.links[i].sourceName];
		cumulativeObject.links[i].target=setT[cumulativeObject.links[i].targetName];

	}
	expandedObject=cumulativeObject;
	var networkInformation = getNetworkInformation(expandedObject.nodes);
	var height = $(window).height() - $('.header-content').height();
	var width = $(window).width() - $('.side-panel').width();
	var displayInformation = calculateDisplayInformation(networkInformation,false,width,height,hostpadding,vpadding,padding,minDiameter,maxDiameter);
	expandedObject = addPositionInformationForTopo(expandedObject,networkInformation,displayInformation);
	

	buildD3Layout(scope,expandedObject,el,displayInformation,titleForSecondView,phase,prevSelectedVlan);
}


/*********************************************************************************************************************************************************/

/*
 * USED FOR 4th View (see top for more info on phases). When clicked on particular device(Switch or Host) it will render the po
 */
vrmUI.directive('deviceDetails',function(){ 
	function link(scope,el,attr){
		var networkObject = scope.deviceData;
		var headerSize=36;
		var networkInformation = getNetworkInformation(networkObject.nodes);
		var height = $(window).height() - $('.header-content').height();
		var width = $(window).width() - $('.side-panel').width();
		var titleForThirdView="Rack Level View of Topology";
		var phase="RACKTOPOLOGY";
		var padding=80;
		var minDiameter=65;
		var maxDiameter=70;
		var displayInformation = calculateDisplayInformation(networkInformation,false,width,height,padding,minDiameter,maxDiameter);
		networkObject = addPositionInformation(networkObject,networkInformation,displayInformation,headerSize);
		buildD3Layout(scope,networkObject,el,displayInformation,titleForThirdView,phase);

	}
	return{
		restrict : 'E',
		link: link,
		scope : {
			deviceData : '=',
			onRackClick : '&rackClick'}

	};

});

/*********************************************************************************/

/*
 *  ISSUE NEEDS TO BE RESOLVED: When user tries to jump from one rack to another same directive needs to be called multiple times from controller. Currently 
 *  controller is not able to call same directive multiple times. As a work around two directives are created which calls each other.
 */
vrmUI.controller('CompleteTopologyController', function($scope,$location, $modal,$rootScope, $route, NetworkTopologyService) {
	$rootScope.pageContextObject = $route.current.data;
	$scope.loadTopologyInfo = false;
	$scope.topologyLoaded = false;
	$scope.rackTopologyInfo = false;
	$scope.showCompleteTopology = true;
	$scope.showDeviceDetails = false;
	$scope.deviceInformation = null;
	$scope.showDeviceDetails = false;
	$scope.networkTopologyObject =JSON.parse(JSON.stringify( NetworkTopologyService.getTopologyDetails()));
	$scope.loadTopologyInfo = true;
	$scope.loadExpandedView=false;
	$scope.showExpandedView=false;
	var selectedRack=null;
	$scope.toplevelTopology=function(item,prevSelectedVlan){
		selectedRack=null;
		$scope.loadTopologyInfo = false;
		$scope.topologyLoaded = false;
		$scope.loadExpandedView=false;
		$scope.showExpandedView=false;
		$scope.showCompleteTopology = false;
		$scope.loadTopologyInfo = false;
		$scope.loadExpandedViewextra=false;
		$scope.showExpandedViewextra=false;
		$scope.networkCompleteObject =JSON.parse(JSON.stringify( NetworkTopologyService.getTopologyDetails()));
		$scope.prevSelectedVlan=prevSelectedVlan;
		$scope.showCompleteTopology=true;
		$scope.loadTopologyInfo=true;
	};
	$scope.onRackClick1 = function(item,prevSelectedVlan){
		selectedRack=JSON.parse(JSON.stringify(item));
		
		$scope.loadTopologyInfo = false;
		$scope.topologyLoaded = false;
		$scope.clickedRack=item;
		$scope.loadExpandedView=false;
		$scope.showExpandedView=false;
		$scope.showCompleteTopology = false;
		$scope.loadTopologyInfo = false;
		$scope.loadExpandedViewextra=false;
		$scope.showExpandedViewextra=false;
		$scope.networkCompleteObject =JSON.parse(JSON.stringify( NetworkTopologyService.getTopologyDetails()));
		$scope.prevSelectedVlan=prevSelectedVlan;
		$scope.loadExpandedView=true;
		$scope.showExpandedView=true;

	};

	$scope.onRackClick2 = function(item,prevSelectedVlan){
		selectedRack=JSON.parse(JSON.stringify(item));
		$scope.loadTopologyInfo = false;
		$scope.topologyLoaded = false;
		$scope.clickedRack=item;
		$scope.loadExpandedView=false;
		$scope.showExpandedView=false;
		$scope.showCompleteTopology = false;
		$scope.loadTopologyInfo = false;
		$scope.networkCompleteObject =JSON.parse(JSON.stringify( NetworkTopologyService.getTopologyDetails()));
		$scope.prevSelectedVlan=prevSelectedVlan;
		$scope.loadExpandedViewextra=true;
		$scope.showExpandedViewextra=true;

	};

	$scope.onDeviceClick = function(item,prevSelectedVlan) {
		var scope = $rootScope.$new();
		scope.params = {
				rackId: item.rack,
				deviceId:item.name,
				deviceType:item.type,
				rackUUID:item.rackUUID,
				rackIP:item.rackIp
		};

		$rootScope.modalInstance = $modal.open({
			scope: scope,
			templateUrl: "app/views/detail-switch-view.html",
			backdrop: "static",
			keyboard: false
		});
	};
});

/**********************************************************************************/
/*
 * Controller to display popup with device level details for switch and hosts.
 */
vrmUI.controller('detailswitchController', function($scope, $rootScope,$routeParams, $modal,$route, NetworkTopologyService, NetworkConfigService, PhysicalNetworkSetupService, $filter) {
	var rackId=$scope.params.rackId;
	var deviceType=$scope.params.deviceType;
	var rackIp=$scope.params.rackIP;
	var rackUUID=$scope.params.rackUUID;
	var deviceId=$scope.params.deviceId;

	$rootScope.pageContextObject = $route.current.data;
	$scope.switcherror = '';
	$scope.switchType=false;
	$scope.hostType=false;
	//Close the popup modal
	$scope.cancel = function() {
		$rootScope.modalInstance.close();
	};

	if(deviceType.toLowerCase()=="switch")
	{
		//Get the switch details
		$scope.switchType=true;	
		$scope.getSwitchDetails = function() {
			//service call to get switch info

			NetworkTopologyService.getAllSwitches(rackIp,rackUUID,rackId,function(data) {
				if (data.status.toLowerCase() != "falied" &&  data.object!=null) {

					var switchDetails= JSON.parse(data.object);
					var switches=switchDetails.object;
					for(i in switches){
						if(switches[i].nodeId==deviceId){
							$scope.switchDetail=switches[i];
							break;
						}
					}
				} else {
					throw "Failed to load switch information";
				}

			}, function(data) {
				// Loading Mask
				$rootScope.ShowFullScreenLoading = false;
				$rootScope.ShowFullScreenLoadingMsg = '';
				$scope.showRacks = false;
				$scope.rackListError = $filter('translate')('physicalresource.controller.FAILED_RACK_LIST_ERROR');
				$scope.waitAndErrorMsg = $filter('translate')('physicalresource.controller.FETCH_RACK_LIST_ERROR')+data["code"];
			});
		};

		NetworkTopologyService.getSwitchInformation(rackIp,rackId, deviceId,function(data) {
			if (data.status.toLowerCase() != "failed" &&  data.object!=null) {
				var interfaceDetails= JSON.parse(data.object);
				$scope.interfaces=interfaceDetails.object;
			} else {
				throw "Failed to load switch information";
			}

		}, function(data) {
			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			$scope.showRacks = false;
			$scope.rackListError = $filter('translate')('physicalresource.controller.FAILED_RACK_LIST_ERROR');
			$scope.waitAndErrorMsg = $filter('translate')('physicalresource.controller.FETCH_RACK_LIST_ERROR')+data["code"];
		});

		$scope.showInterfaceDetails=function(interfaceId){
			if(interfaceId!=null)
			{
				var interfaces=$scope.interfaces;
				for(i in interfaces){

					if(interfaces[i].name==interfaceId){
						var stats=interfaces[i].statistics;
						var status="Healthy";
						if(stats.txErrors>0 || stats.rxErrors>0 ){
							status="Error";
						}
						$scope.interfDetails={
								"interfaceName" :interfaces[i].name,
								"interfaceMacAddress":interfaces[i].macAddress,
								"speed":interfaces[i].speed,
								"flags":interfaces[i].flags,
								"status":interfaces[i].status,
								"errstatus":status,
								"mtu":interfaces[i].mtu,
								"type":interfaces[i].type
						};
					}
				}
			}
		};
	}else if(deviceType.toLowerCase()=="host"){
		$scope.hostType=true;
		console.log("hosts");
		console.log("deviceId"+deviceId);

		NetworkTopologyService.getAllHosts(rackIp,rackUUID,rackId,function(data) {

			if (data.status.toLowerCase() != "failed" &&  data.object!=null) {
				var hobject=JSON.parse(data.object);
				var hostObject=hobject.object;
				var hostDetails= hostObject.hosts;
				var hostDetail=null;
				for(i in hostDetails){
					if(hostDetails[i].node==deviceId){
						hostDetail=hostDetails[i];
						break;
					}
				}
				$scope.hostDetails=hostDetail;

			} else {
				$scope.hosterror = "Failed to load switch information";	
			}

		}, function(data) {
			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			$scope.showRacks = false;
			$scope.rackListError = $filter('translate')('physicalresource.controller.FAILED_RACK_LIST_ERROR');
			$scope.waitAndErrorMsg = $filter('translate')('physicalresource.controller.FETCH_RACK_LIST_ERROR')+data["code"];
		});
		$scope.nics=[];
		var nics=[];
		NetworkTopologyService.getHostInformation(rackIp,rackId,deviceId,function(data) {
			console.log("host ports");
			if (data.status.toLowerCase() != "failed" &&  data.object!=null) {
				var hobject=JSON.parse(data.object);
				var hostObject=hobject.object;

				for(i in hostObject){
					var manufacturerObject=hostObject[i];
					var manufacturer=manufacturerObject.manufacturer;
					var productName=manufacturerObject.productName;
					var nic=[];
					nic=manufacturerObject.portInfos;	

					for(j in nic){
						var nicTemp = Object.create(null);	
						console.log(nic[j].deviceName);
						nicTemp.manufacturer=manufacturer;
						nicTemp.productName=productName;
						nicTemp.driver=nic[j].driver;
						var currentLinkSpeed=nic[j].currentLinkSpeed;
						var maxLinkSpeed=nic[j].maxLinkSpeed;
						nicTemp.currentLinkSpeed=currentLinkSpeed.speed+" "+currentLinkSpeed.unit;
						nicTemp.maxLinkSpeed=maxLinkSpeed.speed+" "+maxLinkSpeed.unit;
						nicTemp.macAddress=nic[j].macAddress;
						nicTemp.gratituousARPInterval=nic[j].gratituousARPInterval;
						nicTemp.nicName=nic[j].deviceName;
						nicTemp.linkStatus=nic[j].linkStatus;
						console.log(nicTemp.linkStatus);
						nics.push(nicTemp);
					}

				}
				$scope.nics=nics;

				console.log($scope.nics);
			}else {
				throw "Failed to load host information";	
			}

		}, function(data) {
			// Loading Mask
			$rootScope.ShowFullScreenLoading = false;
			$rootScope.ShowFullScreenLoadingMsg = '';
			$scope.showRacks = false;
			$scope.rackListError = $filter('translate')('physicalresource.controller.FAILED_RACK_LIST_ERROR');
			$scope.waitAndErrorMsg = $filter('translate')('physicalresource.controller.FETCH_RACK_LIST_ERROR')+data["code"];
		});

		$scope.showHostInterfaceDetails=function(nic){

			if(nic!=null){
				for(j in nics){

					if(nic==nics[j].nicName.toLowerCase()){

						$scope.nicDetails={
								"manufacturer":nics[j].manufacturer,
								"productName":nics[j].productName,
								"driver":nics[j].driver,
								"currentLinkSpeed":nics[j].currentLinkSpeed,
								"maxLinkSpeed":nics[j].maxLinkSpeed,
								"macAddress":nics[j].macAddress,
								"nicName":nics[j].nicName,
								"linkStatus":nics[j].linkStatus
						};
						break;
					}
				}
			}
		};
	}
});

/**********************************************************************************************************************************/

/*
 * Topology Controller is used to render dashboard view of topology.
 */
vrmUI.controller('TopologyController', function($scope, $rootScope, $modal, $route, NetworkTopologyService, AlertMessaging) {

	$rootScope.pageContextObject = $route.current.data;
	$scope.loadTopologyInfo = false;
	$scope.topologyLoaded = false;
	$scope.showCompleteTopology = false;
	$scope.showDeviceDetails = false;
	$scope.deviceInformation = null;

	$scope.loadingCards=true;
	$scope.displayMiniTopology = function(){
		$scope.waitForDeviceImage=false;
	};

	NetworkTopologyService.buildNetworkTopologyForDashboard(function(data) {
		$scope.networkTopologyObject = JSON.parse(data.object);
		$scope.loadTopologyInfo = true;
		$scope.topologyLoaded = true;
		NetworkTopologyService.setTopologyDetails(JSON.parse(data.object));
		$scope.loadingCards=false;
	},
	function(data){
		throw "ERROR Loading Network Topology Information";
	});


});
