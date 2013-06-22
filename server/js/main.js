var MainApp = {
	init: function() {
   		var that = this,
			view;

        this.socket = io.connect('http://127.0.0.1');

		this.view = new AppView();
		this.view.render();

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
			var view = new HomeView();
			MainApp.view.switchView(view);
		},

		user: function(id) {
			var user = new models.User({
					id: id	
				}),
				view = new ProfileView({
					model: user		
				});
			MainApp.view.switchView(view);
		}
	});

	window.mainApp = MainApp;
	window.mainApp.init();
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
