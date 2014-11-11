//container for private (local) objects and methods
var util = {

    stripNumber: function(url) {
        if(url.indexOf("=") != -1) {
            return url.substring(url.lastIndexOf("=")+1);
        } else {
            return undefined;
        }
    },

    getRows: function(member, request, fn, data) {
        if(data === undefined) { //if no data was passed, create an empty array
            data = [];
        }
        if(request[2] === undefined) { //very hacky, needs to be rewritten to be more generic
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

    getView: function(member, request) {                            //promise wrapper for geting views
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
                fn(data);
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
                    util.postPage(request, ticketIDs, 0, done);
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

};

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
                    if(util.settings.createTrigger) {
                        util.tagPending(agent).done(function(ticketIDs) {
                            util.appFramework.trigger('tickets_tagged', {count: ticketIDs.length, name: agent.name});                    
                        });
                    }
                    util.appFramework.trigger('status_changed', {agent: agent});                    
                    done(status);
                });
            });
        });
    },
};
