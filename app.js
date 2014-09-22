(function() {

  return {

    defaultState: 'loading',
    triggerTitle: 'out-of-office app trigger',
    userFieldName: 'Agent Out?',
    userFieldKey: 'agent_ooo',

    events: require('events'), //magic happens here

    requests: require('requests'),

    init: function(app) {
        if(app.firstLoad) {
            this.install();
        };
        if (this.currentLocation() == 'nav_bar') {
            this.ui().renderNavBar(); //side effect
        } else if (this.currentLocation() == 'user_sidebar') {
            this.ui().renderUser(); //side effect
        } else if (this.currentLocation() == 'ticket_sidebar' || this.currentLocation() == 'new_ticket_sidebar') {
            this.ui().renderTicket();
        }
    },

    ui: function() {
        return this.require('ui');
    },

    install: function() {
        var installApp = this.require('install_app');
        this.require('fetch_data').checkInstalled().fail(installApp);
    },

    changeStatusMessage: function(user) {
        return { 
            available: {
                header:  'Please confirm status change',
                content: '<p>This action will mark ' + user.name + ' as available and allow tickets to be assigned.</p>',
                confirm: '<p style="color: white; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Available</p>',        
                cancel:  'Cancel'
            },
            unavailable: {
                header:  'Please confirm status change',
                content: '<p>This action will reassign ' + user.name + '&#39;s open tickets and change their status to away.</p>',
                confirm: '<p style="color: white; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Unavailable</p>',
                cancel:  'Cancel',
                options: '<input type="checkbox" name="reassign_current" /> Unassign All Open Tickets?'
            },
        };

    },

    saveHookMessage: function(user) {
        return {
            header:  'Assignee is Unavailable',
            content: '<p>The assignee you have selected: ' + user.name + ' is currently marked as unavailable and cannot have tickets assigned to them.',
            confirm: '<a href="#/users/' + user.id + '">Go to Agent Profile</a>',
            cancel:  '<p style="color: white; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Cancel</p>', 
        };
    },

}());
