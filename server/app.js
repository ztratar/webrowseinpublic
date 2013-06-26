/**
 * Module dependencies.
 */
 
var express = require('express'),
	http = require('http'),
	models = require('./models/models');
 
var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server);

var md5 = require('MD5');
 
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});
 
app.configure('development', function(){
  app.use(express.errorHandler());
});

// Mongo connector
var mongo = require('mongodb'),
	MongoClient = mongo.MongoClient;

// Server side routing
app.get('/*.(js|css|png|jpg|eot|svg|ttf|woff)', function(req, res){
	res.sendfile("."+req.url);
});

app.get('/*', function(req, res) {
	res.render('index');
});

MongoClient.connect('mongodb://localhost:27017/webrowseinpublic', function(err, db) {
	var loadCollection = function(name, cb) {
			'use strict';
			db.collection(name, cb);
		},
		BSON = mongo.BSONPure;
		
	// Generic app state. Can't do this as we scale!
	var appState = {
		clients: 0,
		linksShared: 0
	};

	var appController = {

		// Connection and server stuff
		initServer: function() {
			loadCollection('visits', function(er, visits) {
				visits.count(function(err, count) {
					appState.linksShared = count;
				});
			});
		},
		onConnect: function(socket) {
			socket.emit('update-link_count', { stat: appState.linksShared }); 
			socket.emit('update-client_count', { stat: appState.clients }); 

			// Bind all API calls to socket
			for (var key in this.apiCalls) {
				socket.on(key, _.bind(this.apiCalls[key], this, socket));
			}
		},

		onDisconnect: function(socket) {
			if (socket.fromExtension) {
				appState.clients -= 1;
				io.sockets.emit('update-client_count', { stat: appState.clients }); 
			}
		},

		// Api calls interface with websockets.
		apiCalls: {

			'extension_connect': function(socket) {
				socket.fromExtension = true;
				appState.clients += 1;
				io.sockets.emit('update-client_count', { stat: appState.clients }); 
			},

			'new_user': function(socket) {
				this.new_user(socket);
			},

			'new_visit': function(socket, data) {
				data = JSON.parse(data);
				this.new_visit(socket, data);
			},

			'subscribe': function(socket, data) {
				socket.join(data.room);
			},

			'unsubscribe': function(socket, data) {
				socket.leave(data.room);
			},

			'load-user': function(socket, data) {
				loadCollection('users', function(err, visits) {
					
				});
			},

			'load-user-link_count': function(socket, data) {
				loadCollection('users', function(err, users) {
					users.findOne({
						'_id': data.user_id
					}, function(err, dbData) {
						socket.emit('update-user-link_count-' + JSON.stringify({ user_id: data.user_id }), { stat: dbData.links_visited }); 
					});
				});
			},

			'load-domain-visits': function(socket, data) {
				loadCollection('visits', function(err, visits) {
					visits
						.find({
							'domain.domain': data.domain
						})
						.sort({ time_visited: -1 })
						.limit(10)
						.toArray(function(err, items) {
							loadCollection('links', function(err, links) {
								links
									.find({
										_id: { $in: _.pluck(items, 'link_id') }	
									})
									.toArray(function(err, linkItems) {
										_.each(items, function(item, ind) {
											_.each(linkItems, function(linkItem) {
												if (item.link_id === linkItem._id) {
													items[ind].visitsPerLink = linkItem.num_visits;
												}
											});
										});
										socket.emit('update-domain-visits-' + JSON.stringify(data), items.reverse());
									});
							});
						});
				});
			},

			'load-user-visits': function(socket, data) {
				loadCollection('visits', function(err, visits) {
					visits
						.find({ user_id: parseInt(data.user_id, 10) })
						.sort({ time_visited: -1 })
						.limit(10)
						.toArray(function(err, items) {
							loadCollection('links', function(err, links) {
								links
									.find({
										_id: { $in: _.pluck(items, 'link_id') }	
									})
									.toArray(function(err, linkItems) {
										_.each(items, function(item, ind) {
											_.each(linkItems, function(linkItem) {
												if (item.link_id === linkItem._id) {
													items[ind].visitsPerLink = linkItem.num_visits;
												}
											});
										});
										socket.emit('update-user-visits-' + JSON.stringify(data), items.reverse());
									});
							});
						});
				});
			},

			'load-visits': function(socket, data) {
				loadCollection('visits', function(err, visits) {
					visits
						.find()
						.sort({ time_visited: -1 })
						.limit(10)
						.toArray(function(err, items) {
							loadCollection('links', function(err, links) {
								links
									.find({
										_id: { $in: _.pluck(items, 'link_id') }	
									})
									.toArray(function(err, linkItems) {
										_.each(items, function(item, ind) {
											_.each(linkItems, function(linkItem) {
												if (item.link_id === linkItem._id) {
													items[ind].visitsPerLink = linkItem.num_visits;
												}
											});
										});
										socket.emit('update-visits', items.reverse());
									});
							});
						});
				});
			},

			'load-top-domains': function(socket, data) {
				loadCollection('visits', function(err, visits) {
					loadCollection('domains', function(err, domains) {
						visits.aggregate([
							{
								$project: {
									domain_id: 1		
								}	
							},
							{
								$group: {
									_id: '$domain_id',
									visitsPerDomain: { $sum: 1 }	
								}	
							},
							{
								$sort: {
									visitsPerDomain: -1
								}	
							}		
						], function(err, items) {
							domains.find({
								_id: { $in: _.pluck(items, '_id') }	
							}).toArray(function(err, domainItems) {
								for (var i = 0; i < domainItems.length; i++) {
									items[i].domainName = domainItems[i].domain;
								}
								socket.emit('update-top-domains', items);	
							});
						});
					});
				});
			},

			'load-top-links-today': function(socket, data) {
				loadCollection('visits', function(err, visits) {
					visits.aggregate([
						{
							$project: {
								title: 1,
								link: 1,
								user_id: 1,
								domain: 1,
								time_visited: 1	
							}	
						},
						{
							$group: {
								_id: '$link',
								title: { $first : '$title' },
								link: { $first : '$link' },
								user_id: { $first : '$user_id' },
								domain: { $first : '$domain' },
								time_visited: { $first : '$time_visited' },
								visitsPerLink: { $sum: 1 }	
							}	
						},
						{
							$sort: {
								visitsPerLink: -1
							}	
						},
						{
							$limit: 10	
						}		
					], function(err, items) {
						items = items.reverse();
						socket.emit('update-top-links-today', items);	
					});
				});
			},

			'visit-action': function(socket, data) {
				var statObj = {};
				statObj['stats.' + data.stat] = 1;
				loadCollection('visits', function(err, visits) {
					visits
						.findAndModify({
							_id: new BSON.ObjectID(data.visit_id)	
						},
						[],
						{
							'$inc': statObj
						},
						{
							new: true,
						},
						function(err, visitObj) {
							socket.emit('update-visit-'+data.visit_id, visitObj);
							io.sockets.in('extension-'+visitObj.user_id).emit('extension-action', {
								user_id: data.user_id,
								action: data.stat,
								visit: visitObj			
							});
						});
				});
			},

			'disconnect': function(socket) {
				this.onDisconnect(socket);
			}

		},

		// Functionality
		new_user: function(socket) {
			var user = new models.User({
				time_joined: (new Date())
			});	
			loadCollection('users', function(err, users) {
				loadCollection('counters', function(err, counters) {
					counters.findAndModify({
						'_id': 'userid'
					},
					[],
					{
						'$inc': {
							'seq': 1
						}
					}, function(err, count) {
						user.set('_id', count.seq);
						users.insert(user.toJSON(), function(err, docs) {
							user.set({
								_id: docs[0]._id
							});
							socket.emit('new_user', user.toJSON());
						});
					});
				});
			});
		},
		increment_user_visit: function(user_id, cb) {
			var channelName;

			loadCollection('users', function(err, users) {
				users.findAndModify({
						'_id': user_id
					},
					[],
					{
					'$inc': {
						'links_visited': 1
					}
				}, function(err, data) {
					channelName = 'user-link_count-' + JSON.stringify({ user_id: user_id });
					io.sockets.in(channelName).emit('update-'+channelName, { stat: data.links_visited }); 
					if (cb) {
						cb(data);
					}	
				});
			});
		},
		new_visit: function(socket, data) {
			var that = this,
				visit,
				idHashed = md5(data.link + data.user_id).substr(0,24);

			loadCollection('unique_visits', function(err, unique_visits) {
				loadCollection('visits', function(err, visits) {
					if (data.link && data.domain) {
						that.getDomainFromString(data.domain, function(domain) {			
							that.getLink({
								url: data.link,
								title: data.title,
								image: data.image
							}, data.domain, function(linkObj) {
								that.getUserFromId(data.user_id, function(user) {
									unique_visits.findOne({
										_id: new BSON.ObjectID(idHashed)	
									}, function(err, uniqueObj) {
										visit = new models.Visit({
											link: data.link,
											link_id: linkObj._id,
											title: data.title,
											user_id: data.user_id,
											domain_id: domain._id,
											image: linkObj.image,
											user: user,
											domain: domain,
											time_visited: (new Date()),
											stats: {
												wow: 0,
												lol: 0,
												wtf: 0
											}
										});
										if (!uniqueObj) {
											unique_visits.insert(_.extend(visit.toJSON(),{
												_id: new BSON.ObjectID(idHashed),
												place: linkObj.num_visits
											}), function(){});	
											that.incrementLinkVisits(linkObj._id);
										}
										that.increment_user_visit(data.user_id);
										visits.insert(visit.toJSON(), function(err, docs) {
											visit.set('_id', docs[0]._id);

											var userChannelName = 'user-visits-' + JSON.stringify({ user_id: data.user_id }),
												domainChannelName = 'domain-visits-' + JSON.stringify({ domain: domain.domain }),
												returnObj = _.extend(visit.toJSON(), {
													visitsPerLink: linkObj.num_visits + 1
												});

											io.sockets.in(userChannelName).emit('update-'+userChannelName, returnObj); 
											io.sockets.in(domainChannelName).emit('update-'+domainChannelName, returnObj); 
											io.sockets.in('visits').emit('update-visits', returnObj); 
											visits.count(function(err, count) {
												io.sockets.emit('numberUpdate', count);
											});
										});
									});	

								});
							});
						});
					}
				});
			});
		},

		// ----- Sockets API ------ //

		// Home Page
		home_feed: function(socket) {

		},
		visits_popular: function(socket) {

		},
		domains_popular: function(socket) {

		},

		// User Profile
		get_user_stream_updates: function(socket) {
		},
		users_visit_stream: function(socket) {

		},
		users_domains: function(socket) {

		},

		// Domain Page
		domains_visit_stream: function(socket) {
			
		},
		domains_users: function(socket) {

		},

		// Helpers
		getDomainFromString: function(domainStr, cb) {
			loadCollection('domains', function(err, domains) {
				domains.find({
					domain: domainStr
				}).toArray(function(err, singleDomain) {
					if (singleDomain && singleDomain.length) {
						cb(singleDomain[0]);
					} else {
						domains.insert({
							domain: domainStr
						}, function(err, docs) {
							cb(docs[0]);
						});
					}
				});
			});
		},
		incrementLinkVisits: function(link_id, cb) {
			loadCollection('links', function(err, links) {
				links.findAndModify({
						'_id': link_id
					},
					[],
					{
					'$inc': {
						'num_visits': 1
					}
				}, function(err, data) {
					if (cb) {
						cb(data);
					}	
				});
			});
		},
		getLink: function(data, domain, cb) {
			var that = this;
			loadCollection('links', function(err, links) {
				links.find({
					_id: new BSON.ObjectID(md5(data.url).substr(0,24))
				}).toArray(function(err, singleLink) {
					if (singleLink && singleLink.length) {
						cb(singleLink[0]);
					} else {
						that.getDomainFromString(domain, function(domainObj) {
							links.insert({
								_id: new BSON.ObjectID(md5(data.url).substr(0,24)),
								url: data.url,
								title: data.title,
								domain: domainObj,
								image: data.image,
								num_visits: 0,
								time_visited_first: (new Date())
							}, function(err, docs) {
								cb(docs[0]);
							});
						});
					}
				});	
			});
		},
		getUserFromId: function(userId, cb) {
			loadCollection('users', function(err, users) {
				users.find({
					'_id': new BSON.ObjectID(userId)
				}).toArray(function(err, singleUser) {
					cb(singleUser[0]);
				});
			});
		}

	};

	io.sockets.on('connection', _.bind(appController.onConnect, appController));

});

