(function() {

  return {

    defaultState: 'loading',
    users: [],

    events: {

      // App
      'app.activated': 'init',
      'pane.activated': 'renderNavBar',
      'pane.deactivated': 'renderUser',
      'ticket.assignee.user.id.changed': 'renderTicket',

      // UI
      'click .modalAccept': 'onModalAccept',
      'click .modalCancel': 'onModalCancel',
      'click .set-status': 'toggleStatus',
      'click .status-toggle': 'confirmAgentStatus',
      'keyup #filter_search': 'filterAgents',
      'ticket.save': 'warnOnSave',
      'click .srt_header': 'toggleSort'

    },

    requests: require('requests'),
    
    /*
     * Ready variables and switch to user template
     *
     * Side Effects: will install the app if the required fields are not detected,
     * will render the user sidebar app
     */
    init: function() {
      this.require = require('context_loader')(this);
      this.require('load_modules')();


      this.checkInstalled();
      if (this.currentLocation() == 'user_sidebar') {
        this.renderUser();
      }
      else if (this.currentLocation() == 'ticket_sidebar' || this.currentLocation() ==  'new_ticket_sidebar') {
        this.renderTicket();
      }
    },

    renderNavBar: function() {
      this.require = require('context_loader')(this);
      this.require('load_modules')();
      this.renderNavBar();
    },


    /*
     * Selects which location to rended based on app context
     * then calls the render for either the navbar or user sidebar UI
     *
     * Side Effects: either renders the navbar or renders the user sidebar app UI
     *
     */
    refreshLocation: function() {
      if (this.currentLocation() == 'nav_bar') {
        this.renderNavBar(); //side effect
      } else if (this.currentLocation() == 'user_sidebar') {
        this.renderUser(); //side effect
      } else if (this.currentLocation() == 'ticket_sidebar' || this.currentLocation() == 'new_ticket_sidebar') {
        this.renderTicket();
      }
    },
 

    /*
     * inform user that they must refresh the page
     *
     * Side Effects: Notification
     *
     */
    notifySuccess: function() {
      services.notify(
        'Your updates were successful. A refresh may be required to see these changes in Zendesk.'
      ); //side effect
    },

    /*
     * generic failure notification
     *
     * Side Effects: Notification
     *
     */
    notifyFail: function() {
      services.notify(
        'There was a problem communicating with Zendesks REST API. If a second try does not work, please contact the app developers for support.',
        'error'); //side effect
    },

    /*
     * Invalid assignment message
     *
     * Side Effects: Notification
     *
     */
    notifyInvalid: function() {
      services.notify(
        'This agent is currently out of the office. Please assign to another agent',
        'error'); //side effect
    },
    
    renderUser: function() { this.renderUser();  },
    renderTicket: function() { this.renderTicket(); },

      // UI
    onModalAccept: function(e) { this.onModalAccept(e);  },
    onModalCancel: function(e) { this.onModalCancel(e);  },
    toggleStatus: function(e) { this.toggleStatus(e);  },
    confirmAgentStatus: function(e) { this.confirmAgentStatus(e);  },
    filterAgents: function(e) { this.filterAgents();  },
    warnOnSave: function(e) { this.warnOnSave();  },
    toggleSort: function(e) { this.toggleSort(e);  }
  };

}());
