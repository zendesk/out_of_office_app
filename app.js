(function() {

    return {
        users: [],

        events: {
            'app.activated': 'init'
        },

        requests: {
            getAgentList: function(page) {
                return {
                    url: helpers.fmt('/api/v2/users.json?role[]=agent&role[]=admin&page=%@', page)
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
                    this.drawTemplate();
                }, this))
                .fail(_.bind(function() {
                    services.notify("Something went wrong and we couldn't reach the REST API to retrieve all user data", 'error');
                }, this));

        },

        drawTemplate: function() {
            var userlist = _.chain(this.users)
                .map(function(user) {
                    return {
                        id: user.id,
                        name: user.name,
                        role: user.role,
                        tags: user.tags
                    }
                })
                .value();
            this.switchTo('main', {
                userlist: userlist
            });
        },
        _paginate: function(a) {
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
        }
    };

}());