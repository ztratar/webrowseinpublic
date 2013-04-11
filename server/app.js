/**
 * Module dependencies.
 */
 
var express = require('express'),
	http = require('http'),
	models = require('./models/models');
 
var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server);
 
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
	MongoClient = mongo.MongoClient,
	loadCollection = function(name, cb) {
		'use strict';
		MongoClient.connect('mongodb://localhost:27017/webrowseinpublic', function(err, db) {
			console.log(err);
			db.collection(name, cb);
		});
	},
	BSON = mongo.BSONPure;

// Server side routing
app.get('/*.(js|css|png|jpg|eot|svg|ttf|woff)', function(req, res){
	console.log('url', req.url);
	res.sendfile("."+req.url);
});

app.get('/*', function(req, res) {
	res.render('index');
});
 

	
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
		var that = this;
		
		appState.clients += 1;

		socket.broadcast.emit('clientsUpdate', appState.clients);
		socket.emit('clientsUpdate', appState.clients);

		socket.broadcast.emit('numberUpdate', appState.linksShared);
		socket.emit('numberUpdate', appState.linksShared);

		socket.on('message', function(msg){ 
			msg = JSON.parse(msg);
			if (msg.type === 'new_visit') {
				that.new_visit(socket, msg.data); 
			} else if (msg.type === 'new_user') {
				that.new_user(socket);
			}
		});
		socket.on('subscribe', function(data) {
			socket.join(data.room);
		});
		socket.on('unsubscribe', function(data) {
			socket.join(data.room);
		});


		loadCollection('visits', function(err, visits) {
			visits
				.find()
				.sort({ _id: 1 })
				.limit(10)
				.toArray(function(err, items) {
					socket.emit('message', {
						event: 'initial',
						data: {
							visits: items
						}
					});
				});
		});

		socket.on('disconnect', function() {
			that.onDisconnect(socket);
		});
	},
	onDisconnect: function(socket) {
		appState.clients -= 1;
		socket.broadcast.emit('clientsUpdate', appState.clients);
	},

	// Functionality
	new_user: function(socket) {
		var user = new models.User();	
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
					users.insert({
						_id: count.seq
					}, function(err, docs) {
						user.set({
							id: docs[0]._id
						});
						socket.emit('new_user', user.toJSON());
					});
				});
			});
		});
	},
	new_visit: function(socket, data) {
		var that = this,
			visit;

		loadCollection('visits', function(err, visits) {
			if (data.link && data.domain) {
				that.getDomainFromString(data.domain, function(domain) {			
					that.getUserFromId(data.user_id, function(user) {
						visit = new models.Visit({
							link: data.link,
							title: data.title,
							user_id: data.user_id,
							domain_id: domain._id,
							user: user,
							domain: domain
						});
						visits.insert(visit.toJSON(), function(err, docs) {
							var channelName = 'users-'+data.user_id+'-visits';
							visit.set({
								id: docs[0]._id
							});
							io.sockets.in(channelName).emit('update-'+channelName, visit.toJSON()); 
							io.sockets.in('visits').emit('update-visits', visit.toJSON()); 
							visits.count(function(err, count) {
								socket.broadcast.emit('numberUpdate', count);
								socket.emit('numberUpdate', count);
							});
						});
					});
				});
			}
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

