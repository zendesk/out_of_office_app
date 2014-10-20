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

    installApp: function() {
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.when(
                util.appFramework.ajax('createTrigger'),
                util.appFramework.ajax('createUserField')               
            ).always(function(trigger, userField, a, b, c) {
                console.log(trigger);
                console.log(userField);
                                console.log(a);
                console.log(b);
                console.log(c);

                
                done(trigger.id, userField.id);
            }).fail(function(userField, trigger, a, b, c, d) {
                console.log(trigger);
                console.log(userField);
                console.log(a);
                console.log(b);
                console.log(c);
                console.log(d);
                done(trigger.id, userField.id);                
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
        
        app.when(util.getTriggerID(), util.getUserFieldID(), util.getInstallationID()).done(function(trigger, field, installation) {
            if ((trigger === undefined && settings.createTrigger === true) || field === undefined){
                util.installApp().done(function(trigger, field) {
                    app.trigger('created_requirements', {settings: settings});  
                    settings.triggerID = trigger;
                    console.log(trigger);
                    settings.installed = true;
                    app.trigger('loaded_settings', {settings: settings});        
                });
            } else { 
                settings.triggerID = trigger;
                    console.log(trigger);
                settings.installed = true;
                app.trigger('loaded_settings', {settings: settings});   
            }
        });
    },
};
