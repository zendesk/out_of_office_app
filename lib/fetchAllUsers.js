
/* fetchAllUsers:
 *
 * calls a request that gets all agents in a paginated list
 *
 * returns: a promise that handles the API call
 * Side Effects: a notification on failure
 *
 */

module.exports = function() {

      return this.promise(
        function(done, fail) {

          this.users = [];

          var fetchedUsers = this._paginate({
            request: 'getAllAgents',
            entity: 'users',
            page: 1
          });

          fetchedUsers
            .done(_.bind(
              function(data) {
                this.users = data;
                done();
              }, this))
            .fail(_.bind(function() {
              services.notify(
                "Something went wrong and we couldn't reach the REST API to retrieve all user data",
                'error'); //side effect
            }, this));
        }
      );

    };


