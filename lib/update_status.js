var requests = {

    getSingleAgent: function(user_id) {
        return {
            url: helpers.fmt('/api/v2/users/%@.json', user_id)
        };
    },

    setAgentStatus: function(user_id, away_status) {
        var data = {user: {user_fields:{}}};
        data.user.user_fields[this.options.userFieldKey] = away_status;
        data = JSON.stringify(data);
        return {
            url: helpers.fmt('/api/v2/users/%@.json', user_id),
            dataType: 'JSON',
            type: 'PUT',
            contentType: 'application/json',
            data: data
        };
    },

    tagTicket: function(ticketID) {
        return {
            type: 'POST',
            url: helpers.fmt('/api/v2/tickets/%@/tags.json', ticketID),
            contentType: 'application/json',
            data: JSON.stringify({
                "tags": [this.options.userFieldKey]
            })
        };
    },

    unTagTicket: function(ticketID) {
        return {
            type: 'DELETE',
            url: helpers.fmt('/api/v2/tickets/%@/tags.json', ticketID),
            contentType: 'application/json',
            data: JSON.stringify({
                "tags": [this.options.userFieldKey]
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

                    var isOut = agent.user_fields[util.settings.userFieldKey],
                        request = (isOut) ? 'tagTicket'
                                          : 'unTagTicket',
                        ticketIDs = [].map(tickets, function(ticket) {
                            return ticket.ticket.id;
                        });

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
            util.appFramework.ajax('setAgentStatus', agent.id, !agent.user_fields[util.settings.userFieldKey]).done(function(agent) {
                agent = agent.user;
                var isOut = agent.user_fields[util.settings.userFieldKey],
                    status = (isOut) ? 'away'
                                     : 'here';
                if(unassignTickets && isOut) {
                    util.applyTag(agent, 'ticketPreview');
                }
                done(agent);
            }).fail(function(error) {
                util.appFramework.trigger('functional_error', {location: 'setStatus', agent: agent, status: !agent.user_fields[util.settings.userFieldKey], errorCode: error.status});
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
                var isOut = agent.user_fields[util.settings.userFieldKey];
                util.setStatus(agent, unassignTickets).done(function(agent) { 
                    if(util.settings.createTrigger) {
                        util.applyTag(agent, 'pendingTickets').fail(function() {
                            util.appFramework.trigger('functional_error', {location: 'setStatusPending', agent: agent, status: isOut});
                        });
                    }
                    util.appFramework.trigger('status_changed', {agent: agent});   
                    done();
                });
            });
        });
    },
};
