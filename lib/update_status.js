//container for private objects and methods
var util = {

    triggerAdd: function(user_id) {
        var new_any = {
            "field": "assignee_id",
            "operator": "is",
            "value": user_id
        };
        return util.appFramework.promise(function(done, fail) {
            if(util.settings.createTrigger === false) {
                done();
            } else {

                util.appFramework.ajax('getTriggerData', util.settings.triggerID).done(function(trigger) {
                    trigger.trigger.conditions.any.push(new_any);
                    util.appFramework.ajax('modifyTrigger', util.settings.triggerID, trigger.trigger).done(function(){
                        done();
                    });
                });
            }
        }); 
    },

    triggerRemove: function(user_id) {
        return util.appFramework.promise(function(done, fail) {
            if(util.settings.createTrigger === false) {
                done();
            } else {
                util.appFramework.ajax('getTriggerData', util.settings.triggerID).done(function(trigger) {

                    trigger.trigger.conditions.any = _.filter(trigger.trigger.conditions.any, function(object) {
                        return object.value !== user_id;
                    });
                    util.appFramework.ajax('modifyTrigger', util.settings.triggerID, trigger.trigger).done(function(){
                        done();
                    });
                });
            }
        }); 
    },

    unassignAll: function(agent) {
        return util.appFramework.promise(function(done, fail) {
            util.getAll('results', ['ticketSearch', agent.email]).done(function(tickets) {

                if(tickets[0] === undefined) { 
                    util.appFramework.trigger('unassigned_ooo', {count: 0, name: agent.name});

                    done();
                } else {

                    var ticketIDs = [];
                    _.each(tickets, function(ticket) {
                        ticketIDs.push(ticket.id);
                    });

                    util.appFramework.ajax('unassignMany', ticketIDs).done(function() {
                        util.appFramework.trigger('unassigned_ooo', {count: ticketIDs.length, name: agent.name});

                        done();
                    });
                }
            });
        });
    },

};

//see module_template.js for documentation on the module format and how to create new modules
module.exports = {

    factory: function(context, settings) {
        util.appFramework = context;
        util.settings = settings;
        util.getAll = context.require('get_all');
        return {
            toggleStatus: this.toggleStatus,
            unassignAll: this.unassignAll,
        };
    },

    toggleStatus: function(user_id, unassignTickets) {
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.ajax('getSingleAgent', user_id).done(function(agent) {
                agent = agent.user;
                if(agent.user_fields.agent_ooo) {
                    util.appFramework.when(
                        util.appFramework.ajax('setAgentStatus', user_id, false),
                        util.triggerRemove(user_id))
                        .done(function() {
                            agent.user_fields.agent_ooo = false;
                            util.appFramework.trigger('status_changed', {agent: agent});
                            util.appFramework.trigger('render_app');
                            done('here');
                        }).fail(function() {
                            util.appFramework.trigger('status_error', {agent: agent});
                        });
                } else { 
                    util.appFramework.when(
                        util.appFramework.ajax('setAgentStatus', user_id, true),
                        util.triggerAdd(user_id))
                        .done(function() {
                            agent.user_fields.agent_ooo = true;
                            if(unassignTickets) {
                                util.unassignAll(agent).done(function() {
                                    util.appFramework.trigger('status_changed', {agent: agent});
                                    util.appFramework.trigger('render_app');
                                    done('away');
                                });
                            } else {

                                util.appFramework.trigger('status_changed', {agent: agent});
                                util.appFramework.trigger('render_app');
                                done('away');
                            }
                        }).fail(function() {
                            util.appFramework.trigger('status_error', {agent: agent});
                        });
                }
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
