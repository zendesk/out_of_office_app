(function() {

    return {

        defaultState: 'loading',
        triggerTitle: 'out-of-office app trigger',
        userFieldName: 'Agent Out?',
        userFieldKey: 'agent_ooo',

        events: require('events'), //magic happens here

        requests: require('requests'),


        settings: {
            installed: false,
            installationID: undefined,
            
            createTrigger: false,            
            triggerTitle: 'out-of-office app trigger',
            triggerID: undefined,

            userFieldName: 'Agent Out?',
            userFieldKey: 'agent_ooo',
            
            confirmChange: false,

            unassignTickets:false,            
            tagUnassignedTickets: false,
            unassignTag: 'reasign_ooo',

            preventAssignOOO: false,
        },




        //app.init, installed_app
        init: function(app) {
            this.require = require('context_loader')(this);
            var install = this.require('install_app', this.settings);
            install.loadSettings();
        },

        //loaded_settings
        createSettings: function(settings) {
            this.settings = settings;
            this.trigger("render_app");
        },
        

        //render_app
        render: function() {
            var ui = this.require('ui', this.settings);
            if (this.currentLocation() == 'nav_bar') {
                console.log('navbar');
                ui.renderNavBar(); //side effect
            } else if (this.currentLocation() == 'user_sidebar') {
                ui.renderUser(); //side effect
            } else if (this.currentLocation() == 'ticket_sidebar' || this.currentLocation() == 'new_ticket_sidebar') {
                ui.renderTicket();
            }            
        },
        

        //click .set-status
        verifyChange: function(evt) {
            console.log('hello');
            var agentID = evt.currentTarget.value;
            if(this.settings.confirmChange) {
                var modal = this.require('modal_ui', this.settings);
                modal.popModal(this.settings.changeStatusMessage, ["status_toggle", agentID], ["status_cancel"]);
            } else {
                this.trigger("toggle_status", agentID);
            }
        },
        
        //toggle_status
        updateStatus: function(agentID) {
            console.log(agentID);
            console.log('toggleStatus');
            var that = this;
            this.require('update_status', this.settings).
                toggleStatus(agentID).done(function(status) {
                that.trigger('status_changed', status, agentID);
            });
        },


        //status_changed
        notifyStatus: function(status, name) {
            services.notify("Updated status for " + name + " to " + status + ".");
        },
        
        //unassigned_ooo
        notifyUnAssign: function(evt) {
            services.notify("Unassigned " + evt.count + " tickets assigned to " + evt.name + ".");
        },
        
        //assigned_ooo
        notifyAssign: function(name) {
            services.notify("Ticket assigned to " + name + " who is out of the office.");
        },

        //ticket.save
        verifyAssign: function() {
            var that = this;
            var asignee = this.ticket().asignee().user();

            return this.promise(function(done, fail) {
                that.ajax('getSingleAgent', asignee.id()).done(function(agent) {
                    if(that.settings.preventAssignOOO) {
                        if(agent[that.settings.userFieldKey]) {
                            that.notifyAssign(agent.name);
                            fail();
                        } else {
                            done();
                        }
                    } else {
                        if(agent[that.settings.userFieldKey]) {
                            that.notifyAssign(agent.name);
                        }
                        done();
                    }
                });
            });
        },
    
        changeStatusMessage: function(user) {
            return { 
                available: {
                    header:  'Please confirm status change',
                    content: '<p>This action will mark ' + user.name + ' as available and allow tickets to be assigned.</p>',
                    confirm: '<p style="color: white; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Available</p>',        
                    cancel:  'Cancel'
                },
                unavailable: {
                    header:  'Please confirm status change',
                    content: '<p>This action will reassign ' + user.name + '&#39;s open tickets and change their status to away.</p>',
                    confirm: '<p style="color: white; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Unavailable</p>',
                    cancel:  'Cancel',
                    options: '<input type="checkbox" name="reassign_current" /> Unassign All Open Tickets?'
                },
            };

        },

        saveHookMessage: function(user) {
            return {
                header:  'Assignee is Unavailable',
                content: '<p>The assignee you have selected: ' + user.name + ' is currently marked as unavailable and cannot have tickets assigned to them.',
                confirm: '<a href="#/users/' + user.id + '">Go to Agent Profile</a>',
                cancel:  '<p style="color: white; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Cancel</p>', 
            };
        },
    };

}());
