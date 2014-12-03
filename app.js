(function() {

    return {

        events: require('events'),

        requests: {},

        options:  {
            appTitle: 'ooo_app',
            requirementsCreated: false,
            installationID: undefined,
            createTrigger: true,
            triggerTitle: 'out-of-office app unassign trigger [System Trigger]',
            triggerID: undefined,
            userFieldName: 'Agent Out?',
            userFieldKey: 'agent_ooo',
            confirmChange: true,
            unassignTickets: false,
            preventAssignOOO: true,

            // The following is not used in the OOO app due to other apps modal collision issues and will be saved for use in a future release
            // saveWarningButton: warning = '<p style="margin-top: 16px; margin-bottom: 10px; margin-left: 60px; font-weight: bold; font-size: 14px;">AGENT UNAVAILABLE</p><p class="btn" style="width: 250px; font-weight: bold; font-size: 14px; margin-bottom: 16px; padding-top: 10px; padding-bottom: 10px;" onclick="$(\'button.status-toggle\').trigger(\'click\');">Update ' + agent.name + '\'s status</p>';
            
            saveFailMessage: '<p style="margin-top: 16px; margin-bottom: 10px; text-align: center; font-weight: bold; font-size: 20px;">TICKET NOT SAVED</p>',
            saveWarning: function(name) { 
                return '<p style="margin-top: 16px; margin-bottom: 10px; text-align: center; font-size: 14px;"><strong>' + name + '</strong> is <strong>UNAVAILABLE</strong><br/></p><p style="margin-top: 12px; margin-bottom: 6px; text-align: center; font-size: 14px;">If this request requires immediate attention please re-assign to a different agent</p>';
            },

            changeStatusMessage: function(name, unassignTickets) { // right before 127 in ui.js it passes in the agent name and gets an object that contains the available / unavailable html defninitation to create the modal - need to change this function needs another parameter to see maybe where there's availabe & an object - unavailbale & an object is a checkbox in the option section - clear it out to be blank it will no longer send hte checkbox through
                var checkbox = '<p style="font-family: proxima-nova, sans-serif;"><label><input type="checkbox" name="reassign_current" /><span id="foo">Unassign All Open Tickets</span></label></p>';
                if (unassignTickets === true) {  // **NOTE** checkbox CHECKED = checkbox HIDDEN ; unassignTickets option TRUE = checkbox HIDDEN
                    checkbox = undefined;
                }
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
                        options: checkbox
                    }
                };
            },
            lockRender: false,
        },

        renderRetries: 0,        

        //app.created
        init: function(app) {
            this.switchTo('loading');
            this.require = require('context_loader')(this);            
            this.require('install_app', this.options).loadSettings();
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
            this.require('update_status', this.options).toggleStatus(agentID, unassignTickets);
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
                status = ' Open tickets previously assigned to ';
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

        //functional_error
        functionalError: function(evt) {
            console.log(evt);
            switch(evt.location) {
                case 'setStatusPending': services.notify('Unable to look up pending tickets for ' + evt.agent.name + '. This agent may not be an assignable agent.', 'error', 5000);
                    break;
                case 'setStatus': if(evt.errorCode == 403) {
                    services.notify('Permissions error while updating status for ' + evt.agent.name + '. Please make sure you are allowed to update their user profile.', 'error', 5000);
                }
            }
        },

        //network_error
        networkError: function(evt) {
            console.log(evt);
        },
        
        //getAllAgents.fail
        //getSingleAgent.fail
        renderRetry: function() {
            if(this.renderRetries < 0){
                this.trigger("render_app");
            }
            this.renderRetries++;
        }
    };
}());
