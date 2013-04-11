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

	models.User = Backbone.Model.extend({
		defaults: {
			id: null,
			user_num: null,
			username: null,
			rep: 0,
			time_joined: null
		}	
	});

	models.UserDomain = Backbone.Model.extend({
		defaults: {
			id: null,
			domain: null,
			user: null,
			num_visits: 0,
			rep: 0,
			mayor: false
		}	
	});

	models.Domain = Backbone.Model.extend({
		defaults: {
			id: null,
			visits: 0,
			domain: ''
		}	
	});

    models.Visit = Backbone.Model.extend({
		defaults: {
			id: null,
			domain_id: null,
			user_id: null,
			title: null,
			link: '',
			time_visited: null,
			place: null, // 0 -> second or more visit
			rep: null
		}	
	});

	models.UrlStat = Backbone.Model.extend({
		defaults: {
			id: null,
			url: null,
			num_visits: 0
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

    //
    //Collections

    models.BaseCollection = Backbone.Collection.extend({
        model: models.BaseModel
    });

	models.Users = Backbone.Collection.extend({
		model: models.User
	});

	models.UserDomains = Backbone.Collection.extend({
		model: models.UserDomain
	});

	models.Domains = Backbone.Collection.extend({
		model: models.Domain
	});

	models.Visits = Backbone.Collection.extend({
		model: models.Visit
	});

})();

