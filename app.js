(function() {

  return {

    defaultState: 'loading',
    users: [],

    events: {

      // App
      'app.activated': 'init',
      'pane.activated': 'renderNavBar',
      'pane.deactivated': 'renderUser',
      'ticket.assignee.user.id.changed': 'renderTicket',

      // UI
      'click .modalAccept': 'onModalAccept',
      'click .modalCancel': 'onModalCancel',
      'click .set-status': 'toggleStatus',
      'click .status-toggle': 'confirmAgentStatus',
      'keyup #filter_search': 'filterAgents',
      'ticket.save': 'warnOnSave',
      'click .srt_header': 'toggleSort'

    },

    requests: {

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
    },

    /*
     * Ready variables and switch to user template
     *
     * Side Effects: will install the app if the required fields are not detected,
     * will render the user sidebar app
     */
    init: function() {
      this.checkInstalled();
      if (this.currentLocation() == 'user_sidebar') {
        this.renderUser();
      }
      else if (this.currentLocation() == 'ticket_sidebar' || this.currentLocation() ==  'new_ticket_sidebar') {
        this.renderTicket();
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

    },

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
     * Generates the confirmation modal
     *
     * parameters: the header of the modal
     * the content of the modal
     * the text for the label of the confirm button
     * optional text to replace the label of the cancel button
     * Side Effects: creates a modal popup with the specified data,
     * hides that modal's cancel button if none is speficied
     *
     */
    popModal: function(messageHeader, messageContent, messageConfirm,
      messageCancel, agent_id, option) {
      this.$('.mymodal').modal({
        backdrop: true,
        keyboard: false,
        header: this.$('.modal-header').text(messageHeader),
        content: this.$('.modal-body').html(messageContent),
        confirm: this.$('.btn-confirm').html(messageConfirm).attr('value',
          agent_id),
        cancel: this.$('.btn-cancel').html(messageCancel),
        option: this.$('span.option').html(option)
      }); //side effect
      if (messageCancel === null) {
        this.$('.btn-cancel').hide(); //side effect
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

    /*
     * Conditionally change agent status to whatever it isn't set to currently
     *
     * paramaters: user_id of agent to be set
     * return: true if set to away, false if set to available
     * Side Effects: Notifications, re-renders the UI, updates the agent specified
     * to invert their current OOO status
     *
     */
    toggleStatus: function(user_id) {
      this.ajax('getSingleAgent', user_id)
        .done(function(data) {
          var user = data.user;
          this.ajax('setAgentStatus', user_id, !user.user_fields.agent_ooo) //side effect
          .done(_.bind(function() {
            this.notifySuccess();
            this.refreshLocation();
            this.toggleTrigger(user_id, !user.user_fields.agent_ooo);
          }, this))
            .fail(_.bind(function() {
              this.notifyFail(); //side effect
            }, this));
        });
    },

    unassignAll:  function(user_id) {
      this.ajax('ticketSearch', user_id)
      .done(function(data){
        if(data.count > 0) {
          var id_array = [];
          _.each(data.results, function(result){
            id_array.push(result.id);
          });
          var id_string = id_array.toString();
          this.ajax('updateMany', id_string);
        }
      })
      .fail(function(){
        this.notifyFail();
      });
    },

    //TODO: docs
    toggleTrigger: function(user_id, away_status) {
      var trigger_id = this.setting('triggerID');
      this.ajax('getTriggerData', trigger_id)
        .done(_.bind(function(triggerdata) {
          var conditions = triggerdata.trigger.conditions;
          var any = conditions.any;
          if (away_status === true) {
            var new_any = {
              "field": "assignee_id",
              "operator": "is",
              "value": user_id
            };
            var addTrigger = triggerdata;
            addTrigger.trigger.conditions.any.push(new_any);
            this.ajax('modifyTrigger', trigger_id, addTrigger);
          } else {
            var newdata = _.filter(any, function(object) {
              return object.value !== user_id;
            });
            var removeTrigger = triggerdata;
            removeTrigger.trigger.conditions.any = newdata;
            this.ajax('modifyTrigger', trigger_id, removeTrigger);
          }
        }, this))
        .fail(_.bind(function() {
          this.notifyFail();
        }, this));
    },

    /*
     * Selects which location to rended based on app context
     * then calls the render for either the navbar or user sidebar UI
     *
     * Side Effects: either renders the navbar or renders the user sidebar app UI
     *
     */
    refreshLocation: function() {
      if (this.currentLocation() == 'nav_bar') {
        this.renderNavBar(); //side effect
      } else if (this.currentLocation() == 'user_sidebar') {
        this.renderUser(); //side effect
      } else if (this.currentLocation() == 'ticket_sidebar' || this.currentLocation() == 'new_ticket_sidebar') {
        this.renderTicket();
      }
    },

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

    /*
     * Calls the createUserField request to generate the needed user fields
     * TODO: create trigger as well
     * TODO: Need to grab the trigger ID and add it to the settings so when we add users to ANY we know what trigger to grab.
     *
     * Side Effects: many notifications, create trigger, create user field
     *
     */
    installApp: function() {
      this.ajax('createUserField') //side effect
      .done(_.bind(function(data) {
        services.notify('Successfully added required user fields.'); //side effect
      }, this))
        .fail(_.bind(function() {
          this.notifyFail(); //side effect
        }, this));
      this.ajax('createTrigger') //side effet
      .done(_.bind(function(data) {
        services.notify('Successfully added required trigger.');
        var trigger_id = data.trigger.id;
        this.addSetting('triggerID', trigger_id); // Need to grab the trigger ID and add it to the settings so when we add users to ANY we know what trigger to grab.
      }, this))
        .fail(_.bind(function() {
          this.notifyFail(); //side effect
        }, this));
    },

    //TODO: docs
    addSetting: function(setting_name, setting_value) {
      if (setting_name == 'triggerID') {
        var data = {
          "settings": {
            "triggerID": setting_value
          }
        };
        this.ajax('modifySettings', data);
      }
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
                "<p style=\"color: white; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px\">Cancel</p>", "Switch Agent Status", null, ''); //side effect

              this.$('.modalAccept').off('click');
              this.$('.modalAccept').on('click', _.bind(function() {
                this.$('.mymodal').modal('hide');
                this.$('.modalAccept').off('click');
                this.$('.modalAccept').on('click', _.bind(this.onModalAccept, this)); //rebind to the default
                fail();
              }, this));

              this.$('.modalCancel').off('click');
              this.$('.modalCancel').on('click', _.bind(function() {
                this.toggleStatus(data.user.id);
                this.$('.mymodal').modal('hide');
                this.$('.modalCancel').off('click');
                this.$('.modalCancel').on('click', _.bind(this.onModalCancel, this)); //rebind to the default
                done();
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

    //TODO: docs
    //TODO: refactor params
    _paginate: function(a) { //this just paginates our list of users...utility function.
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
     * Side Effects: Notification
     *
     */
    notifySuccess: function() {
      services.notify(
        'Your updates were successful. A refresh may be required to see these changes in Zendesk.'
      ); //side effect
    },

    /*
     * generic failure notification
     *
     * Side Effects: Notification
     *
     */
    notifyFail: function() {
      services.notify(
        'There was a problem communicating with Zendesks REST API. If a second try does not work, please contact the app developers for support.',
        'error'); //side effect
    },

    /*
     * Invalid assignment message
     *
     * Side Effects: Notification
     *
     */
    notifyInvalid: function() {
      services.notify(
        'This agent is currently out of the office. Please assign to another agent',
        'error'); //side effect
    }

  };

}());
