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

var NodeVisitsView = Backbone.View.extend({
    initialize: function(options) {
        this.model.visits.on('add', this.addVisit, this);
        this.socket = options.socket;
        this.clientCountView = new ClientCountView({
			model: new models.ClientCountModel(),
			el: $('#client_count')
		});
    },
	
	render: function() {
    },

    addVisit: function(visit) {
        var view = new VisitView({
			model: visit
		});
		this.$('ul.links').prepend(view.$el);
		view.render();
		view.$el.hide();
		view.$el.slideDown();
    },

    msgReceived: function(message){
        switch(message.event) {
            case 'initial':
                this.model.mport(message.data);
                var that = this;
                this.model.visits.each(function(visit){
                    that.addVisit.call(that, visit);
                });
                break;
            case 'visit':
                var newVisitEntry = new models.Visit();
                newVisitEntry.mport(message.data);
                this.model.visits.add(newVisitEntry);
                break;
            case 'update':
                this.clientCountView.model.updateClients(message.clients);
                break;
        }
    }

});

