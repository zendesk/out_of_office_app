//see module_template.js for documentation on the module format and how to create new modules
var util = {
    getInstallationID: function() {
        util.getAll('installations', ['getInstalledApps']).done(function(data) {
            var app = _.find(data, function(app) { return app.appTitle == 'ooo_app'})
            if(app == undefined) {  //will be undefined if the filter failed to find something
                return undefined     //if it isn't found, return undefined.
            } else {
                return app.id;      //return the app ID
            }
        });
    },

    checkInstalled: function() {
        var field = this.getUserFieldID();
        var trigger = this.getTriggerID();

        return util.appFramework.promise(function(done, fail) {  //load the values for trigger and field IDs
            if(field == undefined || trigger == undefined) { //if either of them are unable to be found
                fail();                                     //call the fail method
            } else {
                done(field, trigger);                       //otherwise, succeed and return the IDs
            }
        });
    },

    getTriggerID: function() {
        return util.appFramework.promise(function(done, fail) {
            util.getAll('triggers', ['getTriggers']).done(function(data) {
                var trigger = _.find(data, function(trigger) { return trigger.title == util.settings.triggerTitle }); //use _.find to return the first trigger with a matching title
                if(trigger == undefined) {  //will be undefined if the filter failed to find something
                    done(undefined);     //if it isn't found, return undefined.
                } else {
                    done(trigger.id);      //return the trigger ID
                }
            });

        });
    },   


};

module.exports = {
    
    factory: function(context, settings) { 
        util.appFramework = context; //provide the App Framwork to the functions 
        util.settings = settings;
        util.getAll = context.require('get_all');
        return {
            loadSettings: this.loadSettings,
        };
    },


    loadSettings: function() {
        var settings = util.settings;
        var app = util.appFramework;

        if(app.installationId() === 0) {
            settings.installed = false;         //will have to detect settings instead of using stored values
        } else if ((app.settings('triggerID') === undefined && settings.createTrigger === true)){
            setings.installed = false;
        } else if(app.settings('checkboxID') === undefined) {
            setings.installed = false;            
        } else {
            settings.installed = true;
        }
        
        util.getTriggerID().done(function(triggerID) {
            settings.triggerID = triggerID;
        app.trigger('loaded_settings', {settings: settings});        
        
        });
    },


    installApp: function() {
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.when(
                util.appFramework.ajax('createUserField'),
                util.appFramework.ajax('createTrigger')
            ).done(function(userField, trigger) {
                var installID = util.fetchData.getInstallationID()
                util.appFramework.when(util.appFramework.ajax('modifySettings', 'checkboxID', userField.user_field.id, installID), 
                                       util.appFramework.ajax('modifySettings', 'triggerID', trigger.trigger.id, installID)
                ).done(function() {
                    done();
                });
            });
        });
    }
};
