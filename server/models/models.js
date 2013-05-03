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
    
    models.BaseModel = Backbone.Model.extend({
		subscribeToChannel: function(channel) {
			var that = this;
			if (!server) {
				this.channel = channel || this.channel;	
				window.mainApp.socket.emit('subscribe', { room: this.channel });
				window.mainApp.socket.on('update-'+this.channel, function(data) {
					that.set(data);	
				});
			}
		},
		unsubscribe: function() {
			window.mainApp.socket.emit('unsubscribe', { room: this.channel });
			window.mainApp.socket.off('update-'+this.channel);
		}	
	});

	models.User = models.BaseModel.extend({
		defaults: {
			id: null,
			user_num: null,
			username: null,
			rep: 0,
			time_joined: null
		}	
	});

	models.UserDomain = models.BaseModel.extend({
		defaults: {
			id: null,
			domain: null,
			user: null,
			num_visits: 0,
			rep: 0,
			mayor: false
		}	
	});

	models.Domain = models.BaseModel.extend({
		defaults: {
			id: null,
			visits: 0,
			domain: ''
		}	
	});

    models.Visit = models.BaseModel.extend({
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

	models.UrlStat = models.BaseModel.extend({
		defaults: {
			id: null,
			url: null,
			num_visits: 0
		}	
	});

    models.ClientCountModel = models.BaseModel.extend({
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
        model: models.BaseModel,
		subscribeToChannel: function(channel) {
			var that = this;
			if (!server) {
				this.channel = channel || this.channel;
				window.mainApp.socket.emit('subscribe', { room: this.channel });
				window.mainApp.socket.on('update-'+this.channel, function(data) {
					that.add(data);	
				});
			}
		},
		unsubscribe: function() {
			window.mainApp.socket.emit('unsubscribe', { room: this.channel });
			window.mainApp.socket.off('update-'+this.channel);
		}	
    });

	models.Users = models.BaseCollection.extend({
		model: models.User
	});

	models.UserDomains = models.BaseCollection.extend({
		model: models.UserDomain
	});

	models.Domains = models.BaseCollection.extend({
		model: models.Domain
	});

	models.Visits = models.BaseCollection.extend({
		model: models.Visit
	});

})();

