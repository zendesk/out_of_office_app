module.exports = {


    /*
     * Gets the user data for a single agent
     *
     * parameters: the agent's user ID
     * returns: a manifest object with a URL paramater for use by this.ajax
     *
     */
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
