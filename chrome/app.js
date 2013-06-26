var ChromeApp = {
	currentUrl: null,
	catchPage: function(url) {
		if (url !== this.currentUrl) {
			var that = this,
				domain = document.domain;

			this.currentUrl = url;

			if (domain.indexOf('www.') === 0) {
				domain = domain.slice(4);
			}

			this.onceImagesHaveStoppedLoading(function() {
				chrome.extension.sendMessage({
					type: 'visit',
					data: {
						link: url,
						title: document.title,
						domain: domain,
						image: that.getBestImageOnPage()
					}
				});
			});
		}
	},
	numImagesOnPage: 0,
	onceImagesHaveStoppedLoading: function(cb) {
		var that = this,
			$allImages = $('img');
		if ($allImages.length === this.numImagesOnPage) {
			cb();
		} else {
			this.numImagesOnPage = $allImages.length;
			setTimeout(function() {
				that.onceImagesHaveStoppedLoading(cb);	
			}, 3000);	
		}
	},
	getBestImageOnPage: function() {
		var $allImages = $('img'),
			imagesData = [],
			pageHeight = $(window).height(),
			pageWidth = $(window).width(),
			pageCenterX = pageWidth/2,
			pageCenterY = pageHeight/2,
			bestImage,
			scoreBoost = 0;

		$allImages.each(function(ind, elem) {
			var offset = $(elem).offset(),
				width = $(elem).width(),
				height = $(elem).height(),
				src = $(elem).attr('src'),
				imageCenterX = offset.left + (width/2),
				imageCenterY = offset.top + (height/2),
				closestX = 0,
				centerScoreX = 0,
				centerScore = 0,
				sizeScore = 0,
				score = 0;
				
			// lower score is better
			if (offset.left < pageCenterX &&
					offset.left + width > pageCenterX ) {
				centerScoreX = 0;
			} else if (offset.left + width < pageCenterX) {
				closestX = offset.left + width;
				centerScoreX = 7 * Math.abs(pageCenterX - closestX);
			} else {
				closestX = offset.left;
				centerScoreX = 7 * Math.abs(pageCenterX - closestX);
			}
			centerScore = centerScoreX + 5 * Math.abs(pageCenterY - imageCenterY);

			sizeScore = 1000000 / Math.pow(height * width, 0.66);

			score = centerScore + sizeScore;

			imagesData.push({
				score: score,
				height: height,
				width: width,
				src: src
			});
		});

		imagesData = _.sortBy(imagesData, function(obj) {
			return obj.score;	
		});

		if (imagesData.length === 1) {
			scoreBoost += 1000;
		}	
		
		if (imagesData.length && imagesData[0].score < (2000 + scoreBoost)) {
			bestImage = imagesData[0];
		}

		return bestImage;
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
