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
            unassignTickets: false,
            preventAssignOOO: true,

            // Settings for review

            // createTrigger: this.setting('createTrigger'),
            // triggerTitle: this.setting('triggerTitle'),
            // triggerID: undefined, // This is not in the app settings
            // userFieldName: this.setting('userFieldName'),
            // userFieldKey: this.setting('userFieldKey'),
            // confirmChange: this.setting('confirmChange'),
            // unassignTickets: this.setting('unassignTickets'),
            // preventAssignOOO: this.setting('preventAssignOOO'),

            changeStatusMessage: function(name, unassignTickets) { // right before 127 in ui.js it passes in the agent name and gets an object that contains the available / unavailable html defninitation to create the modal - need to change this function needs another parameter to see maybe where there's availabe & an object - unavailbale & an object is a checkbox in the option section - clear it out to be blank it will no longer send hte checkbox through
                if (unassignTickets === true) {  // **NOTE** checkbox CHECKED = checkbox HIDDEN ; unassignTickets option TRUE = checkbox HIDDEN
                    return {
                        available: {
                            header:  'Please confirm status change',
                            content: '<p>This action will tag <strong>' + name + '</strong> as available and allow tickets to be assigned.</p>',
                            confirm: '<p style="color: white; font-family: proxima-nova, sans-serif; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Set to Available</p>',        
                            cancel:  'Cancel'
                        },
                        unavailable: {
                            header:  'Please confirm status change',
                            content: '<p>This action will tag <strong>' + name + '</strong> as out of office and prevent tickets from being assigned.</p>',
                            confirm: '<p style="color: white; font-family: proxima-nova, sans-serif; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom:8px">Set to Unavailable</p>',
                            cancel:  'Cancel'
                        },
                    };
                } else {
                    return {
                        available: {
                            header:  'Please confirm status change',
                            content: '<p>This action will tag <strong>' + name + '</strong> as available and allow tickets to be assigned.</p>',
                            confirm: '<p style="color: white; font-family: proxima-nova, sans-serif; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Set to Available</p>',        
                            cancel:  'Cancel'
                        },
                        unavailable: {
                            header:  'Please confirm status change',
                            content: '<p>This action will tag <strong>' + name + '</strong> as out of office and prevent tickets from being assigned.</p>',
                            confirm: '<p style="color: white; font-family: proxima-nova, sans-serif; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom:8px">Set to Unavailable</p>',
                            cancel:  'Cancel',
                            options: '<p style="font-family: proxima-nova, sans-serif;"><label><input type="checkbox" name="reassign_current" /><span id="foo">Unassign All Open Tickets</span></label></p>'
                        },
                    };
                }
            },
            lockRender: false,
        },

        renderRetries: 0,        

        //app.created
        init: function(app) {
            console.log(this.options.unassignTickets);

            this.switchTo('loading');
            this.require = require('context_loader')(this);            
            this.require('install_app', this.options)();
        },

        //loaded_settings
        createSettings: function(evt) {
            this.options = evt.settings;
            this.trigger("render_app");
        },

        //app.activated
        //pane.activated
        //render_app
        //ticket.assignee.user.id.changed
        //ticket.assignee.group.id.changed
        render: function(evt) {
            var ui = this.require('ui', this.options);
            if(!this.options.lockRender) {
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
            var tags = "removed";
            if(evt.agent.user_fields.agent_ooo) {
                status = "unavailable";
                tags = "added";
            } 
            var statusMessage = '<p>' + evt.agent.name + ' is now <strong>' + status + '.</strong> </p>';
            var tagsMessage = '<p>Tickets assigned to <strong>' + evt.agent.name + '</strong> with the status <strong>Pending/On-Hold</strong> will have the <strong>\"agent_ooo\"</strong> tag <strong>' + tags + '</strong>.</p>';
            services.notify(statusMessage + tagsMessage, 5000);
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

        //tickets_tagged
        notifyUnAssign: function(evt) {
            var action = 'Updated ';
            var status = ' tickets assigned to ';
            if(evt.ticketView == 'pendingTickets') {
                status = ' Pending/On-Hold tickets with the agent status for ';
            } else if(evt.ticketView == 'ticketPreview') {
                action = 'Unassigned ';
                status = ' tickets previously assigned to ';
            }
            services.notify(action + evt.count + status + evt.name + ".");
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
