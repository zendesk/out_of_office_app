(function() {

    return {

        events: require('events'),

        requests: {},

        options:  {
            requirementsCreated: false,
            installationID: undefined,
            createTrigger: true,
            tagPending: true,
            userFieldKey: 'agent_ooo',
            confirmChange: true,
            unassignTickets: false,
            preventAssignOOO: true,
        },

        lockRender: false, //this is used to prevent the UI from rendering twice due to Lotus bug #885042
        renderRetries: 0,  //in some instances we will retry a failed network request, this tracks that to limit it to a few retries      

        //app.created
        init: function(app) {     
            this.switchTo('loading');
            this.require = require('context_loader')(this);            //this is a helper for passing context between common.js modules
            this.require('install_app', this.options).loadSettings();  //on app creation, check to make sure requirements are present, load settings into memory
        },

        //app.activated
        //pane.activated
        //render_app
        //ticket.assignee.user.id.changed
        //ticket.assignee.group.id.changed
        render: function(evt) {                         //most render paths here will update the current status from the server - this is the primary method used to update the UI when an agent's status has changed
            var ui = this.require('ui', this.options);  //load in the ui.js module which owns most of the methods which access the DOM
            if(!this.lockRender) {                          //check to see if rendering is prevented
                if (this.currentLocation() == 'nav_bar') {
                    ui.renderNavBar();                  
                } else if (this.currentLocation() == 'user_sidebar') {
                    ui.renderUser(); 
                } else if (this.currentLocation() == 'ticket_sidebar' || this.currentLocation() == 'new_ticket_sidebar') {
                    ui.renderTicket();
                } 
            } 
        },

        //click .status-toggle
        verifyChange: function(evt) {                     
            var agentID = evt.currentTarget.value;      //this is set in the button html/template and will be the ID of the agent being modified
            var ui = this.require('ui', this.options);  //load ui.js module
            var that = this;                            //clunky - TODO: refactor
            if(this.options.confirmChange) {            //these options will be loaded in on app.created from the installation settings
                ui.renderStatusModal(agentID);          //this uses the UI method to generate a modal to confirm the agent status change
            } else {
                this.trigger("toggle_status", {agentID: agentID, unassignTickets: that.options.unassignTickets}); //trigger a change of status
            }               //most functions in app.js are on an event hook - while the various modules could call them directly, 
                            //in some instances this makes keeping things encapsulated easier
                            //could just call this.render() here, but being consistent about how things are accessed...
                            //would be interesting to go back and see if this organization method actually helps or not - too late to change it now really
        },

        //toggle_status
        updateStatus: function(evt) {
            var agentID = evt.agentID;           
            var unassignTickets = evt.unassignTickets;  //agent ID and prefrence on whether to unasign open tickets will be passed in
            this.require('update_status', this.options).toggleStatus(agentID, unassignTickets); //here we directly call in a function from the update_status.js module - this will handle the actual server-side change as well as tagging all tickets
        },

            // The following is not used in the OOO app due to other apps modal collision issues and will be saved for use in a future release
            // saveWarningButton: warning = '<p style="margin-top: 16px; margin-bottom: 10px; margin-left: 60px; font-weight: bold; font-size: 14px;">AGENT UNAVAILABLE</p><p class="btn" style="width: 250px; font-weight: bold; font-size: 14px; margin-bottom: 16px; padding-top: 10px; padding-bottom: 10px;" onclick="$(\'button.status-toggle\').trigger(\'click\');">Update ' + agent.name + '\'s status</p>';

        saveFailMessage: function() {   //this is located here to format messaging that may be used in either ui.js or further down in app.js
            var failMessage = this.I18n.t('saveFailMessage');
            return '<p style="margin-top: 16px; margin-bottom: 10px; text-align: center; font-weight: bold; font-size: 20px;">' + failMessage + '</p>';
        },

        saveWarningMessage: function(name) {  //TODO: rework current strings to use placeholders instead of concatenation
            var warnStatus  = this.I18n.t('saveWarningMessage.status'),
                warnMessage = this.I18n.t('saveWarningMessage.message');
            return '<p style="margin-top: 16px; margin-bottom: 10px; text-align: center; font-size: 14px;"><strong>' + name + '</strong> is <strong>' + warnStatus + '</strong><br/></p><p style="margin-top: 12px; margin-bottom: 6px; text-align: center; font-size: 14px;">' + warnMessage + '</p>';
        },

        changeStatusMessage: function(name, unassignTickets) { //this generates an object which conforms to the definition needed by popmodal.js
            var availableHeader             =   this.I18n.t('changeStatusMessage.available.header'),
                availableContentFirst       =   this.I18n.t('changeStatusMessage.available.content.first'),
                availableContentSecond      =   this.I18n.t('changeStatusMessage.available.content.second'),
                availableConfirm            =   this.I18n.t('changeStatusMessage.available.confirm'),
                availableCancel             =   this.I18n.t('changeStatusMessage.available.cancel'),
                unavailableHeader           =   this.I18n.t('changeStatusMessage.unavailable.header'),
                unavailableContentFirst     =   this.I18n.t('changeStatusMessage.unavailable.content.first'),
                unavailableContentSecond    =   this.I18n.t('changeStatusMessage.unavailable.content.second'),
                unavailableConfirm          =   this.I18n.t('changeStatusMessage.unavailable.confirm'),
                unavailableCancel           =   this.I18n.t('changeStatusMessage.unavailable.cancel'),
                checkboxText                =   this.I18n.t('changeStatusMessage.checkbox');

            var checkbox = '<p style="font-family: proxima-nova, sans-serif;"><label><input type="checkbox" name="reassign_current" /><span id="foo">' + checkboxText + '</span></label></p>';
            if (unassignTickets === true) {  // **NOTE** checkbox CHECKED = checkbox HIDDEN ; unassignTickets option TRUE = checkbox HIDDEN
                checkbox = undefined; //if the checkbox is undefined it will not show up in the modal
            }
            if (!this.options.preventAssignOOO) { //slightly different verbage if we aren't going to prevent you from assigning tickets
                unavailableContentSecond    =   this.I18n.t('changeStatusMessage.unavailable.content.secondA');
                availableContentSecond      =   this.I18n.t('changeStatusMessage.available.content.secondA');
            }
            return {
                available: {
                    header:  availableHeader,
                    content: '<p>' + availableContentFirst + '<strong>' + name + '</strong>' + availableContentSecond + '</p>',
                    confirm: '<p style="color: white; font-family: proxima-nova, sans-serif; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">' + availableConfirm + '</p>',        
                    cancel:  availableCancel
                },
                unavailable: {
                    header:  unavailableHeader,
                    content: '<p>' + unavailableContentFirst + '<strong>' + name + '</strong>' + unavailableContentSecond + '</p>',
                    confirm: '<p style="color: white; font-family: proxima-nova, sans-serif; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom:8px">' + unavailableConfirm + '</p>',
                    cancel:  unavailableCancel,
                    options: checkbox
                }
            };
        },

        //status_changed                //TODO: unify status/sysem warnings into less functions
        notifyStatus: function(evt) {   //this generates the services.notify messages when an agent's status is updated
            var status = this.I18n.t('notify.status.available');        
            var tags = this.I18n.t('notify.status.tags.removed');
            if(evt.agent.user_fields[this.options.userFieldKey]) { //there are several options for what might be notified about
                status = this.I18n.t('notify.status.unavailable'); //this sets the message to warn that the agent is being set to unavailable
                tags = this.I18n.t('notify.status.tags.added');
            } 
            var statusMessage = '<p>' + evt.agent.name + this.I18n.t('notify.status.statusMessage') + status + '</p>'; //this message is used to confirm that the tickets are updated
            var tagsMessage = '<p>' + this.I18n.t('notify.status.tagsMessage.one') + evt.agent.name + this.I18n.t('notify.status.tagsMessage.two') + tags + '</p>';
            services.notify(statusMessage + tagsMessage, 'alert', 12000); //actually send the message
            this.trigger("render_app"); //since the agent's status will have changed, this calls .render() and causes the UI to be updated
        },

        //tickets_tagged
        notifyUnAssign: function(evt) { //the name here is a bit of a misnomer now - while it is fired when open tickets are tagged and then unassigned,
            var action = this.I18n.t('notify.unassign.default.action'); //it is also used when pending/on-hold tickets are tagged
            var status = this.I18n.t('notify.unassign.default.status');
            if(evt.ticketView == 'pendingTickets') {
                status = this.I18n.t('notify.unassign.pendingTickets.status');
            } else if(evt.ticketView == 'ticketPreview') {
                action = this.I18n.t('notify.unassign.ticketPreview.action');
                status = this.I18n.t('notify.unassign.ticketPreview.status');
            }
            services.notify(action + evt.count + status + evt.name + ".", 'alert', 12000);
            this.trigger("render_app");
        },


        //update_warning
        warnStatus: function(evt) { //this will show a warning if a ticket is saved and the agent assigned is out of office
            if(evt.agent.user_fields[this.options.userFieldKey]) {
                services.notify(this.saveWarningMessage(evt.agent.name), 'alert', 12000);
            }
        },

        //createTrigger.done
        //createUserField.done
        notifyInstalled: function(item) { //this notifys when the required triggers/fields are created
            switch(item) {
                case 'trigger': services.notify(this.I18n.t('notify.installed.trigger'), 'alert');
                    break;
                case 'user_field': services.notify(this.I18n.t('notify.installed.user_field'), 'alert');
                    break;
            }
        },

        //functional_error
        functionalError: function(evt) { //functional_error events are fired throughought the app when something is interrupted or a request fails. 
            console.log(evt);            //we've made an effort to attach useful debugging information to those events - they show up in the console and may be helpful if errors to occur
            switch(evt.location) {       //this also allows us to catch *expected* errors and give a slightly more helpful message
                case 'applyTag': services.notify(this.I18n.t('functionalError.setStatusPending.one') + evt.agent.name + this.I18n.t('functionalError.setStatusPending.two'), 'error', 5000);
                    break;
                case 'setStatus': if(evt.errorCode == 403) {
                    services.notify(this.I18n.t('functionalError.setStatus.one') + evt.agent.name + this.I18n.t('functionalError.setStatus.two'), 'error', 5000);
                }
            }
        },

        //network_error
        networkError: function(evt) {  //network errors (failures of ajax requests) are fired as well, with more low-level debugging information
            console.log(evt);          //between functional_error and network_error the goal is to expose parts of the app state that might be helpful for debugging
        },
        
        //getAllAgents.fail
        //getSingleAgent.fail
        renderRetry: function() {       //in some limited situations, we might be able to recover from a failed network request.
            if(this.renderRetries < 0){     //this will retry the events that are typically used in .render() once in case the network error was just a transient failure
                this.trigger("render_app");
            }
            this.renderRetries++;
        }
    };
}());
