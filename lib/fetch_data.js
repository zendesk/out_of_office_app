module.exports = {
    
    
    /* fetchAllUsers:
     *
     * calls a request that gets all agents in a paginated list
     *
     * returns: a promise that handles the API call
     * Side Effects: a notification on failure
     *
     */
    fetchAllUsers: function() {
        return this.promise(
        function(done, fail) {
            this.users = [];
            var fetchedUsers = this._paginate({
            request: 'getAllAgents',
            entity: 'users',
            page: 1
        });
        fetchedUsers.done(_.bind(
            function(data) {
                this.users = data;
                done();
            }, this))
        .fail(_.bind(function() {
            services.notify(
        "Something went wrong and we couldn't reach the REST API to retrieve all user data",
        'error'); //side effect
        }, this));});
    },

    /*
     * Check to see if the app has the required agent fields
     * TODO: check for trigger as well
     *
     * Side Effects: Notification, will install the app if the check fails
     *
     */
    checkInstalled: function() {
      return this.promise(
        function(done, fail) {
          this.ajax('getUserFields').done(
            function(data) {

              var filtered_fields = _.chain(data.user_fields).filter(
                function(field) {
                  return (field.key == 'agent_ooo' && field.active === true &&
                    field.type == 'checkbox' && field.tag == 'agent_ooo');
                }).value();

              if (!filtered_fields.length) { //currently only tests for user field. Will need to test for trigger and create the resource that doesn't currently exist.
                services.notify("Required user fields not present", 'error'); //side effect
                this.installApp(); //side effect
                fail();
              } else {
                done();
              }
            });
        });
    },

    factory: function(context) {
        console.log('fetch_data');
        console.log(this);
        console.log(context);
        return {
            _paginate: context.require('_paginate'),
            fetchAllUsers: _.bind(this.fetchAllUsers, context),
            checkInstalled: _.bind(this.checkInstalled, context)
        }
    }
};
