
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
                util.findObject('getTriggers', 'triggers', 'title', util.settings.triggerTitle)
            ).done(function(field, trigger) {

                if(trigger !== undefined && field !== undefined) {
                    done();
                } else if(field === undefined && trigger === undefined && util.settings.createTrigger) {
                    util.appFramework.when(
                        util.appFramework.ajax('createUserField'),
                        appFramework.ajax('createTrigger')
                    ).done(function() {done();})
                } else if(field === undefined) {
                    util.appFramework.ajax('createUserField').done(function(userField) {done();});
                } else if(trigger === undefined && util.settings.createTrigger) {
                    util.appFramework.ajax('createTrigger').done(function(trigger) {done();});
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
        var settings = util.settings;
        util.installApp().done(function() {
            settings.installed = true;
            app.trigger('loaded_settings', {settings: settings});
        });
    },
};
