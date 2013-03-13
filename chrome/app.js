var ChromeApp = {
	init: function() {

		chrome.extension.sendMessage({
			link: document.URL,
			title: document.title
		}, function(response) {
			console.log(response);
		});

		return this;
	}
};

$(function() {
	window.webrowseinpublic = ChromeApp.init();
});
