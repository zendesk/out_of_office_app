//container for private (local) objects and methods
var util = {

    tagPending: function(agent) {
        return util.appFramework.promise(function(done, fail) {
            util.getView('rows', ['pendingTickets', agent.id]).done(function(tickets){
                if(tickets[0] === undefined) {
                    util.appFramework.trigger('tickets_tagged', {count: ticketIDs.length, name: agent.name});                     
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
