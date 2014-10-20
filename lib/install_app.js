//see module_template.js for documentation on the module format and how to create new modules
var util = {

    getInstallationID: function() {
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.ajax('getInstalledApps').done(function(data) {
                data = data.installations;
                var app = _.find(data, function(app) { return app.settings.appTitle == util.settings.appTitle; }); //use _.find to return the first trigger with a matching title

                if(app === undefined) {  //will be undefined if the filter failed to find something
                    done(undefined);     //if it isn't found, return undefined.
                } else {
                    done(app.id);      //return the trigger ID
                }
            });

        });
    },   


    getUserFieldID: function() {
        return util.appFramework.promise(function(done, fail) {
            util.getAll('user_fields', ['getUserFields']).done(function(data) {
                var field = _.find(data, function(field) { return field.key == util.settings.userFieldKey; }); //use _.find to return the first trigger with a matching title
                if(field === undefined) {  //will be undefined if the filter failed to find something
                    done(undefined);     //if it isn't found, return undefined.
                } else {
                    done(field.id);      //return the trigger ID
                }
            });

        });
    },   

    getTriggerID: function() {
        return util.appFramework.promise(function(done, fail) {
            util.getAll('triggers', ['getTriggers']).done(function(data) {
                var trigger = _.find(data, function(trigger) { return trigger.title == util.settings.triggerTitle; }); //use _.find to return the first trigger with a matching title
                if(trigger === undefined) {  //will be undefined if the filter failed to find something
                    done(undefined);     //if it isn't found, return undefined.
                } else {
                    done(trigger.id);      //return the trigger ID
                }
            });

        });
    },   

    installApp: function(trigger, userField) {
        return util.appFramework.promise(function(done, fail) {
            var requests = [];

            if (userField === undefined) {
                util.appFramework.ajax('createUserField').done(function(userField) {
                    if(trigger === undefined && util.settings.createTrigger) {
                        util.appFramework.ajax('createTrigger').done(function(trigger) {
                            done(trigger.trigger.id, userField.id);
                        });
                    } else {
                        done(trigger.id, userField.id);                
                    }
                });    
            } else if(trigger === undefined && util.settings.createTrigger) {
                util.appFramework.ajax('createTrigger').done(function(trigger) {
                    done(trigger.trigger.id, userField.id);
                });
            }
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

        app.when(util.getTriggerID(), util.getUserFieldID(), util.getInstallationID()).done(function(trigger, field, installation) {
            if ((trigger === undefined && settings.createTrigger === true) || field === undefined){
                util.installApp(trigger, field).done(function(trigger, field) {
                    app.trigger('created_requirements', {settings: settings});  
                    settings.triggerID = trigger;
                    settings.installed = true;
                    app.trigger('loaded_settings', {settings: settings});        
                });
            } else { 
                settings.triggerID = trigger;
                settings.installed = true;
                app.trigger('loaded_settings', {settings: settings});   
            }
        });
    },
};
