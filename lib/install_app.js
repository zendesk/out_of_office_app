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
                    "description": this.I18n.t('user_field.description'),
                    "key": this.options.userFieldKey,
                    "position": 0,
                    "title": this.I18n.t('user_field.name'),
                    "type": "checkbox",
                    "tag": this.options.userFieldKey
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
                    "title": this.I18n.t('trigger.title.ticket'),
                    "active": true,
                    "position": 0,
                    "conditions": {
                        "all": [{
                            "field": "current_tags",
                            "operator": "includes",
                            "value": this.options.userFieldKey
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
                        "value": this.options.userFieldKey
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
                    "title": this.I18n.t('trigger.title.tag'),
                    "active": true,
                    "position": 0,
                    "conditions": {
                        "all": [{
                            "field": "current_tags",
                            "operator": "includes",
                            "value": this.options.userFieldKey
                        }, {
                            "field": "assignee_id",
                            "operator": "changed",
                            "value": null,
                        }],
                    },
                    "actions": [{
                        "field": "remove_tags",
                        "value": this.options.userFieldKey
                    }]
                }
            })
        };
    },

    flagAppInstalled: function(installID) {
        return {
            url: helpers.fmt('/api/v2/apps/installations/%@.json', installID),
            dataType: 'JSON',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                "settings": {
                    "requirementsCreated": true
                }
            })
        };
    },

};

var util = {

    version: '2.3',    
    
    findObject: function(request, member, attribute, value) {
        return util.appFramework.promise(function(done, fail) {
            util.getAll(member, [request]).done(function(data) {
                var found = _.find(data, function(item) { return item[attribute] == value; }); //use _.find to return the first trigger with a matching title
                done(found);    //will be undefined if nothing is found
            });
        });
    },

    flagInstalled: function() {
        var installID = util.appFramework.installationId();
        if(installID !== 0 && !util.settings.requirementsCreated) {
            util.appFramework.ajax('flagAppInstalled', installID);
        } else {
            console.log('first run or zat or already installed');
            console.log(installID);
        }
    },

    installApp: function() {
        return util.appFramework.promise(function(done, fail) {

            util.appFramework.when(
                util.findObject('getUserFields', 'user_fields', 'key', util.settings.userFieldKey),
                util.findObject('getTriggers', 'triggers', 'title', util.appFramework.I18n.t('trigger.title.ticket')),
                util.findObject('getTriggers', 'triggers', 'title', util.appFramework.I18n.t('trigger.title.tag'))
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
                        util.flagInstalled();
                        console.log(arguments);
                        done();
                    }).fail(function() {
                        util.appFramework.trigger('network_error', {request: requests, requestType: 'ajax', error: arguments});
                        util.appFramework.trigger('functional_error', {location: 'installApp', requests: requests, foundObjects: [field, trigger1, trigger2]});
                    });
                } else {
                    util.flagInstalled();
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
        };
    },

    loadSettings: function() {
        var app = util.appFramework;
        var options = util.settings;
        _.extend(options, app.settings);

        if(options.requirementsCreated) {
            app.trigger('loaded_settings', {settings: options});
        } else {
            util.installApp().done(function() {
                app.trigger('loaded_settings', {settings: options});
            });
        }
    },
};
