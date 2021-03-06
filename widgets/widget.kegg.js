(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "KEGG Mapper",
                name: "kegg",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });

    widget.setup = function () {
	return [ Retina.load_renderer({"name": "keggmap", "resource": "renderers/"}),
		 Retina.load_renderer("listselect"),
		 Retina.load_renderer("table")
	       ];
    };
    
    widget.idsa = [];
    widget.idsb = [];

    widget.display = function (wparams) {
	widget = this;
	var index = widget.index;

	// initialize target div
	var target = wparams.target;
	target.innerHTML = "";

	// check if the metadata is loaded
	if (! stm.DataStore.hasOwnProperty('metagenome')) {
	    var progress = document.createElement('div');
	    progress.innerHTML = '<div class="alert alert-block alert-info" id="progressIndicator" style="position: absolute; top: 250px; width: 400px; right: 38%;">\
<button type="button" class="close" data-dismiss="alert">×</button>\
<h4><img src="Retina/images/loading.gif"> Please wait...</h4>\
<p>The data to be displayed is currently loading.</p>\
<p id="progressBar"></p>\
</div>';
        target.appendChild(progress);
	    jQuery.getJSON('data/mg_mixs_public.json', function(data) {
	        stm.import_data({ data: data });
		widget.display(wparams);
            }).fail( function() {
		stm.get_objects({"type":"metagenome","options":{"status":"public","verbosity":"mixs","limit":'9999'}}).then(function(){
                    widget.display(wparams);
		});
            });
            return;
	}
	
	// parse the metadata for the metagenome select
	var metagenome_data = [];
	for (var i in stm.DataStore["metagenome"]) {
	    if (stm.DataStore["metagenome"].hasOwnProperty(i)) {
		var md = { "name": stm.DataStore["metagenome"][i]["name"],
			   "id": i,
			   "project": stm.DataStore["metagenome"][i]["project_name"]+" ("+stm.DataStore["metagenome"][i]["project_id"]+")",
   			   "PI": stm.DataStore["metagenome"][i]["PI_lastname"]+", "+stm.DataStore["metagenome"][i]["PI_firstname"],
   			   "status": stm.DataStore["metagenome"][i]["status"],
   			   "created": stm.DataStore["metagenome"][i]["created"],
			   "lat/long": stm.DataStore["metagenome"][i]["latitude"]+"/"+stm.DataStore["metagenome"][i]["longitude"],
			   "location": stm.DataStore["metagenome"][i]["location"]+" - "+stm.DataStore["metagenome"][i]["country"],
			   "collection date": stm.DataStore["metagenome"][i]["collection_date"],
			   "biome": stm.DataStore["metagenome"][i]["biome"],
			   "feature": stm.DataStore["metagenome"][i]["feature"],
			   "material": stm.DataStore["metagenome"][i]["material"],
			   "env_package": stm.DataStore["metagenome"][i]["env_package_type"],
			   "sequencing method": stm.DataStore["metagenome"][i]["seq_method"],
			   "sequencing type": stm.DataStore["metagenome"][i]["sequence_type"]
			 };
		metagenome_data.push(md);
	    }
	}

	var graph_space = document.createElement('div');
	graph_space.setAttribute('id', 'kegg_map_svg_target');
	var table_space = document.createElement('div');
	var menu_space = document.createElement('div');

	table_space.setAttribute('style', 'margin-top: 40px;');

	widget.graph_space = graph_space;
	widget.table_space = table_space;

	wparams.target.appendChild(menu_space);
	wparams.target.appendChild(graph_space);
	wparams.target.appendChild(table_space);
		
	menu_space.innerHTML = "<p style='font-size:18px;font-weight:bold;float: left;'>Group A (green)</p><p style='float: left;width:480px; margin-left: 50px;'></p><p style='font-size: 18px;font-weight:bold;'>Group B (blue)</p>";

	var ls = document.createElement('div');
	var lsouter = document.createElement('div');
	lsouter.setAttribute('style', 'float: left; margin-right: 50px; margin-bottom: 20px;');
	lsouter.appendChild(ls);
	menu_space.appendChild(lsouter);
	var listrend = Retina.Renderer.create('listselect', {
	    target: ls,
	    multiple: true,
	    style: 'float: left;',
	    data: metagenome_data,
	    value: "id",
	    filter: ["name", "id", "project", "PI", "status", "created", "lat/long", "location", "collection date", "biome", "feature", "material", "env_package", "sequencing method", "sequencing type"],
	    callback: function (data) {
		widget.redraw(data,null);
	    }
	});
	listrend.render();

	var ls2 = document.createElement('div');
	menu_space.appendChild(ls2);
	var listrend2 = Retina.Renderer.create('listselect', {
	    target: ls2,
	    multiple: true,
	    style: 'float: left;',
	    data: metagenome_data,
	    value: "id",
	    filter: [ "name", "id", "project", "lat/long", "location", "collection date", "biome", "feature", "material", "package", "sequencing method" ],
	    callback: function (data) {
		widget.redraw(null,data);
	    }
	});
	listrend2.render();

	var separator = document.createElement('div');
	separator.setAttribute('style', 'display: block; clear: both;');
	menu_space.appendChild(separator);

	var btn2 = document.createElement('button');
	btn2.setAttribute('class', 'btn btn-warning');
	btn2.setAttribute('style', 'width: 60px;');
	btn2.innerHTML = '<i class="icon-zoom-out"></i>';
	btn2.addEventListener('click', function () {
	    widget = Retina.WidgetInstances.kegg[1];
	    widget.map.settings.width = parseInt(widget.map.settings.width * 0.5);
	    widget.map.render();
	});
	menu_space.appendChild(btn2);

	var btn3 = document.createElement('button');
	btn3.setAttribute('class', 'btn btn-info');
	btn3.setAttribute('style', 'width: 60px;');
	btn3.innerHTML = '<i class="icon-refresh"></i>';
	btn3.addEventListener('click', function () {
	    widget = Retina.WidgetInstances.kegg[1];
	    widget.map.settings.width = 1200;
	    widget.map.render();
	});
	menu_space.appendChild(btn3);

	var btn1 = document.createElement('button');
	btn1.setAttribute('style', 'width: 60px;');
	btn1.setAttribute('class', 'btn btn-success');
	btn1.innerHTML = '<i class="icon-zoom-in"></i>';
	btn1.addEventListener('click', function () {
	    widget = Retina.WidgetInstances.kegg[1];
	    widget.map.settings.width = parseInt(widget.map.settings.width * 1.1);
	    widget.map.render();
	});
	menu_space.appendChild(btn1);

	var threshold_title = document.createElement('span');
	threshold_title.innerHTML = "threshold";
	threshold_title.setAttribute('style', "margin-left: 5px; margin-right: 5px; font-weight: bold; font-size: 12px;");
	menu_space.appendChild(threshold_title);

	var threshold = document.createElement('input');
	threshold.setAttribute('style', 'width: 30px; position: relative; top: 5px;');
	threshold.setAttribute('type', 'text');
	threshold.setAttribute('value', '1');
	threshold.addEventListener('keypress', function(event) {
	    event = event || window.event;
	    if (event.keyCode == 38) {
		this.value = parseInt(this.value) + 1;
		if (this.value.match(/^\d+$/)) {
		    Retina.WidgetInstances.kegg[1].map.settings.threshold = parseInt(this.value);
		    Retina.WidgetInstances.kegg[1].map.render();
		}
	    } else if (event.keyCode == 40) {
		this.value = parseInt(this.value) > 0 ? parseInt(this.value) - 1 : this.value;
		if (this.value.match(/^\d+$/)) {
		    Retina.WidgetInstances.kegg[1].map.settings.threshold = parseInt(this.value);
		    Retina.WidgetInstances.kegg[1].map.render();
		}
	    } else if (event.keyCode == 0) {
		if (this.value.match(/^\d+$/)) {
		    Retina.WidgetInstances.kegg[1].map.settings.threshold = parseInt(this.value);
		    Retina.WidgetInstances.kegg[1].map.render();
		}
	    }
	});
	menu_space.appendChild(threshold);

	menu_space.setAttribute('style', 'margin-bottom: 10px; margin-top: 90px;');

    };

    widget.redraw = function (idsa, idsb) {
	widget = Retina.WidgetInstances.kegg[1];
	if (idsa) {
	    widget.idsa = idsa;
	}
	if (idsb) {
	    widget.idsb = idsb;
	}
	if (widget.idsb.length < 1) {
	    ids = widget.idsa;
	} else {
	    ids = widget.idsa.concat(widget.idsb);
	}
	var idgroup = [];
	for (var i=0;i<widget.idsa.length; i++) {
	    idgroup[widget.idsa[i]] = 0;
	}
	for (var i=0;i<widget.idsb.length; i++) {
	    idgroup[widget.idsb[i]] = 1;
	}

	// make sure we have all data we need for the current selection
	var load_required = [];
	
	if (! stm.DataStore.hasOwnProperty('profile') ) {
	    stm.DataStore.profile = [];
	}
	for (var i=0;i<ids.length;i++) {
	    if (! stm.DataStore.profile.hasOwnProperty(ids[i]+"_function_KO") ) {
		load_required.push(stm.get_objects( { type: 'profile', "id": ids[i], "options": { "source": "KO", "type": "function" } } ) );
	    }
	}	
	if (load_required.length > 0) {
	    var promise = jQuery.Deferred();
	    promise.then(function(){Retina.WidgetInstances.kegg[1].redraw(ids);});

	    jQuery.when.apply(this, load_required).then(function() {
		promise.resolve();
	    });

	    return;
	}

	var ids_with_data = [];
	for (var i=0;i<ids.length;i++) {
	    if (stm.DataStore.profile[ids[i]+"_function_KO"].data.length > 0) {
		ids_with_data.push(ids[i]);
	    }
	}
	ids = ids_with_data;
	if (ids.length < 2) {
	    console.log('less than two datasets that contained data were selected');
	    return;
	}

	var tdata = [];
	var theader = [ "Level 1", "Level 2", "Level 3", "Level 4" ];
	var draw_data = [[],[]];
	var td = [];
	for (var h=0;h<ids.length;h++) {
	    var grp = "A";
	    if (idgroup[ids[h]] == 1) {
		grp = "B";
	    }
	    theader.push(stm.DataStore.metagenome[ids[h]].name+" ("+grp+")");
	    
	    var data = stm.DataStore.profile[ids[h]+"_function_KO"];
	    for (var i=0;i<data.data.length;i++) {
		if (! draw_data[idgroup[ids[h]]].hasOwnProperty(data.rows[i].id)) {
		    draw_data[idgroup[ids[h]]][data.rows[i].id] = 0;
		}
		draw_data[idgroup[ids[h]]][data.rows[i].id] += data.data[i][0];
		if (! td.hasOwnProperty(data.rows[i].id)) {
		    td[data.rows[i].id] = [];
		    td[data.rows[i].id][0] = data.rows[i].metadata.ontology[0];
		    td[data.rows[i].id][1] = data.rows[i].metadata.ontology[1];
		    td[data.rows[i].id][2] = data.rows[i].metadata.ontology[2];
		    td[data.rows[i].id][3] = data.rows[i].metadata.ontology[3];
		    for (var j=0;j<(ids.length+2);j++) {
			td[data.rows[i].id][j+4] = "0";
		    }
		}
		td[data.rows[i].id][h+4] = data.data[i][0];
		td[data.rows[i].id][ids.length+4+idgroup[ids[h]]] = parseInt(td[data.rows[i].id][ids.length+4+idgroup[ids[h]]]) + parseInt(data.data[i][0]);
	    }
	}
	theader.push('group a');
	theader.push('group b');
	for (var i in td) {
	    if (td.hasOwnProperty(i)) {
		tdata.push(td[i]);
	    }
	}
	if (widget.map) {
	    widget.map.settings.data = draw_data;
	} else {
	    widget.map = Retina.Renderer.create("keggmap", { target: widget.graph_space, data: draw_data });
	}
	widget.map.render();
	
	table_data = { data: tdata, header: theader };
	
	var tab = widget.table = Retina.Renderer.create("table", { target: widget.table_space, data: table_data, filter_autodetect: true });
	tab.render();
    }
    
})();