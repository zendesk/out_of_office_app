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
      'keyup #filter': 'filterAgents',
      'ticket.save': 'warnOnSave',

    },

    requests: {

      // Requests
      'getAllAgents': function(page) {
        //fetches all agent user objects
        return {
          url: helpers.fmt(
            '/api/v2/users.json?role[]=agent&role[]=admin&page=%@', page)
        };
      },
      'getSingleAgent': function(user_id) {
        //fetches single user object
        return {
          url: helpers.fmt('/api/v2/users/%@.json', user_id)
        };
      },

      'setAgentStatus': function(user_id, away_status) {
        //sets agent checkbox status, away_status is true for away, false for available
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

    init: function() {
      //ready variables and switch to user template
      console.log('init');
      this.checkInstalled();
      this.renderUser();
    },

    renderNavBar: function(filter) {
      //Fetch all agents then render the navbar template
      this.switchTo('loading');
      //if (filter) {
      //var users = _.filter(users, function(user) {
      //return (user.name.indexOf(filter) > -1 || user.email.indexOf(
      //filter) > -1);
      //});
      //var table_filtered = this.renderTemplate('filter', {
      //userlist: users
      //});
      //this.$('#agent_list').replaceWith(table_filtered);
      //} else {
      //this is only for admin interface.
      this.fetchAllUsers().done(_.bind(function(data) {
        this.switchTo('navbar', {
          userlist: this.users
        });
      }, this))
      //if (this.$('#filter_search')) {
      //this.$('#filter_search').focus();
      //}
      //}
    },

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
                'error');
            }, this));
        }
      )

    },

    renderUser: function() {
      //Fetch current user (if they exist) then switch to the user template
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

    confirmAgentStatus: function(e) { //this is the first point of action in the toggle on/off for admin interface. Checks current status, prepares modal for changing to opposite.
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

    popModal: function(messageHeader, messageContent, messageConfirm,
      messageCancel, agent_id) {
      //generates the confirmation modal conditionally, accepting message content (can include input controls as well as the confirmation and cancel button labels (cancel is optional)
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

    onModalAccept: function(e) {
      //change agent status
      e.preventDefault();
      var user_id = e.currentTarget.value;
      if (user_id != '') {
        this.toggleStatus(user_id);
      }
      this.$('.mymodal').modal('hide');
    },

    onModalCancel: function(e) {
      //abort changes and reset
    },

    toggleStatus: function(user_id) {
      //conditionally change agent status to whatever it isn't set to currently, return true if set to away, false if set to available
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

    refreshLocation: function() {
      console.log(this.currentLocation());
      if (this.currentLocation() == 'nav_bar') {
        this.renderNavBar();
      } else if (this.currentLocation() == 'user_sidebar') {
        this.renderUser();
      }
    },

    filterAgents: function(e) {
      var entry = e.currentTarget.value;
      if (entry.length) {
        this.renderNavBar(entry);
      } else {
        this.renderNavBar();
      }
    },

    installApp: function() {
      this.ajax('createUserField')
        .done(_.bind(function(data) {
          services.notify('Successfully added required user fields.');
        }, this))
        .fail(_.bind(function() {
          this.notifyFail();
        }, this));
    },

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

    warnOnSave: function() {
      //if agent is set to away and submits a ticket update, warn them to set their status to available
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

    _paginate: function(a) { //this just paginates our list of users...utility function.
      var results = [];
      var initialRequest = this.ajax(a.request, a.page);
      // create and return a promise chain of requests to subsequent pages
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

    notifySuccess: function() { //  Cannot refresh ticket data from app, user must refresh page.
      services.notify(
        'Your updates were successful. A refresh may be required to see these changes in Zendesk.'
      );
    },

    notifyFail: function() { // Whoops?
      services.notify(
        'There was a problem communicating with Zendesks REST API. If a second try does not work, please contact the app developers for support.',
        'error');
    },

    notifyInvalid: function() {
      services.notify(
        'This agent is currently out of the office. Please assign to another agent',
        'error');
    }

  };

}());
