(function () {
    widget = Retina.Widget.extend({
        about: {
                title: "Demonstration Widget for the Hofmockel Project",
                name: "hofmockel_heatmap",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });

    widget.setup = function () {
	stm.Authentication = "bpJiS5MHdzKdhbU9K3pf4C753";
	return [ Retina.add_renderer({"name": "heatmap", "resource": "renderers/",  "filename": "renderer.heatmap.js" }),
		 Retina.load_renderer("heatmap"),
		 Retina.add_renderer({"name": "listselect", "resource": "renderers/",  "filename": "renderer.listselect.js" }),
		 Retina.load_renderer("listselect"),
		 Retina.add_renderer({"name": "table", "resource": "renderers/",  "filename": "renderer.table.js" }),
		 Retina.load_renderer("table")
	       ];
    };
    
    widget.ids = [];
    widget.level = 1;

    widget.display = function (wparams) {
	// load hofmockel data
	wparams.id = 'mgp2592';
	if (! (stm.DataStore.hasOwnProperty('project') && stm.DataStore.project.hasOwnProperty(wparams.id))) {
	    stm.get_objects({ "type": "project", "id": wparams.id, "options": { "verbosity": "full" } }).then( function () {
		
		// make a promise list
		var stats_promises = [];
		var mgs = stm.DataStore.project[wparams.id].analyzed;
		for (i=0; i<mgs.length; i++) {
		    stats_promises.push(stm.get_objects({ "type": "metagenome", "id": mgs[i][0] }));
		}

		jQuery.when.apply(this, stats_promises).then(function() {
		    widget.display(wparams);
		});

	    });

	    wparams.target.innerHTML = "<img src='images/loading.gif'> loading data";

	    return;
	} else {
	    wparams.target.innerHTML = "";
	}

	var graph_space = document.createElement('div');
	var table_space = document.createElement('div');
	var menu_space = document.createElement('div');

	table_space.setAttribute('style', 'margin-top: 15px;');

	widget.graph_space = graph_space;
	widget.table_space = table_space;

	wparams.target.appendChild(menu_space);
	wparams.target.appendChild(graph_space);
	wparams.target.appendChild(table_space);
		
	menu_space.innerHTML = "<p style='font-size:18px;font-weight:bold;float: left;'>Metagenome</p><p style='float: left;width:505px;'></p><p style='font-size: 18px;font-weight:bold;'>Ontology Level</p>";

	var metagenome_data = [];
	for (i in stm.DataStore["metagenome"]) {
	    if (stm.DataStore["metagenome"].hasOwnProperty(i)) {
		metagenome_data.push( { "name": stm.DataStore["metagenome"][i]["name"], "id": i });
	    }
	}

	var ls = document.createElement('div');
	menu_space.appendChild(ls);
	var listrend = Retina.Renderer.create('listselect', {
	    target: ls,
	    multiple: true,
	    style: 'float: left;',
	    data: metagenome_data,
	    value: "id",
	    filter: [ "name", "id" ],
	    callback: function (data) {
		widget.redraw(data,null);
	    }
	});
	listrend.render();
	var level = document.createElement('select');
	level.innerHTML = "<option>1</option><option>2</option><option>3</option><option>4</option>";
	level.addEventListener('change', function() {
	    Retina.WidgetInstances.hofmockel_heatmap[0].level = level.options[level.selectedIndex].value;
	    Retina.WidgetInstances.hofmockel_heatmap[0].redraw();
	});
	menu_space.appendChild(level);
	var separator = document.createElement('div');
	separator.setAttribute('style', 'display: block; clear: both;');
	menu_space.appendChild(separator);
	menu_space.setAttribute('style', 'margin-bottom: 10px;');

    };

    widget.redraw = function (ids) {
	widget = Retina.WidgetInstances.hofmockel_heatmap[0];
	if (ids) {
	    widget.ids = ids;
	} else {
	    ids = widget.ids;
	}
	var level = parseInt(widget.level);

	// make sure we have all data we need for the current selection
	var load_required = [];
	if (! stm.DataStore.hasOwnProperty('abundanceprofile') ) {
	    stm.DataStore.abundanceprofile = [];
	}
	var valid_ids = [];
	for (i=0;i<ids.length;i++) {
	    if (! stm.DataStore.abundanceprofile.hasOwnProperty(ids[i]+"_function_Subsystems") ) {
		load_required.push(stm.get_objects( { type: 'abundanceprofile', "id": ids[i], "options": { "source": "Subsystems", "type": "function" } } ) );
	    } else {
		if (stm.DataStore.abundanceprofile[ids[i]+"_function_Subsystems"].data.length) {
		    valid_ids.push(ids[i]);
		}
	    }
	}
	ids = valid_ids;
	if (load_required.length > 0) {
	    var promise = jQuery.Deferred();
	    promise.then(function(){Retina.WidgetInstances.hofmockel_heatmap[0].redraw(ids);});

	    jQuery.when.apply(this, load_required).then(function() {
		promise.resolve();
	    });

	    return;
	}

	var tdata = [];
	var theader = [];
	var td = [];
	for (k=0; k<level; k++) {
	    theader.push("Level "+(k+1));
	}
	for (h=0;h<ids.length;h++) {
	    var data = stm.DataStore.abundanceprofile[ids[h]+"_function_Subsystems"];
	    for (i=0;i<data.data.length;i++) {
		if (! td.hasOwnProperty(data.rows[i].metadata.ontology[level - 1])) {
		    td[data.rows[i].metadata.ontology[level - 1]] = [];
		    for (k=0; k<level; k++) {
			td[data.rows[i].metadata.ontology[level - 1]][k] = data.rows[i].metadata.ontology[k];
		    }
		    for (j=0;j<(ids.length);j++) {
			td[data.rows[i].metadata.ontology[level - 1]][j + level] = "0";
		    }
		}
		td[data.rows[i].metadata.ontology[level - 1]][h + level] = parseInt(td[data.rows[i].metadata.ontology[level - 1]][h + level]) + parseInt(data.data[i][0]);
	    }

	    theader.push(stm.DataStore.metagenome[ids[h]].name);
	}

	for (i in td) {
	    if (td.hasOwnProperty(i)) {
		tdata.push(td[i]);
	    }
	}
	
	var hcols = [];
	var hrows = [];
	var hdata = [];
	var maxvals = [];
	var minvals = [];
	for (i=0;i<ids.length;i++) {
	    hcols.push(stm.DataStore.metagenome[ids[i]].name);
	    maxvals.push(0);
	    minvals.push(-1);
	}
	
	for (i=0;i<tdata.length;i++) {
	    var desccol = tdata[i].length - ids.length - 1;
	    hrows.push(tdata[i][desccol]);
	    var hrow = [];
	    for (h=desccol+1; h<tdata[i].length;h++) {
		if (parseInt(tdata[i][h]) > maxvals[h-desccol-1]) {
		    maxvals[h-desccol-1] = parseInt(tdata[i][h]);
		}
		if ((minvals[h-desccol-1] == -1) || (minvals[h-desccol-1] > parseInt(tdata[i][h]))) {
		    minvals[h-desccol-1] = parseInt(tdata[i][h]);
		}
		hrow.push(parseInt(tdata[i][h]));
	    }
	    hdata.push(hrow);
	}

	for (i=0;i<hdata.length;i++) {
	    for (h=0;h<hdata[i].length;h++) {
		hdata[i][h] = (2 * (hdata[i][h] - minvals[h]) / (maxvals[h] - minvals[h])) - 1;
	    }
	}
	
	var renderer_data = { "columns": hcols, "rows": hrows, "data": hdata };

	if (widget.map) {
	    widget.map.settings.data = renderer_data;
	} else {
	    widget.map = Retina.Renderer.create("heatmap", { target: widget.graph_space, data: renderer_data });
	}
	widget.map.render();
	
	table_data = { data: tdata, header: theader };
	
	var tab = widget.table = Retina.Renderer.create("table", { target: widget.table_space, data: table_data, filter_autodetect: true });
	tab.render();
    }
    
})();