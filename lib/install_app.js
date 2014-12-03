var requests = {
    
    getUserFields: function() {
        return {
            url: '/api/v2/user_fields.json'
        };
    },

    getTriggers: function() {
        return {
            url: '/api/v2/triggers.json'
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
    },

    createTrigger: function() {
        return {
            url: '/api/v2/triggers.json',
            dataType: 'JSON',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                "trigger": {
                    "title": "Ticket: " +this.options.triggerTitle,
                    "active": true,
                    "position": 0,
                    "conditions": {
                        "all": [{
                            "field": "current_tags",
                            "operator": "includes",
                            "value": "agent_ooo"
                        }, {
                            "field": "status",
                            "operator": "is",
                            "value": "open"
                        }, {
                            "field": "assignee_id",
                            "operator": "not_changed",
                            "value": null
                        }],
                    },
                    "actions": [{
                        "field": "assignee_id",
                        "value": ""
                    },
                    {
                        "field": "remove_tags",
                        "value": "agent_ooo"
                    }]
                }
            })
        };
    },

    createTagTrigger: function() {
        return {
            url: '/api/v2/triggers.json',
            dataType: 'JSON',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                "trigger": {
                    "title": "Tag: " + this.options.triggerTitle,
                    "active": true,
                    "position": 0,
                    "conditions": {
                        "all": [{
                            "field": "current_tags",
                            "operator": "includes",
                            "value": "agent_ooo"
                        }, {
                            "field": "assignee_id",
                            "operator": "changed",
                            "value": null,
                        }],
                    },
                    "actions": [{
                        "field": "remove_tags",
                        "value": "agent_ooo"
                    }]
                }
            })
        };
    },

};

var util = {

    version: '2.0',    
    
    findObject: function(request, member, attribute, value) {
        return util.appFramework.promise(function(done, fail) {
            util.getAll(member, [request]).done(function(data) {
                var found = _.find(data, function(item) { return item[attribute] == value; }); //use _.find to return the first trigger with a matching title
                done(found);    //will be undefined if nothing is found
            });
        });
    },

    installApp: function() {
        return util.appFramework.promise(function(done, fail) {

            util.appFramework.when(
                util.findObject('getUserFields', 'user_fields', 'key', util.settings.userFieldKey),
                util.findObject('getTriggers', 'triggers', 'title', "Ticket: " + util.settings.triggerTitle),
                util.findObject('getTriggers', 'triggers', 'title', "Tag: " + util.settings.triggerTitle)
            ).done(function(field, trigger1, trigger2) {

                var requests = [];

                if(field === undefined) {
                    requests.push(util.appFramework.ajax('createUserField'));
                }

                if(trigger1 === undefined && util.settings.createTrigger) {
                    requests.push(util.appFramework.ajax('createTrigger'));
                }

                if(trigger2 === undefined && util.settings.createTrigger) {
                    requests.push(util.appFramework.ajax('createTagTrigger'));
                }
                if(requests.length !== 0) {
                    util.appFramework.when(requests).done(function() {
                        console.log(arguments);
                        done();
                    }).fail(function() {
                        util.appFramework.trigger('network_error', {request: requests, requestType: 'ajax', error: arguments});
                        util.appFramework.trigger('functional_error', {location: 'installApp', requests: requests, foundObjects: [field, trigger1, trigger2]});
                    });
                } else {
                    done();
                }
            });
        }).fail(function() {
            util.appFramework.trigger('functional_error', {location: 'findObject'});
        });
    }

};

module.exports = {

    factory: function(context, settings) {
        _.extend(context.requests, requests); //add in needed requests for the module     
        _.extend(util, context.require('get_all')); //add in getAll methods to util
        _.extend(util, context.require('update_status')); //please don't ask me why this is required, but if you don't load update_status here the requests are never loaded
        util.appFramework = context; //provide the App Framwork to the functions 
        util.settings = settings;
        return {
            loadSettings: this.loadSettings,
        }
    },

    loadSettings: function() {
        var app = util.appFramework;
        var options = util.settings;
        _.extend(options, app.settings)

        util.installApp().done(function() {
            app.trigger('loaded_settings', {settings: options});
        });
    },
};
