//container for private objects and methods
var util = {

    stripNumber: function(url) {
        if(url.indexOf("=") != -1) {
            return url.substring(url.lastIndexOf("=")+1);
        } else {
            return undefined;
        }
    },

    generateTrigger: function(conditions) {
        var trigger = {
             "trigger": {
              "active": true,
              "conditions": {
                "all": [
                  {
                    "field": "status",
                    "operator": "not_value",
                    "value": "solved"
                  }
                ],
                "any": conditions
              },
              "actions": [{
                "field": "assignee_id",
                "value": ""
              }]
            }

        };
        return trigger;
    },

    getRows: function(member, request, fn, data) {
        if(data === undefined) { //if no data was passed, create an empty array
            data = [];
        }
        if(request[2] === undefined) {
            request.push(1);
        }
        util.appFramework.ajax.apply(util.appFramework, request).done(function(newdata){ //get a page of the request
            data = data.concat(newdata[member]); //add the previously passed data to the new data, using the identifier passed in (for example users)
            if(newdata.next_page === null) { //check to see if there is another page to load
                fn(data);
            } else {
                request[2] = util.stripNumber(newdata.next_page);
                util.getRows(member, request, fn, data); //if there is another page, call getAll again - will eventually reach the end and call done()
            }
        });
    },

    getView: function(member, request) {
        return util.appFramework.promise(function(done, fail) {
            
            util.getRows(member, request, done);   
        });
    },

    splitArray: function(array, chunk) {
        var result = [];
        for (var i = 0; i < array.length; i += chunk) {
            result.push(array.slice(i,i+chunk));
        }
        return result;
    },
    postPage: function(request, data, index, fn) { 

        util.appFramework.ajax(request, data[index]).done(function() {
            console.log(index);                
            index++;
            if(index == data.length) {
                console.log('done');
                fn();
            } else {
                util.postPage(request, data, index, fn);                
            }
        });

    },

    batchPost: function(request, data) {
        return util.appFramework.promise(function(done, fail) {
            var split = util.splitArray(data, 100);
            util.postPage(request, split, 0, done);
        });
    },


    triggerAdd: function(agent) {
        var user_id = agent.id;

        var new_any = {
            "field": "assignee_id",
            "operator": "is",
            "value": user_id
        };
        return util.appFramework.promise(function(done, fail) {
            if(util.settings.createTrigger === false) {
                done();
            } else {
                console.log(util.settings.triggerID);
                util.appFramework.ajax('getTriggerData', util.settings.triggerID).done(function(trigger) {
                    
                    var newTrigger = {};
                    
                    var conditions = trigger.trigger.conditions.any;
                    conditions.push(new_any);
                    util.appFramework.ajax('modifyTrigger', util.settings.triggerID, util.generateTrigger(conditions)).always(function(){
                        done();
                    });
                });
            }
        }); 
    },

    triggerRemove: function(agent) {
        var user_id = agent.id;

        return util.appFramework.promise(function(done, fail) {
            if(util.settings.createTrigger === false) {
                done();
            } else {
                util.appFramework.ajax('getTriggerData', util.settings.triggerID).done(function(trigger) {

                    var conditions = _.filter(trigger.trigger.conditions.any, function(object) {
                        return object.value !== user_id;
                    });
                    util.appFramework.ajax('modifyTrigger', util.settings.triggerID, util.generateTrigger(conditions)).always(function(){
                        done();
                    });
                });
            }
        }); 
    },

    unassignAll: function(agent) {
        return util.appFramework.promise(function(done, fail) {
            util.getView('rows', ['ticketPreview', agent.id]).done(function(tickets) { // changed by jeremiah

                if(tickets[0] === undefined) { 
                    util.appFramework.trigger('unassigned_ooo', {count: 0, name: agent.name});

                    done();
                } else {

                    var ticketIDs = [];
                    _.each(tickets, function(ticket) {
                        ticketIDs.push(ticket.ticket.id);
                    });

                    util.batchPost('unassignMany', ticketIDs).done(function() {
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
        return this.toggleStatus;
    },

    toggleStatus: function(user_id, unassignTickets) {
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.ajax('getSingleAgent', user_id).done(function(agent) {
                agent = agent.user;
                if(agent.user_fields.agent_ooo) {
                    util.appFramework.when(
                        util.appFramework.ajax('setAgentStatus', user_id, false),
                        util.triggerRemove(agent))
                        .done(function() {
                            agent.user_fields.agent_ooo = false;
                            util.appFramework.trigger('status_changed', {agent: agent});
                            util.appFramework.trigger('render_app'); 
                            done('here');
                        }).fail(function() {
                            util.appFramework.trigger('status_error', {agent: agent});
                            util.appFramework.trigger('render_app');                            
                        });
                } else { 
                    util.appFramework.when(
                        util.appFramework.ajax('setAgentStatus', user_id, true),
                        util.triggerAdd(agent))
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
                            util.appFramework.trigger('render_app');                            
                        });
                }
            });
        });
    },
};
