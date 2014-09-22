//container for private objects and methods
var util = {

    triggerAdd: function(user_id) {
        var new_any = {
            "field": "assignee_id",
            "operator": "is",
            "value": user_id
        };
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.ajax('getTriggerData', trigger_id).done(function(trigger) {
                trigger.trigger.conditions.any.push(new_any);
                util.appFramework.ajax('modifyTrigger', util.triggerID, trigger.trigger).done(function(){
                    done();
                });
            });
        }); 
    },

    triggerRemove: function(user_id) {
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.ajax('getTriggerData', trigger_id).done(function(trigger) {
                trigger.trigger.conditions.any = _.filter(trigger.trigger.conditions.any, function(object) {
                    return object.value !== user_id;
                });
                util.appFramework.ajax('modifyTrigger', util.triggerID, trigger.trigger).done(function(){
                    done();
                });
            });
        }); 
    }
};

//see module_template.js for documentation on the module format and how to create new modules
module.exports = {

    factory: function(context) {
        util.appFramework = context;
        util.fetch_data = context.require('fetch_data');
        util.triggerID = util.fetch_data.getTriggerID();
        util.fieldID = util.fetch_data.getUserFieldID();
        return {
            toggleStatus: this.toggleStatus,
            unassignAll: this.unassignAll,
        }
    },
    
    toggleStatus: function(user_id) {
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.ajax('getSingleAgent', user_id).done(function(agent) {
                if(agent.user_fields.agent_ooo) {
                    util.appFramework.when(util.appFramework.ajax('setAgentStatus', user_id, false),
                                           util.triggerRemove(user_id))
                    .done(function() {
                        done();
                    })
                } else {
                    util.appFramework.when(util.appFramework.ajax('setAgentStatus', user_id, true),
                                           util.triggerAdd(user_id))
                    .done(function() {
                        done();
                    });
                };
            });
        });
    },

    unassignAll: function(user_id) {
        return util.appFramework.promise(function(done, fail) {
            util.fetch_data.getAll('tickets', ['ticketSearch', user_id]).done(function(tickets) {
                var ticketIDs = [];
                _.each(tickets, function(ticket) {
                    ticketIDs.push(ticket.id);
                });
               util.appFramework.ajax('unassignMany', ticketIDs).done(function() {
                    done();
               });
            });
        });
    },
};
