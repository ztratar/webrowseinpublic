var MainApp = {
	init: function() {
   		var that = this,
			view;

        this.socket = io.connect('http://127.0.0.1');

        this.clientCountView = new ClientCountView({
			model: new models.ClientCountModel(),
			el: $('#client_count')
		});

        this.visitsStream = new models.Visits();

		this.visitStreamView = new VisitsStreamView({
			collection: this.visitsStream
		});
		$('.visits-stream-container').html(this.visitStreamView.$el);

        this.socket.on('message', _.bind(this.socketMessageRecieved, this));
		this.socket.on('clientsUpdate', function (data) {
			$("#client_count").html(data);
		});

		this.socket.on('numberUpdate', function(data) {
			$("#link_count").html(data);
		});

		this.bindLinks();

		return this;
	},
	currentlyListening: [],
	datastreamSubscribe: function(page, model, channel) {
		console.log('subscribed to', channel);
		MainApp.socket.emit('subscribe', { room: channel });
		MainApp.socket.on('update-'+channel, function(data) {
			console.log('receiving update on', channel);
			if (model instanceof Backbone.Model) {
				model.set(data);	
			} else if (model instanceof Backbone.Collection) {
				model.add(data);
			} else {
				throw "Requires 2nd parameter to be instance of Model or Collection";
			}		
		});
	},
	datastreamUpdateListeners: function(currentPage) {
		_.each(this.currentlyListening, function(room) {
			MainApp.socket.emit('unsubscribe', { room: room });
		});
		this.currentlyListening = [];
	},
	bindLinks: function() {
		$(document).on('click', 'a', function(e) {
			var link = $(this).attr('href');

			if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
				return;
			}

			if (link && link.substring(0, 1) === '/') {
				window.mainApp.router.navigate(link, {
					trigger: true
				});
				return false;
			}

			if (link && link.substring(0, 1) === '#') {
				return false;
			}
		});
	},
	socketMessageRecieved: function(msg) {
		var that = this;

		switch (msg.event) {
			case 'initial':
				that.visitsStream.reset(msg.data.visits);
				break;
			case 'visit':
				var newVisitEntry = new models.Visit();
				newVisitEntry.set(msg.data);
				that.visitsStream.add(newVisitEntry);
				break;
			case 'update':
				that.clientCountView.model.updateClients(msg.clients);
				break;
		}
	}

};

$(function() {

	var AppRouter = Backbone.Router.extend({
		routes: {
			'user/:id': 'user',
			'': 'index'
		},

		index: function(path) {
			console.log('path', path);
			MainApp.datastreamSubscribe('', MainApp.visitsStream, 'visits');
		},

		user: function(id) {
			console.log('user', id);
			MainApp.datastreamSubscribe('', MainApp.visitsStream, 'user-'+id+'-visits');
		}
	});

	$('.signup-login form').submit(function(){
		return false;
		var username = $(this).find('input[name="username"]'),
			password = $(this).find('input[name="password"]');
		if (username && password) {
			$.post('/api/0.1/login', {
				username: username,
				password: password		
			}, function(data) {
				console.log(data);
			});
		}	
	});

	window.mainApp = MainApp.init();
	window.mainApp.router = new AppRouter();

	Backbone.history.start({
		pushState: true 
	});

	var currentURL = document.URL,
		currentPath = currentURL.replace('http://127.0.0.1:3000/','');

	if (currentPath) {
		window.mainApp.router.navigate(currentPath, { trigger: true });
	}

});
