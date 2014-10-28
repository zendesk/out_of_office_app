module.exports = {

    url: function(url) { //requests a simple url - used when the URL is predefined (typically getAll())
        return {
            'url': url
        };
    },

    /*
     * Gets a list of agents
     *
     * parameters: the page number to load for the list of agents
     * returns: a manifest object with a URL paramater for use by this.ajax
     *
     */
    getAllAgents: function(page) {
        return {
            url: helpers.fmt('/api/v2/users.json?role[]=agent&role[]=admin&page=%@', page)
        };
    },

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
      },

      getTicketUsers: function(ticket_id) {
      return {
          url: helpers.fmt('/api/v2/tickets/%@.json?include=users,groups', ticket_id)
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
      setAgentStatus: function(user_id, away_status) {
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

      getInstalledApps: function() {
        return {
          url: '/api/v2/apps/installations.json'
        };
      },
      

      getTriggers: function() {
        return {
          url: '/api/v2/triggers.json'
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
              "title": this.options.triggerTitle,
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
                    value: "0421008445828ceb46f476700a5fa65e"
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
      modifySettings: function(name, value, installationId) {
          var data = {
          "settings": {
            '%@': value                                 //create a setting with the value, will replace the ID with name
          }};                                           //probably a much nicer way to do this but whatever
          data = helpers.fmt(JSON.stringify(data), name); //replace %@ with the name
          return {
              type: 'PUT',
              url: "/api/v2/apps/installations/%@.json".fmt(this.installationId()),
              contentType: 'application/json',
              data: data 
          };
      },

      ticketSearch: function(user_id) {
          user_id = encodeURIComponent(user_id);
        return {
          url: helpers.fmt('/api/v2/search?query=type%3Aticket%20assignee%3A%@%20status%3Aopen', user_id)
        };
      },

      ticketPreview: function(user_id, page) {
          user_id = encodeURIComponent(user_id);
        return {
          url: helpers.fmt('/api/v2/views/preview.json?page=%@', page),
          dataType: 'JSON',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            "view": {
              "title": 'out-of-office app [System View]',
              "active": true,
              "conditions" : {
                "all": [
                  {
                    "field": "status",
                    "operator": "is",
                    "value": "open"
                  },
                  {
                    "field": "assignee_id",
                    "operator": "is",
                    "value": user_id
                  }
                ]
              }
            }
          })
        };
      },

      unassignMany: function(ticketIDs) {
        return {
          type: 'PUT',
          url: helpers.fmt('/api/v2/tickets/update_many.json?ids=%@', ticketIDs.toString()),
          contentType: 'application/json',
          data: JSON.stringify({
            "ticket": {
              "assignee_id": null
            }
          })
        };
      }
};
