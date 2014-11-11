//see module_template.js for documentation on the module format and how to create new modules
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
                util.findObject('getTriggers', 'triggers', 'title', util.settings.triggerTitle)
            ).done(function(field, trigger) {

                if(trigger !== undefined && field !== undefined) {
                    done();
                } else if(field === undefined && trigger === undefined && util.settings.createTrigger) {
                    util.appFramework.when(
                        util.appFramework.ajax('createUserField'),
                        appFramework.ajax('createTrigger')
                    ).done(function() {done();})
                } else if(field === undefined) {
                    util.appFramework.ajax('createUserField').done(function(userField) {done();});
                } else if(trigger === undefined && util.settings.createTrigger) {
                    util.appFramework.ajax('createTrigger').done(function(trigger) {done();});
                }
            });
        });
    }
};

module.exports = {

    factory: function(context, settings) {
        _.extend(context.requests, requests); //add in needed requests for the module
        _.extend(util, context.require('get_all')); //add in getAll methods to util
        util.appFramework = context; //provide the App Framwork to the functions 
        util.settings = settings;
        return this.loadSettings;
    },

    loadSettings: function() {
        var app = util.appFramework;
        var settings = util.settings;
        util.installApp().done(function() {
            settings.installed = true;
            app.trigger('loaded_settings', {settings: settings});
        });
    },
};
