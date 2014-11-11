module.exports = {

    url: function(url) { //requests a simple url - used when the URL is predefined (typically getAll())
        return {
            'url': url
        };
    },

    getAllAgents: function(page) {
        return {
            url: helpers.fmt('/api/v2/users.json?role[]=agent&role[]=admin&page=%@', page)
        };
    },

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
                            "operator": "value",
                            "value": "open"
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


    tagTicket: function(ticketID) {
        return {
            type: 'POST',
            url: helpers.fmt('/api/v2/tickets/%@/tags.json', ticketID),
            contentType: 'application/json',
            data: JSON.stringify({
                "tags": ["agent_ooo"]
            })
        };
    },

    unTagTicket: function(ticketID) {
        return {
            type: 'DELETE',
            url: helpers.fmt('/api/v2/tickets/%@/tags.json', ticketID),
            contentType: 'application/json',
            data: JSON.stringify({
                "tags": ["agent_ooo"]
            })
        };
    },

    pendingTickets: function(user_id, page) {
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
                        "all": [{
                            "field": "status",
                            "operator": "greater_than",
                            "value": "open"
                        },
                        {
                            "field": "status",
                            "operator": "less_than",
                            "value": "closed"
                        },
                        {
                            "field": "assignee_id",
                            "operator": "is",
                            "value": user_id
                        }]
                    }
                }
            })
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
                        "all": [{
                            "field": "status",
                            "operator": "is",
                            "value": "open"
                        },
                        {
                            "field": "assignee_id",
                            "operator": "is",
                            "value": user_id
                        }]
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

