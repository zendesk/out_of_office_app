module.exports = {

      /*
       * Gets a list of agents
       *
       * parameters: the page number to load for the list of agents
       * returns: a manifest object with a URL paramater for use by this.ajax
       *
       */
      'getAllAgents': function(page) {
        return {
          url: helpers.fmt(
            '/api/v2/users.json?role[]=agent&role[]=admin&page=%@', page)
        };
      },

      /*
       * Gets the user data for a single agent
       *
       * parameters: the agent's user ID
       * returns: a manifest object with a URL paramater for use by this.ajax
       *
       */
      'getSingleAgent': function(user_id) {
        return {
          url: helpers.fmt('/api/v2/users/%@.json', user_id)
        };
      },


      /*
       * Sets the agent's away status
       *
       * parameters: the agent's user ID, the status to set
       * returns: a manifest object with a URL paramater and data for use by this.ajax
       * in a PUT request
       *
       */
      'setAgentStatus': function(user_id, away_status) {
        return {
          url: helpers.fmt('/api/v2/users/%@.json', user_id),
          dataType: 'JSON',
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify({
            "user": {
              "user_fields": {
                "agent_ooo": away_status
              }
            }
          })
        };
      },

      /*
       * Gets a list of user fields
       *
       * returns: a manifest object with a URL paramater for use by this.ajax
       *
       */
      getUserFields: function() {
        return {
          url: '/api/v2/user_fields.json'
        };
      },

      /*
       * Creates the needed custom user field
       *
       *
       * returns: a manifest object with a URL paramater and data for use by this.ajax
       * in a PUT request to create a checkbox that applies the tag agent_ooo
       *
       */
      createUserField: function() {
        return {
          url: '/api/v2/user_fields.json',
          dataType: 'JSON',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            "user_field": {
              "active": true,
              "description": "This field was created by the out-of-office app. Don't delete it, unless you want everything to break",
              "key": "agent_ooo",
              "position": 0,
              "title": "Agent Out?",
              "type": "checkbox",
              "tag": "agent_ooo"
            }
          })
        };
      },

      /*
       * Creates the needed trigger
       *
       *
       * returns: a manifest object with a URL paramater and data for use by this.ajax
       * in a PUT request to create a trigger to update peding tickets with the agent_ooo tag
       *
       */
      createTrigger: function() {
        return {
          url: '/api/v2/triggers.json',
          dataType: 'JSON',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            "trigger": {
              "title": "out-of-office app trigger",
              "active": true,
              "position": 0,
              "conditions": {
                "all": [
                  {
                    "field": "status",
                    "operator": "not_value",
                    "value": "solved"
                  }
                ],
                "any": [
                  {
                    field: "current_tags",
                    operator: "includes",
                    value: "0421008445828ceb46f496700a5fa65e"
                  }
                ]
              },
              "actions": [{
                "field": "assignee_id",
                "value": ""
              }]
            }
          })
        };
      },

      //TODO: docs
      modifyTrigger: function(tid, data) {
        return {
          url: helpers.fmt('/api/v2/triggers/%@.json', tid),
          dataType: 'JSON',
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify(data)
        };
      },

      //TODO: docs
      getTriggerData: function(tid) {
        return {
          url: helpers.fmt('/api/v2/triggers/%@.json', tid)
        };
      },

      //TODO: docs
      modifySettings: function(data) {
        return {
          type: 'PUT',
          url: "/api/v2/apps/installations/%@.json".fmt(this.installationId()),
          contentType: 'application/json',
          data: JSON.stringify(data)
        };
      },

      ticketSearch: function(user_id) {
        return {
          url: helpers.fmt('/api/v2/search?query=type%3Aticket%20assignee_id%3A%@%20status%3Aopen', user_id)
        };
      },

      updateMany: function(id_string) {
        return {
          type: 'PUT',
          url: helpers.fmt('/api/v2/tickets/update_many.json?ids=%@', id_string),
          contentType: 'application/json',
          data: JSON.stringify({
            "ticket": {
              "assignee_id": null
            }
          })
        };
      }
};
