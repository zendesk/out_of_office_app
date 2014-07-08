(function() {

  return {

    defaultState: 'loading',

    events: {

      // App
      'app.activated':'init',
      'pane.activated':'renderNavBar',
      'pane.deactivated':'renderUser',

      // UI
      'click .modalAccept': 'onModalAccept',
      'click .modalCancel': 'onModalCancel',
      'click .set-status': 'toggleStatus',
      'keyup #filter': 'filterAgents',
      'ticket.save': 'warnOnSave'

    },

    requests: {

      // Requests
      'getAllAgents':function() {
        //fetches all agent user objects
              return {
              };
            },
      'getCurrentAgent':function() {
        //fetches single user object
              return {
              };
            },
      'setAgentStatus':function() {
        //sets agent checkbox status
              return {
              };
            },

    },

    init: function() {
      //ready variables and switch to user template
    },

    renderNavBar: function() {
      //Fetch all agents then render the navbar template
    },

    renderUser: function() {
      //Fetch current user (if they exist) then switch to the user template
    },

    popModal: function(messageContext, confirmMessage, cancelMessage) {
      //generates the confirmation modal conditionally, accepting message content (can include input controls as well as the confirmation and cancel button labels (cancel is optional)
    },

    onModalAccept: function() {
      //change agent status
    },

    onModalCancel: function() {
      //abort changes and reset
    },

    toggleStatus: function() {
    //conditionally change agent status to whatever it isn't set to currently
    },

    filterAgents: function() {
      //filter the list of agents in the navbar location when search terms are added
    },

    warnOnSave: function() {
      //if agent is set to away and submits a ticket update, warn them to set their status to available
    },

  };

}());
