(function() {

    return {

        events: require('events'),

        requests: require('requests'),

        options:  {
            appTitle: 'ooo_app',
            installed: false,
            installationID: undefined,

            createTrigger: true,
            triggerTitle: 'out-of-office app unassign trigger [System Trigger]',
            triggerID: undefined,

            userFieldName: 'Agent Out?',
            userFieldKey: 'agent_ooo',

            confirmChange: true,

            unassignTickets:false,

            preventAssignOOO: true,

            changeStatusMessage: function(name) {
                return { 
                    available: {
                        header:  'Please confirm status change',
                        content: '<p>This action will mark <strong>' + name + '</strong> as available and allow tickets to be assigned</p>',
                        confirm: '<p style="color: white; font-family: proxima-nova, sans-serif; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Available</p>',        
                        cancel:  'Cancel'
                    },
                    unavailable: {
                        header:  'Please confirm status change',
                        content: '<p>This action will mark <strong>' + name + '</strong> as out of office and prevent tickets from being assigned</p>',
                        confirm: '<p style="color: white; font-family: proxima-nova, sans-serif; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom:8px">Mark as Unavailable</p>',
                        cancel:  'Cancel',
                        options: '<p style="font-family: proxima-nova, sans-serif;"><label><input type="checkbox" name="reassign_current" /><span id="foo">Unassign All Open Tickets</span></label></p>'
                    },
                };
            },
        },
        
        debug: true,        
        lockRender: false,        
        renderRetries: 0,        

        //app.created
        init: function(app) {
            this.switchTo('loading');
            this.require = require('context_loader')(this);            
            this.require('install_app', this.options)();
        },

        //loaded_settings
        createSettings: function(evt) {
            this.options = evt.settings;
            this.trigger("render_app");
            if(this.debug) {
                this.runTests();
            }
            
        },

        runTests: function() {
            console.log('running tests');
            var statusMock = {

                ajax: {
                    'unTagTicket': {},
                    'tagTicket': {},
                    'pendingTickets': {
                        "rows": [{
                            "ticket": {
                                "id": 15,
                            }
                        },
                        {
                            "ticket": {
                                "id": 13,
                            }
                        },
                        {
                            "ticket": {
                                "id": 12,
                            }
                        },
                        {
                            "ticket": {
                                "id": 7,
                            }
                        }],
                        "next_page": null,
                        "previous_page": null,
                        "count": 204
                    },
                    'ticketPreview':  {
                        "rows": [{
                            "ticket": {
                                "id": 15,
                            }
                        },
                        {
                            "ticket": {
                                "id": 13,
                            }
                        },
                        {
                            "ticket": {
                                "id": 12,
                            }
                        },
                        {
                            "ticket": {
                                "id": 7,
                            }
                        }],
                        "next_page": null,
                        "previous_page": null,
                        "count": 204
                    },
                    'unassignMany': {},
                    'url':  {
                        "rows": [{
                            "ticket": {
                                "id": 15,
                            }
                        },
                        {
                            "ticket": {
                                "id": 13,
                            }
                        },
                        {
                            "ticket": {
                                "id": 12,
                            }
                        },
                        {
                            "ticket": {
                                "id": 7,
                            }
                        }],
                        "next_page": null,
                        "previous_page": null,
                        "count": 204
                    },
                    'setAgentStatus': {"user":{"id":12345,"name":"John Doe", "role":"admin","user_fields":{"agent_ooo":true}}},
                    'getSingleAgent': {"user":{"id":12345,"name":"John Doe", "role":"admin","user_fields":{"agent_ooo":false}}},
                },

                trigger: true
            };

            var update_status = require('test_helper')(this, statusMock)('update_status', this.options);
            update_status(123456, true);
        },

        //app.activated
        //pane.activated
        //render_app
        //ticket.assignee.user.id.changed
        //ticket.assignee.group.id.changed
        render: function(evt) {
            var ui = this.require('ui', this.options);
            if(!this.lockRender) {
                if (this.currentLocation() == 'nav_bar') {
                    var filter = this.$('#filter_search').val();
                    ui.renderNavBar(filter); 
                } else if (this.currentLocation() == 'user_sidebar') {
                    ui.renderUser(); 
                } else if (this.currentLocation() == 'ticket_sidebar' || this.currentLocation() == 'new_ticket_sidebar') {
                    ui.renderTicket();
                } 
            } 
        },

        //click .set-status
        verifyChange: function(evt) {
            var agentID = evt.currentTarget.value;
            var ui = this.require('ui', this.options);
            var that = this;
            if(this.options.confirmChange) {
                ui.renderStatusModal(agentID);
            } else {
                this.trigger("toggle_status", {agentID: agentID, unassignTickets: that.options.unassignTickets});
            }
        },

        //toggle_status
        updateStatus: function(evt) {
            var agentID = evt.agentID;
            var unassignTickets = evt.unassignTickets;
            var that = this;
            this.require('update_status', this.options)(agentID, unassignTickets);
        },

        //status_changed
        notifyStatus: function(evt) {
            var status = "available";
            if(evt.agent.user_fields.agent_ooo) {
                status = "unavailable";
            }
            services.notify("Updated status for " + evt.agent.name + " to " + status);
            this.trigger("render_app");
        },

        //status_error
        notifyFail: function(evt) {
            services.notify("Unable to update status for " + evt.agent.name, 'alert');
        },

        //createTrigger.done
        //createUserField.done
        notifyInstalled: function(item) {
            services.notify("Detected first run of app. Created required " + item, 'alert');
        },

        //unassigned_ooo
        notifyUnAssign: function(evt) {
            services.notify("Unassigned " + evt.count + " tickets previously assigned to " + evt.name + ".");
        },

        //assigned_ooo
        notifyAssign: function(name) {
            services.notify("Ticket assigned to " + name + " who is unavailable", 'alert');
        },

        renderSave: function() {
            var ui = this.require('ui', this.options);
            return ui.renderSave();        
        },
        
        //getAllAgents.fail
        //getSingleAgent.fail
        //url.fail
        //setAgentStatus.fail
        //getTriggerData.fail
        //modifyTrigger.fail
        //unassignMany.fail
        //ticketPreview.fail
        //getSingleTicket.fail
        //createTrigger.fail
        //createUserField.fail
        //getInstalledApps.fail
        notifyError: function(string) {
            if(this.renderRetries < 0){
                this.trigger("render_app");
            }
            this.renderRetries++;
            console.log("Error: Unable to " + string, 'error');
        }
    };
}());
