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
    *
    *
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
    //TODO: Is this correct?   * currently...this just returns true... mainly here for reminder.
    *
    * 
    */
    saveTicket: function() { // 
      var assignee_id = this.ticket().assignee().user().id();
      var assignee_intersect = _.chain(this.users)
        .filter(function(user) {
          return user.tags.indexOf('agent_ooo') > -1;
        })
        .filter(function(user) {
          return (user.id === assignee_id);
        })
        .value();
      console.log(assignee_intersect);
      if (assignee_intersect.length === 0) {
        return true;
      } else {
        this.notifyInvalid();
        return false;
      }
    },

    /*
    * this is the first point of action in the toggle on/off for admin interface. Checks current status, prepares modal for changing to opposite.
    *
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
    * generates the confirmation modal conditionally, accepting message content (can include input controls as well as the confirmation and cancel button labels (cancel is optional)
    *
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

    },

    /*
    * change agent status
    *
    *
    */
    onModalAccept: function(e) {
      e.preventDefault();
      var user_id = e.currentTarget.value;
      this.toggleStatus(user_id);
      this.$('.mymodal').modal('hide');
    },

    /*
    * abort changes and reset
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
    *
    *
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
    *
    *
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
    *
    *
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
    *
    *
    *
    */
    installApp: function() {
      this.ajax('createUserField')
        .done(_.bind(function(data) {
          services.notify('Successfully added required user fields.');
        }, this))
        .fail(_.bind(function() {
          this.notifyFail();
        }, this));
    },

    /*
    *
    *
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

              if (!filtered_fields.length) {
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
    *
    */
    warnOnSave: function() {
    },

    /*
    * this just paginates our list of users...utility function.
    *
    * paramaters: a
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
