(function () {
    var server = false, models;
    if (typeof exports !== 'undefined') {
        _ = require('underscore')._;
        Backbone = require('backbone');

        models = exports;
        server = true;
    } else {
        models = this.models = {};
    }

    //
    //models
    //
    
    models.BaseModel = Backbone.Model.extend({});
    models.Visit = Backbone.Model.extend({
		defaults: {
			link: null,
			title: null
		}	
	});

    models.ClientCountModel = Backbone.Model.extend({
        defaults: {
            "clients": 0
        },

        updateClients: function(clients){
            this.set({
				clients: clients
			});
        }
    });

    models.NodeVisitsModel = Backbone.Model.extend({
        defaults: {
            "clientId": 0
        },

        initialize: function() {
            this.visits = new models.VisitCollection(); 
        }
    });


    //
    //Collections
    //

    models.BaseCollection = Backbone.Collection.extend({
        model: models.BaseModel
    });

    models.VisitCollection = Backbone.Collection.extend({
        model: models.Visit
    });

})()

