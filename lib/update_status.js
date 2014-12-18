var requests = {

    getSingleAgent: function(user_id) {
        return {
            url: helpers.fmt('/api/v2/users/%@.json', user_id)
        };
    },

    setAgentStatus: function(user_id, away_status) {
        var data = {user: {user_fields:{}}};                                //generate an object (using this method to allow a dynamic user field key)
        data.user.user_fields[this.options.userFieldKey] = away_status;     //assign the current status and push to server
        data = JSON.stringify(data);
        return {
            url: helpers.fmt('/api/v2/users/%@.json', user_id),
            dataType: 'JSON',
            type: 'PUT',
            contentType: 'application/json',
            data: data
        };
    },

    tagTicket: function(ticketID) { //TODO: Combine w/ unTagTicket for code reuse
        return {
            type: 'PUT',
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

    pendingTickets: function(user_id, page) { //this generates a view preview for pending tickets assigned to a user
        user_id = encodeURIComponent(user_id); //TODO: generalize this and merge w/ ticketPreview to add some more flexibility
        return {                               //possibly pass in a conditions object? 
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
            url: helpers.fmt('/api/v2/views/preview.json?page=%@', page), //paginated so that we can go through all entries
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
                        request = (isOut) ? 'tagTicket'                     //depending on agent status, either tag or untag ticket
                                          : 'unTagTicket',          
                        ticketIDs = [].map.call(tickets, function(ticket) {
                            return ticket.ticket.id;                    //create an array of ticket IDs
                        });

                    util.postPage(request, ticketIDs, 0, function() {  //run the request on the entire batch of tickets TODO: fix this (no clue how it is even working now re: postPage vs batchPost)
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

    setStatus: function(agent, unassignTickets) { //toggles status (will set status to reverse of what agent is passed)
        return util.appFramework.promise(function(done,fail) {
            util.appFramework.ajax('setAgentStatus', agent.id, !agent.user_fields[util.settings.userFieldKey]).done(function(agent) {
                agent = agent.user;
                var status = 'here';
                if(agent.user_fields[util.settings.userFieldKey]) {
                    status = 'away';
                }
                if(unassignTickets || !agent.user_fields[util.settings.userFieldKey]) {
                    util.applyTag(agent, 'ticketPreview'); //if unassignTickets or if agent is coming back availaible, tag all tickets instead of just pending
                } else {
                    util.applyTag(agent, 'pendingTickets'); //otherwise, only tag pending tickets
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
            util.appFramework.ajax('getSingleAgent', user_id).done(function(agent) { //get agent
                agent = agent.user;
                util.setStatus(agent, unassignTickets).done(function(agent) { 
                    util.appFramework.trigger('status_changed', {agent: agent});   
                    done();
                });
            });
        });
    },
};
