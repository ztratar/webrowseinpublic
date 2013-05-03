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
			MainApp.visitsStream.subscribeToChannel('visits');
		},

		user: function(id) {
			console.log('user', id);
			MainApp.visitsStream.subscribeToChannel('user-'+id+'-visits');
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
