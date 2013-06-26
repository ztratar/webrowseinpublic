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
	
	Backbone.Model.idAttribute = '_id';

    models.BaseModel = Backbone.Model.extend({
		subscribeToChannel: function(channel, opts, apiData) {
			var that = this;
			opts = _.extend({
				isRoom: true,
				getInitial: true
			}, opts);
			if (!server) {
				this.channel = channel || this.channel;	
				if (opts.getInitial) {
					console.log('attempting to load', 'load-' + this.channel);
					window.mainApp.socket.emit('load-'+this.channel, apiData);
				}
				// API data calls that are rooms and use 
				// api data to dictate the room need the
				// info to be in a string format.
				if (apiData) {
					this.channel += '-' + JSON.stringify(apiData);
				}
				if (opts.isRoom) {
					window.mainApp.socket.emit('subscribe', { room: this.channel });
				}
				window.mainApp.socket.on('update-'+this.channel, function(data) {
					that.set(data);	
				});
			}
		},
		unsubscribe: function() {
			window.mainApp.socket.emit('unsubscribe', { room: this.channel });
			window.mainApp.socket.removeListener('update-'+this.channel);
		}	
	});

	models.User = models.BaseModel.extend({
		defaults: {
			_id: null,
			username: null,
			rep: 0,
			links_visited: 0,
			time_joined: null
		}	
	});

	models.UserDomain = models.BaseModel.extend({
		defaults: {
			_id: null,
			domain: null,
			user: null,
			num_visits: 0,
			rep: 0,
			mayor: false
		}	
	});

	models.Domain = models.BaseModel.extend({
		defaults: {
			_id: null,
			visits: 0,
			domain: ''
		}	
	});

    models.Visit = models.BaseModel.extend({
		initialize: function(attrs) {
			attrs = attrs || {};
			this.on('change:time_visited', this.timeToDate, this);	
			this.timeToDate();
		},
		timeToDate: function() {
			if (typeof this.get('time_visited') === 'string') {
				this.set({
					'time_visited': new Date(this.get('time_visited'))
				}, { silent: true });
			}
		},
		defaults: {
			_id: null,
			domain_id: null,
			user_id: null,
			title: null,
			image: null,
			link: '',
			time_visited: null,
			place: null, // 0 -> second or more visit
			visitsPerLink: 0,
			rep: null,
			stats: {
				wow: 0,
				lol: 0,
				wtf: 0
			}
		}	
	});

	models.UrlStat = models.BaseModel.extend({
		defaults: {
			_id: null,
			url: null,
			num_visits: 0
		}	
	});

    models.StatModel = models.BaseModel.extend({
        defaults: {
            "stat": 0
        },

        updateClients: function(stat){
            this.set({
				stat: stat
			});
        }
    });

    //
    //Collections

    models.BaseCollection = Backbone.Collection.extend({
        model: models.BaseModel,
		subscribeToChannel: function(channel, opts, apiData) {
			var that = this;
			opts = _.extend({
				isRoom: true,
				getInitial: true
			}, opts);
			if (!server) {
				this.channel = channel || this.channel;	
				if (opts.getInitial) {
					console.log('attemping to load', 'load-'+this.channel);
					window.mainApp.socket.emit('load-'+this.channel, apiData);
				}
				// API data calls that are rooms and use 
				// api data to dictate the room need the
				// info to be in a string format.
				if (apiData) {
					this.channel += '-' + JSON.stringify(apiData);
				}
				if (opts.isRoom) {
					console.log('subscribing to', this.channel);
					window.mainApp.socket.emit('subscribe', { room: this.channel });
				}
				window.mainApp.socket.on('update-'+this.channel, function(data) {
					that.add(data);	
				});
			}
		},
		unsubscribe: function() {
			window.mainApp.socket.emit('unsubscribe', { room: this.channel });
			window.mainApp.socket.removeListener('update-'+this.channel);
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

