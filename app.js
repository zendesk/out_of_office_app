(function() {

  return {

    defaultState: 'loading',
    users: [],

    events: {

      // App
      'app.activated': 'init',
      'pane.activated': 'renderNavBar',
      'pane.deactivated': 'renderUser',

      // UI
      'click .modalAccept': 'onModalAccept',
      'click .modalCancel': 'onModalCancel',
      'click .set-status': 'toggleStatus',
      'click .status-toggle': 'confirmAgentStatus',
      'keyup #filter_search': 'filterAgents',
      'ticket.save': 'warnOnSave',

    },

    requests: {

      /*
      *
      *
      *
      */
      'getAllAgents': function(page) {
        return {
          url: helpers.fmt(
            '/api/v2/users.json?role[]=agent&role[]=admin&page=%@', page)
        };
      },

      /*
      *
      *
      *
      */
      'getSingleAgent': function(user_id) {
        return {
          url: helpers.fmt('/api/v2/users/%@.json', user_id)
        };
      },


      /*
      *
      *
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

      getUserFields: function() {
        return {
          url: '/api/v2/user_fields.json'
        };
      },

      /*
      *
      *
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
                      "field": "current_tags",
                      "operator": "includes",
                      "value": "agent_ooo" //we can grab this from settings maybe, if necessary...
                  },
                  {
                      "field": "status",
                      "operator": "value_previous",
                      "value": "pending"
                  }
                  ],
                "any": []
              },
              "actions": [
                {
                  "field": "assignee_id",
                  "value": ""
                }
              ]
            }
          })
        };
      }
    },

    /*
    * ready variables and switch to user template
    *
    *
    */
    init: function() {
      this.checkInstalled();
      this.renderUser();
    },

    /*
    * Fetch all agents then render the navbar template
    *
    * 
    */
    renderNavBar: function(filter) {
      this.fetchAllUsers().done(_.bind(function(data) {
        this.switchTo('navbar', {
          userlist: this.users
        });
        this.$('#filter_search').focus();
      }, this))
    },

    /*
    * calls a request that gets all agents in a paginated list
    *
    * returns: a promise that handles the API call
    *
    */
    fetchAllUsers: function() {

      return this.promise(
        function(done, fail) {

          this.users = [];

          var fetchedUsers = this._paginate('getAllAgents', 'users', 1);

          fetchedUsers
            .done(_.bind(
              function(data) {
                this.users = data;
                done();
              }, this))
            .fail(_.bind(function() {
              services.notify(
                "Something went wrong and we couldn't reach the REST API to retrieve all user data",
                'error');
            }, this));
        }
      )

    },

    /*
    * Fetch current user (if they exist) then switch to the user template
    *
    *
    */
    renderUser: function() {
      this.switchTo('loading');
      if (this.currentLocation() == 'user_sidebar') {
        var role = this.user().role();
        console.log(this.user().role());
        if (role == 'admin' || role == 'agent') {
          this.ajax('getSingleAgent', this.user().id())
            .done(function(data) {
              var currentUser = data.user;
              console.log(currentUser);
              this.switchTo('user', {
                user: currentUser
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

    /* 
    * checks current status, prepares modal for changing to opposite.
    *
    * parameters: the click event of the status toggle
    *
    */
    confirmAgentStatus: function(e) { 
      e.preventDefault();
      var user_id = e.currentTarget.value;
      this.ajax('getSingleAgent', user_id)
        .done(function(data) {
          var user = data.user;
          console.log(user.user_fields.agent_ooo);
          var agent_away = user.user_fields.agent_ooo;
          if (agent_away === false) {
            this.popModal("Please Confirm Status Change",
              "<p>This action will reassign " + user.name +
              "'s open tickets and change their status to away. Please confirm.</p>",
              "Mark as Away", "Cancel", user_id)
          } else if (agent_away === true) {
            this.popModal("Please Confirm Status Change",
              "<p>This action will mark " + user.name +
              "as available and allow assignment. Please confirm.</p>",
              "Mark as Available", "Cancel", user_id)
          };
        });

    },

    /*
    * generates the confirmation modal
    * 
    * parameters: the header of the modal
    * the content of the modal 
    * the text for the label of the confirm button
    * optional text to replace the label of the cancel button
    *
    */
    popModal: function(messageHeader, messageContent, messageConfirm,
      messageCancel, agent_id) {
      //
      this.$('.mymodal').modal({
        backdrop: true,
        keyboard: false,
        header: this.$('.modal-header').text(messageHeader),
        content: this.$('.modal-body').html(messageContent),
        confirm: this.$('.btn-confirm').html(messageConfirm).attr('value',
          agent_id),
        cancel: this.$('.btn-cancel').html(messageCancel)
      });
      if (messageCancel === null) {
        this.$('.btn-cancel').hide();
      }
    },

    /*
    * changes the agent status on an accepted modal
    *
    * parameters: the click event for the modal accept button
    *
    */
    onModalAccept: function(e) {
      e.preventDefault();
      var user_id = e.currentTarget.value;
      if (user_id != '') {
        this.toggleStatus(user_id);
      }
      this.$('.mymodal').modal('hide');
    },

    /*
    * abort changes and reset
    *
    * parameters: the click event for the modal cancel button
    * 
    */
    onModalCancel: function(e) {
    },

    /*
    * conditionally change agent status to whatever it isn't set to currently
    * 
    * paramaters: user_id of agent to be set
    * return: true if set to away, false if set to available
    */
    toggleStatus: function(user_id) {
      //
      this.ajax('getSingleAgent', user_id)
        .done(function(data) {
          var user = data.user;
          this.ajax('setAgentStatus', user_id, !user.user_fields.agent_ooo)
            .done(_.bind(function() {
              this.notifySuccess();
              this.refreshLocation();
            }, this))
            .fail(_.bind(function() {
              this.notifyFail();
            }, this));
        });
    },

    /*
    * selects which location to rended based on app context
    * then calls the render for either the navbar or user sidebar UI
    *
    */
    refreshLocation: function() {
      console.log(this.currentLocation());
      if (this.currentLocation() == 'nav_bar') {
        this.renderNavBar();
      } else if (this.currentLocation() == 'user_sidebar') {
        this.renderUser();
      }
    },

    /*
    * checks if a filter has been entered 
    * calls the render method 
    * TODO: merge with renderFilter and/or refactor to better split functionality
    *
    * parameters: the keyup function object
    * 
    */
    filterAgents: function(e) {
      var entry = e.currentTarget.value;
      if (entry.length) {
        this.renderFilter(entry);
      } else {
        this.renderNavBar();
      }
    },

    /*
    * filters the user list by name or email
    * then updates the view with the new list
    * 
    * parameters: the string that is filtered for
    *
    */
    renderFilter: function(filter) {
      var users = _.filter(this.users, function(user) {
      return (user.name.indexOf(filter) > -1 || user.email.indexOf(
      filter) > -1);
      });
      var table_filtered = this.renderTemplate('filter', {
      userlist: users
      });
      this.$('#agent_list').replaceWith(table_filtered);
    },

    /*
    * calls the createUserField request to generate the needed user fields
    * TODO: create trigger as well
    * TODO: Need to grab the trigger ID and add it to the settings so when we add users to ANY we know what trigger to grab.
    */
    installApp: function() {
      this.ajax('createUserField')
        .done(_.bind(function(data) {
          services.notify('Successfully added required user fields.');
        }, this))
        .fail(_.bind(function() {
          this.notifyFail();
        }, this));
      this.ajax('createTrigger')
        .done(_.bind(function(data) {
          services.notify('Successfully added required trigger.');
          //var trigger_id = data.trigger.id;
          // Need to grab the trigger ID and add it to the settings so when we add users to ANY we know what trigger to grab.
        }, this))
        .fail(_.bind(function() {
          this.notifyFail();
        }, this));
    },

    /*
    * check to see if the app has the required agent fields
    * TODO: check for trigger as well
    *
    */
    checkInstalled: function() {
      return this.promise(
        function(done, fail) {
          this.ajax('getUserFields').done(
            function(data) {

              var filtered_fields = _.chain(data.user_fields).filter(
                function(field) {
                  return (field.key == 'agent_ooo' && field.active == true &&
                    field.type == 'checkbox' && field.tag == 'agent_ooo');
                }).value();

              if (!filtered_fields.length) {  //currently only tests for user field. Will need to test for trigger and create the resource that doesn't currently exist.
                services.notify("Required user fields not present", 'error');
                this.installApp();
                fail();
              } else {
                done();
              }
            })
        })
    },

    /*
    * if agent is set to away and submits a ticket update, warn them to set their status to available
    *
    * return: a promise that checks if the assignee is out of office, and prevents saving with a modal 
    * 
    */
    warnOnSave: function() {
      return this.promise(function(done, fail) {
        var ticket = this.ticket();
        var assignee = ticket.assignee().user();
        this.ajax('getSingleAgent', assignee.id()).then(
          function(data) {
            console.log(data.user.user_fields.agent_ooo);
            if (data.user.user_fields.agent_ooo) {
              this.popModal("Assignee is Away",
                "<p>The assignee you have selected: " + data.user.name +
                "is currently marked as away and cannot have tickets assigned to them.",
                "Cancel", null, null);
              fail();
            } else {
              done();
            }
          }, function() {
            console.log('request failed but ticket.save shall pass');
            done();
          }
        );
      });
    },

    /*
    * this just paginates our list of users...utility function.
    *
    * parameters: the ajax request to make, the entity to get the data for, and the page to load
    * return: a promise chain of requests to subsequent pages
    */
   _paginate: function(request, entity, page) { //
      var results = [];
      var initialRequest = this.ajax(a.request, a.page);
      var allPages = initialRequest.then(function(data) {
        results.push(data[a.entity]);
        var nextPages = [];
        var pageCount = Math.ceil(data.count / 100);
        for (; pageCount > 1; --pageCount) {
          nextPages.push(this.ajax(a.request, pageCount));
        }
        return this.when.apply(this, nextPages).then(function() {
          var entities = _.chain(arguments)
            .flatten()
            .filter(function(item) {
              return (_.isObject(item) && _.has(item, a.entity));
            })
            .map(function(item) {
              return item[a.entity];
            })
            .value();
          results.push(entities);
        }).then(function() {
          return _.chain(results)
            .flatten()
            .compact()
            .value();
        });
      });
      return allPages;
    },

    /*
    * inform user that they must refresh the page
    *
    *
    */
    notifySuccess: function() { 
      services.notify(
        'Your updates were successful. A refresh may be required to see these changes in Zendesk.'
      );
    },

    /*
    * generic failure notification
    *
    *
    */
    notifyFail: function() {
      services.notify(
        'There was a problem communicating with Zendesks REST API. If a second try does not work, please contact the app developers for support.',
        'error');
    },

    /*
    * Invalid assignment message 
    * 
    *
    */
    notifyInvalid: function() {
      services.notify(
        'This agent is currently out of the office. Please assign to another agent',
        'error');
    }

  };

}());
