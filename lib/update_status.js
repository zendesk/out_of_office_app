var requests = {
    
    setAgentStatus: function(user_id, away_status) {
        return {
            url: helpers.fmt('/api/v2/users/%@.json', user_id),
            dataType: 'JSON',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                "user": {
                    "user_fields": {
                        "agent_ooo": away_status
                    }
                }
            })
        };
    },

    ticketSearch: function(user_id) {
        user_id = encodeURIComponent(user_id);
        return {
            url: helpers.fmt('/api/v2/search?query=type%3Aticket%20assignee%3A%@%20status%3Aopen', user_id)
        };
    },

    ticketPreview: function(user_id, page) {
        user_id = encodeURIComponent(user_id);
        return {
            url: helpers.fmt('/api/v2/views/preview.json?page=%@', page),
            dataType: 'JSON',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                "view": {
                    "title": 'out-of-office app [System View]',
                    "active": true,
                    "conditions" : {
                        "all": [
                            {
                            "field": "status",
                            "operator": "is",
                            "value": "open"
                        },
                        {
                            "field": "assignee_id",
                            "operator": "is",
                            "value": user_id
                        }
                        ]
                    }
                }
            })
        };
    },

    unassignMany: function(ticketIDs) {
        return {
            type: 'PUT',
            url: helpers.fmt('/api/v2/tickets/update_many.json?ids=%@', ticketIDs.toString()),
            contentType: 'application/json',
            data: JSON.stringify({
                "ticket": {
                    "assignee_id": null
                }
            })
        };
    }
};

var util = {

    version: '2.0',        

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

module.exports = {

    factory: function(context, settings) {
        _.extend(context.requests, requests); //add in needed requests for the module    
        _.extend(util, context.require('get_all')); //add in getAll methods to util
        util.appFramework = context;
        util.settings = settings;
        return this.toggleStatus;
    },

    toggleStatus: function(user_id, unassignTickets) {
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.ajax('getSingleAgent', user_id).done(function(agent) {
                agent = agent.user;
                util.appFramework.ajax('setAgentStatus', user_id, !agent.user_fields.agent_ooo)
                .done(function(agent) {
                    agent = agent.user;
                    var status = 'here';
                    if(agent.user_fields.agent_ooo) {
                        status = 'away';
                    }
                    if(unassignTickets) {
                        util.unassignAll(agent);
                    }
                    util.appFramework.trigger('status_changed', {agent: agent});                    
                    done(status);
                });
            });
        });
    },
};
