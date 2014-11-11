var requests = {

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
    },
};




//container for private (local) objects and methods
var util = {

    stripNumber: function(url) {
        if(url.indexOf("=") != -1) {
            return url.substring(url.lastIndexOf("=")+1);
        } else {
            return undefined;
        }
    },

    splitArray: function(array, chunk) {
        var result = [];
        for (var i = 0; i < array.length; i += chunk) {
            result.push(array.slice(i,i+chunk));
        }
        return result;
    },

    getView: function(member, request) {
        return util.appFramework.promise(function(done, fail) {
            util.getRows(member, request, done);   
        });
    },

    batchPost: function(request, data) {
        return util.appFramework.promise(function(done, fail) {
            var split = util.splitArray(data, 100);
            util.postPage(request, split, 0, done);
        });
    },

    getRows: function(member, request, fn, data) {
        console.log(util.appFramework.requests)
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

    postPage: function(request, data, index, fn) { 
        util.appFramework.ajax(request, data[index]).done(function() {
            console.log(index);                
            index++;
            if(index == data.length) {
                fn();
            } else {
                util.postPage(request, data, index, fn);                
            }
        });
    },


    tagPending: function(agent) {
        return util.appFramework.promise(function(done, fail) {
            util.getView('rows', ['pendingTickets', agent.id]).done(function(tickets){
                if(tickets[0] === undefined) {
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
                        util.appFramework.trigger('tickets_tagged', {count: ticketIDs.length, name: agent.name}); 
                        done();
                    });
                }
            });
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

    setStatus: function(agent, unassignTickets) {
        return util.appFramework.promise(function(done,fail) {
            util.appFramework.ajax('setAgentStatus', agent.id, !agent.user_fields.agent_ooo).done(function(agent) {
                agent = agent.user;
                var status = 'here';
                if(agent.user_fields.agent_ooo) {
                    status = 'away';
                }
                if(unassignTickets) {
                    util.unassignAll(agent);
                }
                if(util.settings.createTrigger) {
                    util.tagPending(agent)
                }
                util.appFramework.trigger('status_changed', {agent: agent});                    
                done(status);
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

        util.appFramework = context;
        util.settings = settings;
        return this.toggleStatus;
    },

    toggleStatus: function(user_id, unassignTickets) {
        return util.appFramework.promise(function(done, fail) {
            util.appFramework.ajax('getSingleAgent', user_id).done(function(agent) {
                agent = agent.user;
                util.setStatus(agent, unassignTickets).done(function() { done();});
            });
        });
    },
};
