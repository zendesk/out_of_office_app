var util = {

    version: '2.0',    
    
    findObject: function(request, member, attribute, value) {
        return util.appFramework.promise(function(done, fail) {
            util.getAll(member, [request]).done(function(data) {
                var found = _.find(data, function(item) { return item[attribute] == value; }); //use _.find to return the first trigger with a matching title
                done(found);    //will be undefined if nothing is found
            });
        });
    },

    installApp: function() {
        return util.appFramework.promise(function(done, fail) {

            util.appFramework.when(
                util.findObject('getUserFields', 'user_fields', 'key', util.settings.userFieldKey),
                util.findObject('getTriggers', 'triggers', 'title', "Ticket: " + util.settings.triggerTitle),
                util.findObject('getTriggers', 'triggers', 'title', "Tag: " + util.settings.triggerTitle)
            ).done(function(field, trigger1, trigger2) {

                var requests = [];

                if(field === undefined) {
                    requests.push(util.appFramework.ajax('createUserField'));
                }

                if(trigger1 === undefined && util.settings.createTrigger) {
                    requests.push(util.appFramework.ajax('createTrigger'));
                }

                if(trigger2 === undefined && util.settings.createTrigger) {
                    requests.push(util.appFramework.ajax('createTagTrigger'));
                }
                if(requests.length !== 0) {
                    util.appFramework.when(requests).done(function() {
                        console.log(arguments);
                        done();
                    });
                } else {
                    done();
                }
            });
        });
    }

};

module.exports = {

    factory: function(context, settings) {
        _.extend(util, context.require('get_all')); //add in getAll methods to util
        util.appFramework = context; //provide the App Framwork to the functions 
        util.settings = settings;
        return this.loadSettings;
    },

    loadSettings: function() {
        var app = util.appFramework;
        var options = util.settings;
        _.extend(options, app.settings)

        util.installApp().done(function() {
            app.trigger('loaded_settings', {settings: options});
        });
    },
};
