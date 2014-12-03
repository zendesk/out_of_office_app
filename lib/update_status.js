var requests = {

    getSingleAgent: function(user_id) {
        return {
            url: helpers.fmt('/api/v2/users/%@.json', user_id)
        };
    },

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

    tagTicket: function(ticketID) {
        return {
            type: 'POST',
            url: helpers.fmt('/api/v2/tickets/%@/tags.json', ticketID),
            contentType: 'application/json',
            data: JSON.stringify({
                "tags": ["agent_ooo"]
            })
        };
    },

    unTagTicket: function(ticketID) {
        return {
            type: 'DELETE',
            url: helpers.fmt('/api/v2/tickets/%@/tags.json', ticketID),
            contentType: 'application/json',
            data: JSON.stringify({
                "tags": ["agent_ooo"]
            })
        };
    },

    pendingTickets: function(user_id, page) {
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
                        "all": [{
                            "field": "status",
                            "operator": "greater_than",
                            "value": "open"
                        },
                        {
                            "field": "status",
                            "operator": "less_than",
                            "value": "closed"
                        },
                        {
                            "field": "assignee_id",
                            "operator": "is",
                            "value": user_id
                        }]
                    }
                }
            })
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
                        "all": [{
                            "field": "status",
                            "operator": "is",
                            "value": "open"
                        },
                        {
                            "field": "assignee_id",
                            "operator": "is",
                            "value": user_id
                        }]
                    }
                }
            })
        };
    },


};

//container for private (local) objects and methods
var util = {

    applyTag: function(agent, ticketView) {
        return util.appFramework.promise(function(done, fail) {
            util.getView('rows', [ticketView, agent.id]).done(function(tickets){
                if(tickets[0] === undefined) {
                    util.appFramework.trigger('tickets_tagged', {count: 0, name: agent.name, ticketView: ticketView});                     
                    done();
                } else {

                    var ticketIDs = [];
                    _.each(tickets, function(ticket) {
                        ticketIDs.push(ticket.ticket.id);
                    });
                    var request = 'unTagTicket';
                    if(agent.user_fields.agent_ooo) {
                        request = 'tagTicket';
                    }
                    util.postPage(request, ticketIDs, 0, function() {
                        util.appFramework.trigger('tickets_tagged', {count: ticketIDs.length, name: agent.name, ticketView: ticketView}); 
                        done();
                    });
                }
            }).fail(function() {
                fail();
                util.appFramework.trigger('functional_error', {location: 'applyTag', agent: agent});
            });
        });
    },

    setStatus: function(agent, unassignTickets) {
        return util.appFramework.promise(function(done,fail) {
            util.appFramework.ajax('setAgentStatus', agent.id, !agent.user_fields.agent_ooo).done(function(agent) {
                agent = agent.user;
                var status = 'here';
                if(agent.user_fields.agent_ooo) {
                    status = 'away';
                }
                if(unassignTickets && agent.user_fields.agent_ooo) {
                    util.applyTag(agent, 'ticketPreview');
                }
                done(agent);
            }).fail(function(error) {
                util.appFramework.trigger('functional_error', {location: 'setStatus', agent: agent, status: !agent.user_fields.agent_ooo, errorCode: error.status});
                util.appFramework.trigger('network_error', {request: 'setAgentStatus', requestType: 'ajax', agent: agent, error: error});
            });

        });
    }

};

module.exports = {

    factory: function(context, settings) {
        _.extend(context.requests, requests); //add in needed requests for the module     
        _.extend(util, context.require('get_all')); //add in getAll methods to util        
        util.appFramework = context;
        util.settings = settings;
        return {
            toggleStatus: this.toggleStatus,
        };
    },

    toggleStatus: function(user_id, unassignTickets) {
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.ajax('getSingleAgent', user_id).done(function(agent) {
                agent = agent.user;
                util.setStatus(agent, unassignTickets).done(function(agent) { 
                    if(util.settings.createTrigger) {
                        util.applyTag(agent, 'pendingTickets').fail(function() {
                            util.appFramework.trigger('functional_error', {location: 'setStatusPending', agent: agent, status: !agent.user_fields.agent_ooo});
                        });
                    }
                    util.appFramework.trigger('status_changed', {agent: agent});   
                    done();
                });
            });
        });
    },
};
