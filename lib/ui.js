var util = {
    version: '.03',

    users: [],

    renderFilter: function(filter) {
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
                    return user.user_fields.agent_ooo;
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
        util.appFramework = context;
        util.settings = settings;
        util.getAll = context.require('get_all');
        util.modal = context.require('popmodal');
        return {
            renderStatusModal: this.renderStatusModal,
            renderUser: this.renderUser,
            renderTicket: this.renderTicket,
            renderNavBar: this.renderNavBar,
            toggleSort: this.toggleSort,
            filterAgents: this.filterAgents,
        };
    },

    filterAgents: function(e) {
        var entry = e.currentTarget.value;
        if (entry.length) {
            util.renderFilter(entry.toLowerCase());
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
            agent = agent.user;
            var message = util.settings.changeStatusMessage(agent.name).unavailable;
            if(agent.user_fields.agent_ooo) {
                message = util.settings.changeStatusMessage(agent.name).available;
            }
            util.modal(message, function(input) { // function(input) {onAccept} - input is array of elements in options - taking zeroth element and checking if checked whicih = unassign tickets
                // don't need to use a promise because NOT waiting for something to finish before doing it
                var unassignTickets = util.settings.unassignTickets;
                if(input.length === 1) {
                    if(input[0].checked === true) {
                        unassignTickets = true;
                    }
                }                        

                util.appFramework.trigger("toggle_status", {agentID: agentID, unassignTickets: unassignTickets});

            });
        });
    },

    renderNavBar: function() {
        var currentUser = util.appFramework.currentUser();
        var hasPermission = false;

        if (currentUser.role() == 'admin'){
            hasPermission = true;
        }
        util.getAll('users', ['getAllAgents', 1]).done(function(data) {
            util.users = data;
            console.log("NavBar Render: " + util.appFramework.currentLocation());

            var loc = util.appFramework.currentLocation();
            if(loc == 'nav_bar') {

                util.appFramework.switchTo('navbar', {
                    userlist: data,
                    permission: hasPermission
                }); 

            } else {
                console.log('Re-Render Navbar');
                util.appFramework.trigger("render_app");
            }
            util.appFramework.$('#filter_search').focus();
        });

    },


    renderUser: function() {
        var currentUser = util.appFramework.currentUser();
        var viewedUser = util.appFramework.user();
        
        if (viewedUser.role() != 'end-user') {
            var hasPermission = false;
            if (currentUser.role() == 'admin' || currentUser.id() == viewedUser.id()) {
                hasPermission = true;
            }
            util.appFramework.ajax('getSingleAgent', viewedUser.id()).done(
                function(user) {
                console.log("User Render: " + util.appFramework.currentLocation());

                var loc = util.appFramework.currentLocation();
              //  if (loc == 'user_sidebar') {
                    util.appFramework.switchTo('user', {
                        user: user.user,
                        permission: hasPermission
                    });
                if (loc != 'user_sidebar') {
                    console.log('Re-Render USER');
                    util.appFramework.trigger("render_app");
                }
            });
        } else {
            var loc = util.appFramework.currentLocation();
            if (loc == 'user_sidebar') {

                util.appFramework.switchTo('user', {
                    user: null
                });
            }  else {
                console.log('Re-Render User');
                util.appFramework.trigger("render_app");

            }

        }
    },

    renderTicket: function() {
        console.log('launched ticket');
        var asignee = util.appFramework.ticket().assignee().user();
        var currentUser = util.appFramework.currentUser();

        if(asignee !== undefined) {
            var hasPermission = false;

            if (currentUser.role() == 'admin' || currentUser.id() == asignee.id()) {
                hasPermission = true;
            }

            util.appFramework.ajax('getSingleAgent', asignee.id())
            .done(function(data){
                console.log("Ticket Render: " + util.appFramework.currentLocation());
                var loc = util.appFramework.currentLocation();
                if (loc == 'ticket_sidebar' || loc == 'new_ticket_sidebar') {


                    util.appFramework.switchTo('ticket', {
                        assignee: data.user,
                        permission: hasPermission

                    });
                } else {
                    console.log('Re-Render Ticket');

                    util.appFramework.trigger("render_app");

                }

            });
        } else {
            var loc = util.appFramework.currentLocation();
            if (loc == 'ticket_sidebar' || loc == 'new_ticket_sidebar') {
                util.appFramework.switchTo('ticket');
            }  else {
                console.log('Re-Render Ticket');

                util.appFramework.trigger("render_app");

            }

        }
    },
};