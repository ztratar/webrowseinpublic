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

});
