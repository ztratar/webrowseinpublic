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
				type: 'visit',
				data: {
					link: url,
					title: document.title,
					domain: domain
				}
			});
		}
	},
	setupActionNotifications: function() {
		var that = this;

		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			that.generateNotificationsWindow(request);
		});
	},
	generateNotificationsWindow: function(data) {
		data = data.data;
		
		/*jshint multistr: true */
		var htmlTemplate = ' \
			<div class="wbip-notification-window"> \
				<div> \
					User <%= user_id %> just <%= action %>\'d at \
				</div> \
				<div class="notification-title"> \
					<%= title %> \
				</div> \
			</div>',
			notif = $(
				$.trim(
					_.template(htmlTemplate, {
						user_id: data.user_id,
						action: data.action.toUpperCase(),
						title: data.visit.title	
					})
				)
			);	

		notif.appendTo($('body'));
		notif.animate({
			top: '+=30',
			opacity: 1
		}, 400, function() {
			_.delay(function() {
				notif.animate({
					top: '+=30',
					opacity: 0	
				}, 400, function() {
					notif.remove();
				});
			}, 4000);
		});
	},
	init: function(cb) {
		this.catchPage(document.URL);
		this.setupActionNotifications();
		return this;
	}
};

$(function() {
	window.webrowseinpublic = ChromeApp.init();
	setInterval(function() {
		ChromeApp.catchPage(document.URL);
	}, 3000);
});
