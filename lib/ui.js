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

    renderFilter: function(filter) {
        filter = filter.toLowerCase();
        var currentUser = util.appFramework.currentUser();
        var currentSort = util.appFramework.$('#agent_list thead .current');
        var hasPermission = false;
        if (currentUser.role() == 'admin'){
            hasPermission = true;
        }
        var users = _.filter(util.users, function(user) {
            return (user.name.toLowerCase().indexOf(filter) > -1 || user.email.toLowerCase().indexOf(
                filter) > -1);
        });
        if (currentSort.length > 0){
            var sortValue = util.appFramework.$(currentSort).find('span').text();
            var sortOrder = util.appFramework.$(currentSort).prop('className').split(' ')[2];
            var sortedUsers = _.sortBy(users, function(user){
                if (sortValue == 'Name'){
                    return user.name.toLowerCase().split(' ')[0];
                }
                else if (sortValue == 'Email') {
                    return user.email.toLowerCase();
                }
                else if (sortValue == 'Status') {
                    return user.user_fields[util.settings.userFieldKey];
                }
            });
            if (sortOrder == 'desc') sortedUsers = sortedUsers.reverse();
            users = sortedUsers;
        }
        var table_filtered = util.appFramework.renderTemplate('filter', {
            userlist: users,
            permission: hasPermission,
        });
        util.appFramework.$('#agent_list tbody').replaceWith(table_filtered); //side effect
    },

};

module.exports = {

    factory: function(context, settings) {
        _.extend(context.requests, requests); //add in needed requests for the module     
        _.extend(util, context.require('get_all')); //add in getAll methods to util        
        util.appFramework = context;
        util.settings = settings;

        util.modal = context.require('popmodal');
        return {
            renderStatusModal: this.renderStatusModal,
            renderUser: this.renderUser,
            renderTicket: this.renderTicket,
            renderNavBar: this.renderNavBar,
            toggleSort: this.toggleSort,
            filterAgents: this.filterAgents,
            renderFilter: util.renderFilter,
            renderSave: this.renderSave,
        };
    },

    filterAgents: function(e) {
        var entry = e.currentTarget.value;
        if (entry.length) {
            util.renderFilter(entry);
        } else {
            this.renderNavBar();
        }
    },

    toggleSort: function(e) {
        e.preventDefault();
        var entry = e.currentTarget.value;
        var target_header = e.currentTarget;
        var target_class = util.appFramework.$(target_header).prop('className').split(' ');
        if(target_class.length === 1 && target_class[0] == 'srt_header') {
            var header_array = util.appFramework.$('#agent_list thead tr th.srt_header'); // all headers
            _.each(header_array, function(head){  //  :Make each header class blank then add orig
                util.appFramework.$(head).toggleClass().addClass('srt_header');

            });
            util.appFramework.$(target_header).addClass('current asc'); //then make our current class the correct sort
        }
        else{
            util.appFramework.$(target_header).toggleClass("asc desc");
        }
        entry = util.appFramework.$('#filter_search').prop('value');
        if (entry.length > 0) {
            util.renderFilter(entry.toLowerCase());
        }
        else {
            util.renderFilter('');
        }
    },

    renderStatusModal: function(agentID) { // review this
        util.appFramework.ajax('getSingleAgent', agentID).done(function(agent) {

            var availableHeader             =   this.I18n.t('changeStatusMessage.available.header'),
                availableContentFirst       =   this.I18n.t('changeStatusMessage.available.content.first'),
                availableContentSecond      =   this.I18n.t('changeStatusMessage.available.content.second'),
                availableConfirm            =   this.I18n.t('changeStatusMessage.available.confirm'),
                availableCancel             =   this.I18n.t('changeStatusMessage.available.cancel'),
                unavailableHeader           =   this.I18n.t('changeStatusMessage.unavailable.header'),
                unavailableContentFirst     =   this.I18n.t('changeStatusMessage.unavailable.content.first'),
                unavailableContentSecond    =   this.I18n.t('changeStatusMessage.unavailable.content.second'),
                unavailableConfirm          =   this.I18n.t('changeStatusMessage.unavailable.confirm'),
                unavailableCancel           =   this.I18n.t('changeStatusMessage.unavailable.cancel'),
                checkboxText                    =   this.I18n.t('changeStatusMessage.checkbox');

            agent = agent.user;

            var unassignTickets = util.settings.unassignTickets,
                message = util.settings.changeStatusMessage(agent.name, unassignTickets, availableHeader, availableContentFirst, availableContentSecond, availableConfirm, availableCancel, unavailableHeader, unavailableContentFirst, unavailableContentSecond, unavailableConfirm, unavailableCancel, checkboxText).unavailable;
                
            if(agent.user_fields[util.settings.userFieldKey]) {
                message = util.settings.changeStatusMessage(agent.name, unassignTickets, availableHeader, availableContentFirst, availableContentSecond, availableConfirm, availableCancel, unavailableHeader, unavailableContentFirst, unavailableContentSecond, unavailableConfirm, unavailableCancel, checkboxText).available;
            }
            util.modal(message, function(input) { // function(input) {onAccept} - input is array of elements in options - taking zeroth element and checking if checked whicih = unassign tickets
                // don't need to use a promise because NOT waiting for something to finish before doing it
                var unassignTickets = util.settings.unassignTickets;
                if(input.length === 1) {
                    if(input[0].checked === true) {
                        unassignTickets = true; // remove the options item from the unavailable section of the change status message
                    }
                }                        
                util.appFramework.trigger("toggle_status", {agentID: agentID, unassignTickets: unassignTickets});
            });
        }).fail(function(error) {
            util.appFramework.trigger('functional_error', {location: 'renderStatusModal', agentID: agentID});
            util.appFramework.trigger('network_error', {request: 'getSingleAgent', requestType: 'ajax', agentID: agentID, error: error});
        });
    },

    renderNavBar: function(filter) {
        var currentUser = util.appFramework.currentUser();
        var hasPermission = false;
        var app = util.appFramework; //util.appFramework gets overwritten if multiple render functions are called at the same time, keep a local copy

        if (currentUser.role() == 'admin'){
            hasPermission = true;
        }
        util.getAll('users', ['getAllAgents', 1]).done(function(data) {
            util.users = data;

            app.switchTo('navbar', {
                userlist: data,
                permission: hasPermission
            }); 
            if(filter !== undefined) {
                app.$('#filter_search').val(filter);
                util.renderFilter(filter);
            }

            app.$('#filter_search').focus();
        }).fail(function() {
            util.appFramework.trigger('functional_error', {location: 'renderNavBar', filter: filter});
        });

    },

    renderUser: function() {
        var currentUser = util.appFramework.currentUser();
        var viewedUser = util.appFramework.user();
        var app = util.appFramework;  //util.appFramework gets overwritten if multiple render functions are called at the same time, keep a local copy

        if (viewedUser.role() != 'end-user') {
            var hasPermission = false;
            if (currentUser.role() == 'admin' || currentUser.id() == viewedUser.id()) {
                hasPermission = true;
            }
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
            var hasPermission = false;
            if (currentUser.role() == 'admin' || currentUser.id() == assignee.id()) {
                hasPermission = true;
            }
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
        var options = util.settings;
        var assignee = app.ticket().assignee().user().id();
        var currentUser = app.currentUser().id();
        var group = app.ticket().assignee().group();
        var ticket = app.ticket().id();
        var saveFail = function(error, request, mainPromise) {
            util.appFramework.trigger('functional_error', {location: 'renderSave', ticket: ticket, mainPromise: mainPromise, request: request});
            util.appFramework.trigger('network_error', {request: request, requestType: 'ajax', ticket: ticket, error: error});
        };

        if (assignee === undefined ||                   //allow unassigned tickets to be edited
            assignee == currentUser ||  //let a user modify their own tickets 
            !util.settings.preventAssignOOO) {     //allow tickets to be updaded if preventAssignOOO is false

            app.ajax('getSingleAgent', assignee).done(function(agent) {
                agent = agent.user; //unpack agent
                if(agent.user_fields[options.userFieldKey]) {
                    app.trigger('update_warning', {agent: agent});
                }
            }).fail(function(error) {saveFail(error, 'getSingleAgent', false);});
            return true;
        } else {
            return app.promise(function(done, fail) { 
                app.ajax('getSingleAgent', assignee).done(function(agent) { 
                    agent = agent.user; //unpack agent
                    var failMessage = util.settings.saveFailMessage + util.settings.saveWarning(agent.name);
                    
                    if(!agent.user_fields[options.userFieldKey]) { //if agent isn't ooo, allow it TODO: fix this to be dynamic
                        done();
                    } else {                            //agent is ooo and we should prevent it
                        if (app.currentLocation() === 'new_ticket_sidebar') {  //can't assign a new ticket to an ooo user 
                            fail(failMessage);
                        } else {
                            app.ajax('getSingleTicket', ticket).done(function(ticket) {
                                if(ticket.ticket.assignee_id == assignee) {            //check if ticket is still assigned to the same person
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
    },
};
