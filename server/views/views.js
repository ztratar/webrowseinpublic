//
//Views
//

var AppView = Backbone.View.extend({
    initialize: function(options) {
        this.template = _.template($("#appView-template").html());

		this.signupView = new SignupHeaderView();

		this.clientCount = new models.StatModel();
        this.clientCountView = new StatView({
			className: 'stat-view pull-right',
			model: this.clientCount,
			title: ' online now'
		});

		this.linkCount = new models.StatModel();
		this.linkCountView = new StatView({
			className: 'stat-view pull-right',
			model: this.linkCount,
			title: ' links shared today'
		});

		this.clientCount.subscribeToChannel('client_count', {
			isRoom: false	
		});
		this.linkCount.subscribeToChannel('link_count', {
			isRoom: false	
		});
    },
	render: function() {
		$('.app-container').html(this.$el);
		this.$el.html(this.template());

		this.viewContainer = this.$('.view-container');
		this.mastheadContainer = this.$('.masthead-container');

		this.mastheadContainer.html(this.signupView.$el);
		this.signupView.render();

		this.clientCountContainer = this.$('.client-count-container');
		this.linkCountContainer = this.$('.link-count-container');

		this.clientCountContainer.html(this.clientCountView.$el);
		this.clientCountView.render();

		this.linkCountContainer.html(this.linkCountView.$el);
		this.linkCountView.render();

		return this;
	},
	switchView: function(view) {
		if (this.currentView) {
			this.currentView.remove();
		}
		this.currentView = view;
		this.viewContainer.html(this.currentView.$el);
		this.currentView.render();
	}
});

var SignupHeaderView = Backbone.View.extend({
	initialize: function() {
        this.template = _.template($("#signupHeaderView-template").html());
	},
	render: function() {
		this.$el.html(this.template());
		return this;
	}
});

var VisitItemView = Backbone.View.extend({
    tagName: 'li',
	className: 'visit-view',

	events: {
		'click ul.actions a': 'clickedAction'	
	},

    initialize: function(options) {
        this.template = _.template($("#visitView-template").html());
		this.model.on('change', this.render, this);
		this.model.subscribeToChannel('visit-'+this.model.get('_id'));
    },

    render: function() {
		var linkIsImage = this.model.get('link').match(/\.(png|jpg|gif)/) ? true : false,
			urlExt = this.model.get('link').substr(this.model.get('link').indexOf(this.model.get('domain').domain)+this.model.get('domain').domain.length),
			linkIsYoutube = this.model.get('link').match(/youtube.com\/watch/),
			templateVars = _.extend({
				isImage: linkIsImage,
				isYoutube: linkIsYoutube,
				model: this.model,
				urlExt: urlExt
			});
        this.$el.html(this.template(templateVars));
        return this;
    },

	clickedAction: function(ev) {
		var targ = $(ev.currentTarget),
			action = targ.attr('class');	
		window.mainApp.socket.emit('visit-action', {
			visit_id: this.model.get('_id'),
			user_id: 0,
			stat: action	
		});
		return false;
	}

});

var StatView = Backbone.View.extend({
	tagName: 'div',
	className: 'stat-view',
	templates: {
		'simple': '<div class="num"><%- stat %></div><div><%- title %></div>'
	},
    initialize: function(options) {
		this.options = _.extend({
			title: '',	
			model: undefined,
			modelVar: 'stat',
			template: 'simple'
		}, options);

        _.bindAll(this, 'render');
        this.model.bind('all', this.render);
    },

    render: function() {
        this.$el.html(_.template(this.templates[this.options.template])({
			title: this.options.title,
			stat: this.model.get(this.options.modelVar)	
		}));
        return this;
    }
});

var VisitsStreamView = Backbone.View.extend({
	tagName: 'ul',
	className: 'visits-stream-view',
	initialize: function(options) {
		this.collection.on('add', this.addOne, this);
		this.collection.on('reset', this.addAll, this);
	},
	addAll: function() {
		var that = this;
		this.collection.each(function(visit){
			that.addOne.call(that, visit);
		});
	},
	addOne: function(visit) {
        var view = new VisitItemView({
			model: visit
		});
		this.$el.prepend(view.$el);
		view.render();
		view.$el.hide();
		view.$el.slideDown();
	}
});

var TopDomainsView = Backbone.View.extend({
	className: 'top-domains',
	initialize: function(options) {
		this.collection.on('add', this.addOne, this);
		this.collection.on('reset', this.addAll, this);
		this.template = _.template($('#topDomainsView-template').html());
	},
	render: function() {
		this.$el.html(this.template());
		this.domainsContainer = this.$('.top-domains-container');
	},
	addAll: function() {
		var that = this;
		this.collection.each(function(visit){
			that.addOne.call(that, visit);
		});
	},
	addOne: function(domain) {
        var view = new TopDomainItemView({
			model: domain
		});
		this.domainsContainer.append(view.$el);
		view.render();
	}
});

var TopDomainItemView = Backbone.View.extend({
	tagName: 'li',
	className: 'top-domain-item',
	initialize: function() {
		this.template = _.template($('#topDomainItemView-template').html());
		this.model.on('all', this.render, this);
	},
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
});

// Page view that is used to clear listening
// states for models and collections on sockets
var PageView = function(options) {
	var that = this;
	Backbone.View.apply(this, [options]);
};
_.extend(PageView.prototype, Backbone.View.prototype, {
	listening: [],
	remove: function() {
		var i;
		for (i = 0; i < this.listening.length; i++) {
			this.listening[i].unsubscribe();
		}
		this.$el.remove();
	}
});
PageView.extend = Backbone.View.extend;

// Page Views
var HomeView = PageView.extend({
	className: 'home-view',
	initialize: function() {
		this.template = _.template($('#homeView-template').html());

		this.visits = new models.Visits();
		this.streamView = new VisitsStreamView({
			collection: this.visits
		});

		this.topLinks = new models.Visits();
		this.topLinksView = new VisitsStreamView({
			collection: this.topLinks
		});

		this.visits.subscribeToChannel('visits');	
		this.topLinks.subscribeToChannel('top-links-today');

		this.listening = [this.visits];
	},
	render: function() {
		this.$el.html(this.template());

		this.$('.stream-container').html(this.streamView.$el);
		this.$('.top-links-container').html(this.topLinksView.$el);

		this.streamView.addAll();
		this.topLinksView.addAll();
		return this;
	}
});

var ProfileView = PageView.extend({
	className: 'profile-view',
	initialize: function() {

	}
});

var DomainView = PageView.extend({
	className: 'domain-view',
	initialize: function() {

	}
});
