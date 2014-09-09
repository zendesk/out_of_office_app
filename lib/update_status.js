module.exports = {
    
    requires: app framework
    requests: post

    /*
     * Conditionally change agent status to whatever it isn't set to currently
     *
     * paramaters: user_id of agent to be set
     * return: true if set to away, false if set to available
     * Side Effects: Notifications, re-renders the UI, updates the agent specified
     * to invert their current OOO status
     *
     */
    toggleStatus: function(user_id) {
        promise
            set user field data
            toggle_trigger1      
        success/fail
        
        this.ajax('getSingleAgent', user_id)
        .done(function(data) {
          var user = data.user;
          this.ajax('setAgentStatus', user_id, !user.user_fields.agent_ooo) //side effect
          .done(_.bind(function() {
            this.toggleTrigger(user_id, !user.user_fields.agent_ooo); // moved this to before refreshlocation to prevent race conditions.
            this.notifySuccess();
            this.refreshLocation();
          }, this))
            .fail(_.bind(function() {
              this.notifyFail(); //side effect
            }, this));
        });
    },

    unassignAll:  function(user_id) {
        promise 
            fetch_user_tickets
                :done
                get_ids
                update tickets 
        success/fail
      
            
     //TODO: docs
    toggleTrigger: function(user_id, away_status) {
        promise
            get current trigger
                :done
                generate_new_logic
                send_trigger
        success/fail


      var trigger_id = this.setting('triggerID');
      this.ajax('getTriggerData', trigger_id)
        .done(_.bind(function(triggerdata) {
          var conditions = triggerdata.trigger.conditions;
          var any = conditions.any;
          if (away_status === true) {
            var new_any = {
              "field": "assignee_id",
              "operator": "is",
            "value": user_id
            };
            var addTrigger = triggerdata;
            addTrigger.trigger.conditions.any.push(new_any);
            this.ajax('modifyTrigger', trigger_id, addTrigger);
          } else {
            var newdata = _.filter(any, function(object) {
              return object.value !== user_id;
            });
            var removeTrigger = triggerdata;
            removeTrigger.trigger.conditions.any = newdata;
            this.ajax('modifyTrigger', trigger_id, removeTrigger);
          }
        }, this))
        .fail(_.bind(function() {
          this.notifyFail();
        }, this));
    },
    
    generate_trigger_logic :trigger :additions :deletions
        from :trigger copy attributes if not in :deletions
        add :additions to :trigger
        return trigger

    factory: function(context) {
        console.log('update_status');        
        return {
            toggleStatus: _.bind(this.toggleStatus, context),
            unassignAll: _.bind(this.unassignAll, context),
            toggleTrigger: _.bind(this.toggleTrigger, context),            
        }
    }
};
