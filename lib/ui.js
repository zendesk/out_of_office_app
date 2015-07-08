var requests = {
    
    getAllAgents: function(page) {
        return {
            url: helpers.fmt('/api/v2/users.json?role[]=agent&role[]=admin&page=%@', page)
        };
    },

    getSingleAgent: function(user_id) {
        return {
            url: helpers.fmt('/api/v2/users/%@.json', user_id)
        };
    },

    getSingleTicket: function(ticket_id) {
        return {
            url: helpers.fmt('/api/v2/tickets/%@.json', ticket_id)
        };
    }
};

var util = {

    version: '2.0',
    users: [],

    renderFilter: function(app) {
        app = app || util.appFramework;

        var searchBox = app.$('#filter_search'),
            currentSort = app.$('#agent_list thead .current'),
            sortHeader = 'name_head',
            sortOrder = 'asc',
            users = util.sortUsers(util.users, sortHeader, sortOrder),
            currentUser = app.currentUser(),
            hasPermission = (currentUser.role() == 'admin') ? true 
                                                            : false; 
        if(searchBox.length === 0) {
            app.switchTo('navbar', {
                userlist: users,
                permission: hasPermission
            }); 
        }

        var filter = searchBox.val() || '';
        filter = filter.toLowerCase(); //make the search case-insensitive 

        users = util.sortUsers(_.filter(util.users, function(user) {
            return (user.name.toLowerCase().indexOf(filter) > -1 || user.email.toLowerCase().indexOf(filter) > -1);
        }), sortHeader, sortOrder);  //filter the users based on the current filter, then sort

        if (currentSort.length > 0){
            sortHeader = app.$(currentSort).attr('id');
            sortOrder = app.$(currentSort).prop('className').split(' ')[2];
            users = util.sortUsers(users, sortHeader, sortOrder);
        }
        app.switchTo('navbar', {
            userlist: users,
            permission: hasPermission
        }); 
        util.applySort(sortHeader, sortOrder);
        app.$('#filter_search').focus();
        app.$('#filter_search').val(filter);
    },

    sortUsers: function(users, sortHeader, sortOrder) {
        users = _.sortBy(users, function(user){
            switch(sortHeader){
                case 'name_head': return user.name.toLowerCase().split(' ')[0];
                case 'email_head': return user.email.toLowerCase();
                case 'status_head': return user.user_fields[util.settings.userFieldKey];
            }
        });
        return (sortOrder != 'desc') ? users
                                     : users.reverse();
    },

    applySort: function(sortHeader, sortOrder) {
        var header_array = util.appFramework.$('#agent_list thead tr th.srt_header'); // all headers
        _.each(header_array, function(head){  //  :Make each header class blank then add orig
            var element = util.appFramework.$(head);
            element.toggleClass().addClass('srt_header');
            if(element.attr('id') == sortHeader) {
                element.addClass('current');
                element.addClass(sortOrder);
            }
        });
    },
};

module.exports = {

    factory: function(context, settings) {
        _.extend(context.requests, requests); //add in needed requests for the module     
        _.extend(util, context.require('utils/get_all')); //add in getAll methods to util        
        util.appFramework = context;
        util.settings = settings;
        util.modal = context.require('popmodal');

        return {
            renderStatusModal: this.renderStatusModal,
            renderUser: this.renderUser,
            renderTicket: this.renderTicket,
            renderNavBar: this.renderNavBar,
            toggleSort: this.toggleSort,
            renderFilter: util.renderFilter,  //TODO: Refactor until this is not needed (write shim method?)
            renderSave: this.renderSave,
        };
    },

    toggleSort: function(target) {
        var app = util.appFramework,
            sortHeader = app.$(target).attr('id'),
            sortOrder = (app.$(target).hasClass('asc')) ? 'desc'
                                                        : 'asc';
        util.applySort(sortHeader, sortOrder);
        util.renderFilter();
    },

    renderStatusModal: function(agentID) { // review this
        var app = util.appFramework;

        util.appFramework.ajax('getSingleAgent', agentID).done(function(agent) {
            agent = agent.user;

            var unassignTickets = util.settings.unassignTickets,
                isOut = agent.user_fields[util.settings.userFieldKey],
                message = app.changeStatusMessage(agent.name, unassignTickets);

            message = (isOut) ? message.available
                              : message.unavailable;

            util.modal(message, function(input) { // function(input) {onAccept} - input is array of elements in options - taking zeroth element and checking if checked whicih = unassign tickets
                // don't need to use a promise because NOT waiting for something to finish before doing it
                var userRequestedUnassign = (input.length === 1) ? input[0].checked 
                                                                 : false,
                    unassignTickets = (userRequestedUnassign) ? true
                                                              : util.settings.unassignTickets;

                util.appFramework.trigger("toggle_status", {agentID: agentID, unassignTickets: unassignTickets});
            });
        }).fail(function(error) {
            util.appFramework.trigger('functional_error', {location: 'renderStatusModal', agentID: agentID});
            util.appFramework.trigger('network_error', {request: 'getSingleAgent', requestType: 'ajax', agentID: agentID, error: error});
        });
    },

    renderNavBar: function(fresh) {
        var app = util.appFramework; //util.appFramework gets overwritten if multiple render functions are called at the same time, keep a local copy
        util.getAll('users', ['getAllAgents', 1]).done(function(data) {
            util.users = data;
            util.renderFilter(app);
        }).fail(function() {
            app.trigger('functional_error', {location: 'renderNavBar'});
        });
    },

    renderUser: function() {
        var currentUser = util.appFramework.currentUser();
        var viewedUser = util.appFramework.user();
        var app = util.appFramework;  //util.appFramework gets overwritten if multiple render functions are called at the same time, keep a local copy

        if (viewedUser.role() != 'end-user') {
            var hasPermission = (currentUser.role() == 'admin' || currentUser.id() == viewedUser.id()) ? true
                                                                                                       : false;
            app.ajax('getSingleAgent', viewedUser.id())
            .done(function(user) {
                app.switchTo('user', {
                    user: user.user,
                    permission: hasPermission
                });
            }).fail(function(error) {
                util.appFramework.trigger('functional_error', {location: 'renderUser', agentID: viewedUser.id()});
                util.appFramework.trigger('network_error', {request: 'getSingleAgent', requestType: 'ajax', agentID: viewedUser.id(), error: error});
            });
        } else {
            util.appFramework.switchTo('user', {
                user: null
            });
        }
    },

    renderTicket: function() { 
        var assignee = util.appFramework.ticket().assignee().user();
        var currentUser = util.appFramework.currentUser();
        var app = util.appFramework; //util.appFramework gets overwritten if multiple render functions are called at the same time, keep a local copy
        if(assignee !== undefined) {
            var hasPermission = (currentUser.role() == 'admin' || currentUser.id() == assignee.id()) ? true
                                                                                                     : false;
            app.ajax('getSingleAgent', assignee.id())
            .done(function(data){
                app.switchTo('ticket', {
                    assignee: data.user,
                    permission: hasPermission
                });
            }).fail(function(error) {
                util.appFramework.trigger('functional_error', {location: 'renderTicket', agentID: assignee.id()});
                util.appFramework.trigger('network_error', {request: 'getSingleAgent', requestType: 'ajax', agentID: assignee.id(), error: error});
            });
        } else {
            app.switchTo('ticket');
        }
    },

    renderSave: function(data) { 

        var app = util.appFramework;

        if (!(app.currentLocation() === 'new_ticket_sidebar' || app.currentLocation() === 'ticket_sidebar')) {
            return true;
        } else {
            var options = util.settings,
                assignee = app.ticket().assignee().user(),
                currentUser = app.currentUser().id(),
                ticket = app.ticket().id(),
                saveFail = function(error, request, mainPromise) {
                    util.appFramework.trigger('functional_error', {location: 'renderSave', ticket: ticket, mainPromise: mainPromise, request: request});
                    util.appFramework.trigger('network_error', {request: request, requestType: 'ajax', ticket: ticket, error: error});
                };

            if (assignee === undefined) {//allow unassigned tickets to be edited
                return true;
            }  else if(assignee.id() == currentUser ||  //let a user modify their own tickets 
                !util.settings.preventAssignOOO) {     //allow tickets to be updaded if preventAssignOOO is false
                return app.promise(function(done, fail) { //added promise to ensure that notification happens before ticket is closed.
                    app.ajax('getSingleAgent', assignee.id()).done(function(agent) {
                        agent = agent.user; //unpack agent
                        app.trigger('update_warning', {agent: agent});
                        done();
                    }).fail(function(error) {
                        saveFail(error, 'getSingleAgent', false);
                        done();
                    });
                });
            } else {
                return app.promise(function(done, fail) { 
                    app.ajax('getSingleAgent', assignee.id()).done(function(agent) { 
                        agent = agent.user; //unpack agent
                        var failMessage = app.saveFailMessage() + app.saveWarningMessage(agent.name);
                        
                        if(!agent.user_fields[options.userFieldKey]) { //if agent isn't ooo, allow it
                            done();
                        } else {                            //agent is ooo and we should prevent it
                            if (app.currentLocation() === 'new_ticket_sidebar') {  //can't assign a new ticket to an ooo user 
                                fail(failMessage);
                            } else {
                                app.ajax('getSingleTicket', ticket).done(function(ticket) {
                                    if(ticket.ticket.assignee_id == assignee.id()) {            //check if ticket is still assigned to the same person
                                        app.trigger('update_warning', {agent: agent});
                                        done();                                                 //allow it with a warning
                                    } else {
                                        fail(failMessage);                            //otherwise, fail
                                    }
                                }).fail(function(error) {saveFail(error, 'getSingleTicket', true);});
                            }
                        }
                    }).fail(function(error) {saveFail(error, 'getSingleAgent', true);});
                });
            }
        }

    },
};
