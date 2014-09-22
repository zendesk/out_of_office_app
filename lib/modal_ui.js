module.exports = {
    
    /*
     * Checks current status, prepares modal for changing to opposite.
     *
     * parameters: the click event of the status toggle
     * Side Effects: creates modal to confirm changes in agent status
     *
     */
    confirmAgentStatus: function(e) {
      e.preventDefault();
      var user_id = e.currentTarget.value;
      this.ajax('getSingleAgent', user_id)
        .done(function(data) {
          var user = data.user;
          var agent_away = user.user_fields.agent_ooo;
          if (agent_away === false) {
            this.popModal("Please confirm status change",
              "<p>This action will reassign " + user.name +
              "'s open tickets and change their status to away.</p>",
              "<p style=\"color: white; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px\">Mark as Unavailable</p>", "Cancel", user_id, '<input type="checkbox" name="reassign_current" /> Unassign All Open Tickets?'); //side effect
          } else if (agent_away === true) {
            this.popModal("Please confirm status change",
              "<p>This action will mark " + user.name +
              " as available and allow tickets to be assigned.</p>",
              "<p style=\"color: white; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px\">Mark as Available</p>", "Cancel", user_id, ''); //side effect
          }
          this.$('.modalAccept').off('click');
          this.$('.modalAccept').on('click', _.bind(function() {
            this.toggleStatus(user.id);
            if(this.$('.option input').is(':checked')){
              this.unassignAll(user.id);
            }
            this.$('.mymodal').modal('hide');
            this.$('.modalAccept').off('click');
            this.$('.modalAccept').on('click', _.bind(this.onModalAccept, this)); //rebind to the default
          }, this));
        });

    },

    /*
     * If agent is set to away and submits a ticket update, warn them to set their status to available
     *
     * return: a promise that checks if the assignee is out of office, and prevents saving with a modal
     * Side Effects: Creates a modal popup if the agent has a ticket assigned to them while away
     *
     */
    warnOnSave: function() {
      var ticket1 = this.ticket(); // janky but possibly a fix for Jeremiah's issue.
      var assignee1 = ticket1.assignee().user();
      if(typeof(assignee1) !== "undefined") {
      return this.promise(function(done, fail) {
        var ticket = this.ticket();
        var assignee = ticket.assignee().user();
        this.ajax('getSingleAgent', assignee.id()).then(
          function(data) {
            if (data.user.user_fields.agent_ooo === true) { //  added to check for true value rather than existance of field.

              this.popModal("Assignee is Unavailable",
                "<p>The assignee you have selected: " + data.user.name +
                " is currently marked as unavailable and cannot have tickets assigned to them.",
                "<p style=\"color: white; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px\">Cancel</p>", "<a href='#/users/" + data.user.id + "'>Go to Agent Profile</a>", null, ''); //side effect

              this.$('.modalAccept').off('click');
              this.$('.modalAccept').on('click', _.bind(function() {
                this.$('.mymodal').modal('hide');
                this.$('.modalAccept').off('click');
                this.$('.modalAccept').on('click', _.bind(this.onModalAccept, this)); //rebind to the default
                fail();
              }, this));

              this.$('.modalCancel').off('click');
              this.$('.modalCancel').on('click', _.bind(function() {
                this.$('.mymodal').modal('hide');
                this.$('.modalCancel').off('click');
                this.$('.modalCancel').on('click', _.bind(this.onModalCancel, this)); //rebind to the default
                fail();
              }, this));

            } else {
              done();
            }
          }, function() {
            done();
          }
        );
      });
    } else {
      return true;
    }
    },

     
    /*
     * Changes the agent status on an accepted modal
     *
     * parameters: the click event for the modal accept button
     * Side Effects: hides the modal popup, triggers an agent status update
     *
     */
    onModalAccept: function(e) {
      this.$('.mymodal').modal('hide'); //side effect
    },

    /*
    * Abort changes and reset
    *
    * parameters: the click event for the modal cancel button
    *
    */
    onModalCancel: function(e) {
      this.$('.mymodal').modal('hide'); //side effect
    },

    factory: function(context) {
        console.log('modal_ui');
        return {
            popModal: context.require('popmodal'),
            confirmAgentStatus: _.bind(this.confirmAgentStatus, context),
            warnOnSave: _.bind(this.warnOnSave, context),
            onModalAccept: _.bind(this.onModalAccept, context),
            onModalCancel: _.bind(this.onModalCancel, context), 
        }
    }
};
