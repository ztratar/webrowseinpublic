var ChromeApp = {
	currentUrl: null,
	catchPage: function(url) {
		if (url !== this.currentUrl) {
			var domain = document.domain;
			this.currentUrl = url;
			if (domain.indexOf('www.') === 0) {
				domain = domain.slice(4);
			}
			chrome.extension.sendMessage({
				link: url,
				title: document.title,
				domain: domain
			}, function(response) {
				console.log(response);
			});
		}
	},
	init: function() {
		this.catchPage(document.URL);
		return this;
	}
};

$(function() {
	window.webrowseinpublic = ChromeApp.init();
	setInterval(function() {
		ChromeApp.catchPage(document.URL);
	}, 3000);
});
