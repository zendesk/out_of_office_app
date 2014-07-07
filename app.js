(function() {

  return {
    users: [],

    events: {
      'app.activated': 'init',
      'click .status-toggle':'confirmAgentStatus',
      'click .confirm-agent-away': 'putAgentAway',
      'click .confirm-agent-available': 'putAgentBack',
      'ticket.save': function(){// currently...this just returns true... mainly here for reminder.
        var assignee_id = this.ticket().assignee().user().id();
        var assignee_intersect = _.chain(this.users)
        .filter(function(user){
          return user.tags.indexOf('agent_ooo') > -1;
        })
        .filter(function(user){
          return (user.id === assignee_id);
        })
        .value();
        console.log(assignee_intersect);
        if(assignee_intersect.length === 0){
          return true;
        }
        else {
          this.notifyInvalid();
          return false;
        }
      },

      'keyup #filter_search': function(e){
        var entry = e.currentTarget.value;
        if(entry.length){
          this.renderAdmin(entry);
        }
        else {
          this.renderAdmin();
        }
      }

    },

    requests: {
      getAgentList: function(page) {
        return {
          url: helpers.fmt('/api/v2/users.json?role[]=agent&role[]=admin&page=%@', page)
        };
      },

      addAgentTag: function(user_id) {
        return {
          url: helpers.fmt('/api/v2/users/%@.json', user_id),
          dataType: 'JSON',
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify({"user": {"user_fields": {"agent_ooo": true } } })  //although this is adding an agent tag. I still haven't decided if we should create a checkbox or ask the installer to enter a user_field key for checkbox/tag. This is much more efficient than just tagging the user as it allows toggling the value without reading tags, concatonating new tags, then passing that back via api.
        };
      },

      removeAgentTag: function(user_id) {
        return {
          url: helpers.fmt('/api/v2/users/%@.json', user_id),
          dataType: 'JSON',
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify({"user": {"user_fields": {"agent_ooo": false } } })
        };
      }
    },

    init: function() {
      this.users = [];
      var fetchedUsers = this._paginate({
        request: 'getAgentList',
        entity: 'users',
        page: 1
      });

      fetchedUsers
      .done(_.bind(function(data) {
        this.users = data;
        this.renderAdmin();
      }, this))
      .fail(_.bind(function() {
        services.notify("Something went wrong and we couldn't reach the REST API to retrieve all user data", 'error');
      }, this));

    },

    renderAdmin: function(filter) {
      if(filter) {
        var users = _.filter(this.users,function(user){
          return  (user.name.indexOf(filter) > -1 || user.email.indexOf(filter) > -1);
        });
        var table_filtered = this.renderTemplate('filter', {userlist: users});
        this.$('#agent_list').replaceWith(table_filtered);
      }
      else {
        //this is only for admin interface.
        this.switchTo('main', {userlist: this.users});
        if(this.$('#filter_search')) {
          this.$('#filter_search').focus();
        }
      }


    },

    confirmAgentStatus: function(e) { //this is the first point of action in the toggle on/off for admin interface. Checks current status, prepares modal for changing to opposite.
      e.preventDefault();
      var user_id = e.currentTarget.value;
      var userdata = _.find(this.users, function(user){
        return user.id == user_id;
      });
      var agent_away = userdata.user_fields.agent_ooo;
      if (agent_away === false) {
        this.$('.agent-to-away').modal({
          backdrop: true,
          keyboard: false,
          name: this.$('span.users-name').text(userdata.name),
          user_id: this.$('button.confirm-agent-away').attr('value', user_id)
        });
      } else if (agent_away === true) {
        this.$('.agent-to-available').modal({
          backdrop: true,
          keyboard: false,
          name: this.$('span.users-name').text(userdata.name),
          user_id: this.$('button.confirm-agent-available').attr('value', user_id)
        });
      }

    },

    putAgentAway: function(e) {    //sorry guys, I don't know if I can do better than this callback hell. Can't think of another way to do this and stay within the framework.
    e.preventDefault();
    var user_id = e.currentTarget.value;
    var user_row = this.$('tr#' + user_id + ' td.green');
    this.ajax('addAgentTag', user_id)
    .done(_.bind(function(){
      user_row.attr('class','red').text("Away");
      this.$('.agent-to-away').modal('hide');
      this.notifySuccess();
      this.init();//needed to for a second click on same name to work...doh.
    }, this))
    .fail(_.bind(function(){
      this.notifyFail();
    }, this));
  },

  putAgentBack: function(e) {    //Same as above comment. This does what it says, verifies the changes, then makes active changes to the current menu.
    e.preventDefault();
    var user_id = e.currentTarget.value;
    var user_row = this.$('tr#' + user_id + ' td.red');
    this.ajax('removeAgentTag', user_id)
    .done(_.bind(function(){
      user_row.attr('class','green').text("Available");
      this.$('.agent-to-available').modal('hide');
      this.notifySuccess();
      this.init();
    }, this))
    .fail(_.bind(function(){
      this.notifyFail();
    }, this));
  },

  _paginate: function(a) {    //this just paginates our list of users...utility function.
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

  notifySuccess: function() { //	Cannot refresh ticket data from app, user must refresh page.
    services.notify('Your updates were successful. A refresh may be required to see these changes in Zendesk.');
  },

  notifyFail: function() { //	Whoops?
    services.notify('There was a problem communicating with Zendesks REST API. If a second try does not work, please contact the app developers for support.', 'error');
  },

  notifyInvalid: function() {
    services.notify('This agent is currently out of the office. Please assign to another agent', 'error');
  }
};

}());
