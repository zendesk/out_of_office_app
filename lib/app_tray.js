module.exports = {
    
    /*
     * Fetch current user (if they exist) then switch to the user template
     *
     * Side Effects: Switches to the user template, setting the user variable if the user is an admin
     *
     */
    renderUser: function() {
      this.switchTo('loading');
      if (this.currentLocation() == 'user_sidebar') {
        var currentUser = this.currentUser();
        var role = currentUser.role();
        if (role == 'admin' || role == 'agent') {
          this.ajax('getSingleAgent', this.user().id())
            .done(function(data) {
              var sidebarUser = data.user;
              var hasPermission = false;
              if (role == 'admin' || currentUser.id() == sidebarUser.id) {
                hasPermission = true;
              }
              this.switchTo('user', {
                user: sidebarUser,
                permission: hasPermission
              });
            });
        } else {
          this.switchTo('user', {
            user: null
          });
        }
      } else {
        this.switchTo('user', {
          user: null
        });
      }
    },

    renderTicket: function() {
      if(this.ticket().assignee().user() !== undefined) {
        var assignee_id = this.ticket().assignee().user().id();
        this.ajax('getSingleAgent', assignee_id)
        .done(function(data){
          this.switchTo('ticket', {
            assignee: data.user
          });
        })
        .fail(function(){
          this.notifyFail();
        });
      }
      else {
        this.switchTo('ticket', {
          none: 'none'
        });
      }
    },


    factory: function(context) {
        console.log('app_tray');        
        return {
            renderUser: _.bind(this.renderUser, context),
            renderTicket: _.bind(this.renderTicket, context),            
        }
    }
};
