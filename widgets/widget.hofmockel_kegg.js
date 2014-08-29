(function () {
    var widget = Retina.Widget.extend({
        about: {
                title: "Demonstration Widget for the Hofmockel Project",
                name: "hofmockel_kegg",
                author: "Tobias Paczian",
                requires: [ ]
        }
    });

    widget.setup = function () {
	stm.Authentication = "bpJiS5MHdzKdhbU9K3pf4C753";
	return [ Retina.add_renderer({"name": "keggmap", "resource": "renderers/",  "filename": "renderer.keggmap.js" }),
		 Retina.load_renderer("keggmap"),
		 Retina.add_renderer({"name": "listselect", "resource": "renderers/",  "filename": "renderer.listselect.js" }),
		 Retina.load_renderer("listselect"),
		 Retina.add_renderer({"name": "table", "resource": "renderers/",  "filename": "renderer.table.js" }),
		 Retina.load_renderer("table")
	       ];
    };
    
    widget.idsa = [];
    widget.idsb = [];

    widget.display = function (wparams) {
	// load hofmockel data
	wparams.id = 'mgp2592';
	//if (! (stm.DataStore.hasOwnProperty('project') && stm.DataStore.project.hasOwnProperty(wparams.id))) {
	if (! (stm.DataStore.hasOwnProperty('metagenome') && stm.DataStore.metagenome.hasOwnProperty('mgm4493668.3') && stm.DataStore.metagenome.hasOwnProperty('mgm4493667.3'))) {
	    //stm.get_objects({ "type": "project", "id": wparams.id, "options": { "verbosity": "full" } }).then( function () {
		
		// make a promise list
		var stats_promises = [];
	    var mgs = [['mgm4493668.3'],['mgm4493667.3']]; //stm.DataStore.project[wparams.id].analyzed;
	    for (i=0; i<mgs.length; i++) {
		    stats_promises.push(stm.get_objects({ "type": "metagenome", "id": mgs[i][0] }));
		}

		jQuery.when.apply(this, stats_promises).then(function() {
		    widget.display(wparams);
		});

	    //});

	    wparams.target.innerHTML = "<img src='images/loading.gif'> loading data";

	    return;
	} else {
	    wparams.target.innerHTML = "";
	}

	var graph_space = document.createElement('div');
	graph_space.setAttribute('id', 'kegg_map_svg_target');
	var table_space = document.createElement('div');
	var menu_space = document.createElement('div');

	table_space.setAttribute('style', 'margin-top: 15px;');

	widget.graph_space = graph_space;
	widget.table_space = table_space;

	wparams.target.appendChild(menu_space);
	wparams.target.appendChild(graph_space);
	wparams.target.appendChild(table_space);
		
	menu_space.innerHTML = "<p style='font-size:18px;font-weight:bold;float: left;'>Group A (green)</p><p style='float: left;width:480px;'></p><p style='font-size: 18px;font-weight:bold;'>Group B (blue)</p>";

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
	var ls2 = document.createElement('div');
	menu_space.appendChild(ls2);
	var listrend2 = Retina.Renderer.create('listselect', {
	    target: ls2,
	    multiple: true,
	    style: 'float: left;',
	    data: metagenome_data,
	    value: "id",
	    filter: [ "name", "id" ],
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
	    widget = Retina.WidgetInstances.hofmockel_kegg[0];
	    widget.map.settings.width = parseInt(widget.map.settings.width * 0.5);
	    widget.map.render();
	});
	menu_space.appendChild(btn2);

	var btn3 = document.createElement('button');
	btn3.setAttribute('class', 'btn btn-info');
	btn3.setAttribute('style', 'width: 60px;');
	btn3.innerHTML = '<i class="icon-refresh"></i>';
	btn3.addEventListener('click', function () {
	    widget = Retina.WidgetInstances.hofmockel_kegg[0];
	    widget.map.settings.width = 1200;
	    widget.map.render();
	});
	menu_space.appendChild(btn3);

	var btn1 = document.createElement('button');
	btn1.setAttribute('style', 'width: 60px;');
	btn1.setAttribute('class', 'btn btn-success');
	btn1.innerHTML = '<i class="icon-zoom-in"></i>';
	btn1.addEventListener('click', function () {
	    widget = Retina.WidgetInstances.hofmockel_kegg[0];
	    widget.map.settings.width = parseInt(widget.map.settings.width * 1.1);
	    widget.map.render();
	});
	menu_space.appendChild(btn1);
	menu_space.setAttribute('style', 'margin-bottom: 10px;');

    };

    widget.redraw = function (idsa, idsb) {
	widget = Retina.WidgetInstances.hofmockel_kegg[0];
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
	for (i=0;i<widget.idsa.length; i++) {
	    idgroup[widget.idsa[i]] = 0;
	}
	for (i=0;i<widget.idsb.length; i++) {
	    idgroup[widget.idsb[i]] = 1;
	}

	// make sure we have all data we need for the current selection
	var load_required = [];
	
	if (! stm.DataStore.hasOwnProperty('abundanceprofile') ) {
	    stm.DataStore.abundanceprofile = [];
	}
	for (i=0;i<ids.length;i++) {
	    if (! stm.DataStore.abundanceprofile.hasOwnProperty(ids[i]+"_function_KO") ) {
		load_required.push(stm.get_objects( { type: 'abundanceprofile', "id": ids[i], "options": { "source": "KO", "type": "function" } } ) );
	    }
	}	
	if (load_required.length > 0) {
	    var promise = jQuery.Deferred();
	    promise.then(function(){Retina.WidgetInstances.hofmockel_kegg[0].redraw(ids);});

	    jQuery.when.apply(this, load_required).then(function() {
		promise.resolve();
	    });

	    return;
	}

	var ids_with_data = [];
	for (i=0;i<ids.length;i++) {
	    if (stm.DataStore.abundanceprofile[ids[i]+"_function_KO"].data.length > 0) {
		ids_with_data.push(ids[i]);
	    }
	}
	ids = ids_with_data;
	if (ids.length < 2) {
	    alert('less than two datasets that contained data were selected');
	    return;
	}

	var tdata = [];
	var theader = [ "Level 1", "Level 2", "Level 3", "Level 4" ];
	var draw_data = [[],[]];
	var td = [];
	for (h=0;h<ids.length;h++) {
	    var grp = "A";
	    if (idgroup[ids[h]] == 1) {
		grp = "B";
	    }
	    theader.push(stm.DataStore.metagenome[ids[h]].name+" ("+grp+")");
	    
	    var data = stm.DataStore.abundanceprofile[ids[h]+"_function_KO"];
	    for (i=0;i<data.data.length;i++) {
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
		    for (j=0;j<(ids.length+2);j++) {
			td[data.rows[i].id][j+4] = "0";
		    }
		}
		td[data.rows[i].id][h+4] = data.data[i][0];
		td[data.rows[i].id][ids.length+4+idgroup[ids[h]]] = parseInt(td[data.rows[i].id][ids.length+4+idgroup[ids[h]]]) + parseInt(data.data[i][0]);
	    }
	}
	theader.push('group a');
	theader.push('group b');
	for (i in td) {
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