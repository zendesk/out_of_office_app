
//container for private objects and methods
var util = {
};

//see module_template.js for documentation on the module format and how to create new modules
module.exports = {

    factory: function(context) {
        util.appFramework = context;
        return {
            getAll: context.require('get_all'),
            getUserFieldID: this.getUserFieldID,
            getTriggerID: this.getTriggerID,
            getInstallationID: this.getInstallationID,
            checkInstalled: this.checkInstalled,
        }
    },

    getUserFieldID: function() {
        if(util.appFramework.settings['UserFieldID'] != undefined) {
            return util.appFramework.settings['UserFieldID'];                                            //if the settings are loaded, just return the settings value
        }
        this.getAll('user_fields', ['getUserFields']).done(function(data) {
            var field = _.find(data, function(field) { return field.key == util.appFramework.userFieldKey }); //use _.find to return the first field with a matching key
            if(field == undefined) {  //will be undefined if the filter failed to find something
                return undefined     //if it isn't found, return undefined.
            } else {
                return field.id;      //return the field ID
            }
        });
    },

    getTriggerID: function() {
        if(util.appFramework.settings['triggerID'] != undefined) {
            return util.appFramework.settings['triggerID'];                                            //if the settings are loaded, just return the settings value
        }
        this.getAll('triggers', ['getTriggers']).done(function(data) {
            var trigger = _.find(data, function(trigger) { return trigger.title == util.appFramework.triggerTitle }); //use _.find to return the first trigger with a matching title
            if(trigger == undefined) {  //will be undefined if the filter failed to find something
                return undefined     //if it isn't found, return undefined.
            } else {
                return trigger.id;      //return the trigger ID
            }
        });
    },   
    
    getInstallationID: function() {
        if(util.appFramework.installationId() != 0) {
            return util.appFramework.installationId();                                      //if the settings are loaded, just return the settings value
        }
        this.getAll('installations', ['getInstalledApps']).done(function(data) {
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
    }

};
