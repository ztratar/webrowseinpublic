/**
 * Module dependencies.
 */
 
var express = require('express'),
	http = require('http'),
	redis = require('redis'),
	rc = redis.createClient(),
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
 
console.log("Express server listening on port 3000");

// Client variable and models set
var clients = 0;
rc.llen('visits', function(err, data) {
	linksShared = data;
});
var nodeVisitsModel = new models.NodeVisitsModel();

rc.lrange('visits', -10, -1, function(err, data) {
    if (err)
    {
        console.log('Error: ' + err);
    }
    else if (data) {
        _.each(data, function(jsonVisits) {
            var visit = new models.Visit();
            visit.mport(jsonVisits);
            nodeVisitsModel.visits.add(visit);
        });

        console.log('Revived ' + nodeVisitsModel.visits.length + ' visits');
    }
    else {
        console.log('No data returned for key');
    }
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
	data: nodeVisitsModel.xport()
  });

  socket.on('disconnect', function(){ clientDisconnect(socket) });

});

function visit(socket, msg){

    var visit = new models.Visit();
    visit.mport(msg);

    rc.incr('next.visit.id', function(err, newId) {
        visit.set({
			id: newId
		});
        nodeVisitsModel.visits.add(visit);
        
        rc.rpush('visits', visit.xport(), redis.print);
        rc.bgsave();

        socket.broadcast.emit('message',{
            event: 'visit',
            data: visit.xport()
        }); 
        socket.emit('message',{
            event: 'visit',
            data: visit.xport()
        }); 

		rc.llen('visits', function(err, data) {
			socket.broadcast.emit('numberUpdate', data);
			socket.emit('numberUpdate', data);
		});
    }); 
}

function clientDisconnect(socket){
  clients -= 1;
  socket.broadcast.emit('clientsUpdate', clients);
}
