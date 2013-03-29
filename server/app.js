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
 
app.get('/', function(req, res) {
	res.render('index');
});
 
app.get('/*.(js|css|png|jpg|eot|svg|ttf|woff)', function(req, res){
	console.log('url', req.url);
	res.sendfile("."+req.url);
});

// Mongo
var MongoClient = require('mongodb').MongoClient,
	loadCollection = function(name, cb) {
		'use strict';
		MongoClient.connect('mongodb://localhost:27017/webrowseinpublic', function(err, db) {
			db.collection(name, cb);
		});
	};
	
// Client variable and models set
var clients = 0, linksShared = 0;

loadCollection('visits', function(er, visits) {
	visits.count(function(err, count) {
		console.log('meow', count);
		linksShared = count;
	});
});

var nodeVisitsModel = new models.NodeVisitsModel();

loadCollection('visits', function(err, visits) {
	visits
		.find()
		.sort({ _id: 1 })
		.limit(10)
		.each(function(err, doc) {
			var visit = new models.Visit(doc);
			nodeVisitsModel.visits.add(visit);
		});
});

io.sockets.on('connection', function (socket) {

  clients += 1;
  socket.broadcast.emit('clientsUpdate', clients);
  socket.emit('clientsUpdate', clients);

  socket.broadcast.emit('numberUpdate', linksShared);
  socket.emit('numberUpdate', linksShared);

  socket.on('message', function(msg){ visit(socket, msg); });

  socket.emit('message', {
	event: 'initial',
	data: nodeVisitsModel.toJSON()
  });

  socket.on('disconnect', function(){ clientDisconnect(socket) });

});

function visit(socket, msg){
    var visit = new models.Visit(JSON.parse(msg).attrs);
	loadCollection('visits', function(err, visits) {
		visits.insert(visit.toJSON(), function(err, docs) {
			visit.set({
				id: docs[0]._id
			});
			nodeVisitsModel.visits.add(visit);
			socket.broadcast.emit('message',{
				event: 'visit',
				data: visit.toJSON()
			}); 
			socket.emit('message',{
				event: 'visit',
				data: visit.toJSON()
			}); 
			visits.count(function(err, count) {
				console.log('insert then count', count);
				socket.broadcast.emit('numberUpdate', count);
				socket.emit('numberUpdate', count);
			});
		});
	});
}

function clientDisconnect(socket){
  clients -= 1;
  socket.broadcast.emit('clientsUpdate', clients);
}
