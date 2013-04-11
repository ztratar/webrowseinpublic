//
//Views
//

var VisitView = Backbone.View.extend({
    tagName: 'li',

    initialize: function(options) {
        this.template = _.template($("#visitView-template").html());
    },

    render: function() {
		var linkIsImage = this.model.get('link').match(/\.(png|jpg|gif)/) ? true : false,
			linkIsYoutube = this.model.get('link').match(/youtube.com\/watch/),
			templateVars = _.extend({
				isImage: linkIsImage,
				isYoutube: linkIsYoutube
			}, this.model.toJSON());
        this.$el.html(this.template(templateVars));
        return this;
    }
});

var ClientCountView = Backbone.View.extend({
    initialize: function(options) {
        _.bindAll(this, 'render');
        this.model.bind('all', this.render);
    },

    render: function() {
        this.el.html(this.model.get("clients"));
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
        var view = new VisitView({
			model: visit
		});
		this.$el.prepend(view.$el);
		view.render();
		view.$el.hide();
		view.$el.slideDown();
	}
});
