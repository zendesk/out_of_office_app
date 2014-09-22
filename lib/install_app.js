//see module_template.js for documentation on the module format and how to create new modules
var util = {
};

module.exports = {
    
    factory: function(context) { 
        util.appFramework = context; //provide the App Framwork to the functions 
        util.fetchData = context.require('fetch_data'); //provides access to the getAll and other data fetch methods
        return this.installApp;
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
