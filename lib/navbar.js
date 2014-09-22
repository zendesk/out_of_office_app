module.exports = {
    
    /*
     * Checks if a filter has been entered
     * calls the render method
     * TODO: merge with renderFilter and/or refactor to better split functionality
     *
     * parameters: the keyup function object
     * Side Effects: either renders an unfiltered nav bar app UI or updates the UI with a filter
     *
     */
    filterAgents: function(e) {
      var entry = e.currentTarget.value;
      if (entry.length) {
        this.renderFilter(entry.toLowerCase()); //side effect
      } else {
        this.renderNavBar(); //side effect
      }
    },

    /*
     * Fetch all agents then render the navbar template
     *
     * Side Effects: switches to the navbar template, focuses the search box
     *
     */
    renderNavBar: function() {
      this.switchTo('loading'); // Without this line layout.hdbs would appear briefly before rendering the nav bar
      var currentUser = this.currentUser();
      var hasPermission = false;
      if (currentUser.role() == 'admin'){
        hasPermission = true;
      }
      this.fetchAllUsers().done(_.bind(function(data) {
        this.switchTo('navbar', {
          userlist: this.users,
          permission: hasPermission

        }); //side effect
        this.$('#filter_search').focus(); //side effect
      }, this));
    },

    /*
     * Filters the user list by name or email
     * then updates the view with the new list
     *
     * parameters: the string that is filtered for
     * Side Effects: replaces the #agent_list section with the filtered user list
     *
     */
    renderFilter: function(filter) {
      var currentUser = this.currentUser();
      var currentSort = this.$('#agent_list thead .current');
      var hasPermission = false;
      if (currentUser.role() == 'admin'){
        hasPermission = true;
      }
      var users = _.filter(this.users, function(user) {
        return (user.name.toLowerCase().indexOf(filter) > -1 || user.email.toLowerCase().indexOf(
          filter) > -1);
      });
      if (currentSort.length > 0){
        var sortValue = this.$(currentSort).find('span').text();
        var sortOrder = this.$(currentSort).prop('className').split(' ')[2];
        var sortedUsers = _.sortBy(users, function(user){
          if (sortValue == 'Name'){
            return user.name.toLowerCase().split(' ')[0];
          }
          else if (sortValue == 'Email') {
            return user.email.toLowerCase().split('@')[0];
          }
          else if (sortValue == 'Status') {
            return user.user_fields.agent_ooo;
          }

        });
        if (sortOrder == 'desc') sortedUsers = sortedUsers.reverse();
        users = sortedUsers;
      }

      var table_filtered = this.renderTemplate('filter', {
        userlist: users,
        permission: hasPermission,
      });
      this.$('#agent_list tbody').replaceWith(table_filtered); //side effect
    },

    //TODO: docs
    toggleSort: function(e) {
      e.preventDefault();
      var entry = e.currentTarget.value;
      var target_header = e.currentTarget;
      var target_class = this.$(target_header).prop('className').split(' ');
      if(target_class.length === 1 && target_class[0] == 'srt_header') {
        var header_array = this.$('#agent_list thead tr th.srt_header'); // all headers
        _.each(header_array, _.bind(function(head){  //  Make each header class blank then add orig
          this.$(head).toggleClass().addClass('srt_header');

        }, this));
        this.$(target_header).addClass('current asc'); //then make our current class the correct sort
      }
      else{
        this.$(target_header).toggleClass("asc desc");
      }
      entry = this.$('#filter_search').prop('value');
      if (entry.length > 0) {
        this.renderFilter(entry.toLowerCase());
      }
      else {
        this.renderFilter('');
      }
    },

    factory: function(context) {
        console.log('navbar');        
        return {
            filterAgents: _.bind(this.filterAgents, context),
            renderNavBar: _.bind(this.renderNavBar, context),
            renderFilter: _.bind(this.renderFilter, context),
            toggleSort: _.bind(this.toggleSort, context)            
        }
    }
};
