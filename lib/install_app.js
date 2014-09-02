module.exports = {
    
    /*
     * Calls the createUserField request to generate the needed user fields
     * TODO: create trigger as well
     * TODO: Need to grab the trigger ID and add it to the settings so when we add users to ANY we know what trigger to grab.
     *
     * Side Effects: many notifications, create trigger, create user field
     *
     */
    installApp: function() {
      this.ajax('createUserField') //side effect
      .done(_.bind(function(data) {
        services.notify('Successfully added required user fields.'); //side effect
      }, this))
        .fail(_.bind(function() {
          this.notifyFail(); //side effect
        }, this));
      this.ajax('createTrigger') //side effet
      .done(_.bind(function(data) {
        services.notify('Successfully added required trigger.');
        var trigger_id = data.trigger.id;
        this.addSetting('triggerID', trigger_id); // Need to grab the trigger ID and add it to the settings so when we add users to ANY we know what trigger to grab.
      }, this))
        .fail(_.bind(function() {
          this.notifyFail(); //side effect
        }, this));
    },

    //TODO: docs    
    addSetting: function(setting_name, setting_value) {
      if (setting_name == 'triggerID') {
        var data = {
          "settings": {
            "triggerID": setting_value
          }
        };
        this.ajax('modifySettings', data);
      }
    },

    factory: function(context) {
        console.log('install_app');        
        return {
            installApp: _.bind(this.installApp, context),
            addSetting: _.bind(this.addSetting, context)            
        }
    }
};
