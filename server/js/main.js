var MainApp = {
	init: function() {
   		var that = this,
			view;

        this.socket = io.connect('http://127.0.0.1');
        this.model = new models.NodeVisitsModel();

        view = this.view = new NodeVisitsView({
			model: this.model, 
			socket: this.socket, 
			el: $('body')
		});

        this.socket.on('message', function(msg) { view.msgReceived(msg); });
		this.socket.on('clientsUpdate', function (data) {
		    $("#client_count").html(data);
		});

		this.view.render();

		return this;
	}
};


$(function() {

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

});
