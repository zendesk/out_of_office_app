//see module_template.js for documentation on the module format and how to create new modules
var util = {

    findObject: function(request, member, attribute, value) {
        return util.appFramework.promise(function(done, fail) {
            util.getAll(member, [request]).done(function(data) {
                var found = _.find(data, function(item) { return item[attribute] == value; }); //use _.find to return the first trigger with a matching title

                if(found === undefined) {  //will be undefined if the filter failed to find something
                    done(undefined);     //if it isn't found, return undefined.
                } else {
                    done(found);      //return the trigger ID
                }
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
        util.appFramework = context; //provide the App Framwork to the functions 
        util.settings = settings;
        util.getAll = context.require('get_all');
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
