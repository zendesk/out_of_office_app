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
            var settings =  {
                installed: false,
                installationID: undefined,

                createTrigger: false,            
                triggerTitle: 'out-of-office app trigger',
                triggerID: undefined,

                userFieldName: 'Agent Out?',
                userFieldKey: 'agent_ooo',

                confirmChange: true,

                unassignTickets:false,            
                tagUnassignedTickets: false,
                unassignTag: 'reasign_ooo',

                preventAssignOOO: false,
            };
            this.require = require('context_loader')(this);
            var install = this.require('install_app', settings);
            install.loadSettings();
        },

        //loaded_settings
        createSettings: function(evt) {
            this.settings = evt.settings;
            this.trigger("render_app");
            this.trigger("ticket.save");

        },
        

        //render_app
        render: function() {
            var ui = this.require('ui', this.settings);
            if (this.currentLocation() == 'nav_bar') {
                ui.renderNavBar(); //side effect
            } else if (this.currentLocation() == 'user_sidebar') {
                ui.renderUser(); //side effect
            } else if (this.currentLocation() == 'ticket_sidebar' || this.currentLocation() == 'new_ticket_sidebar') {
                ui.renderTicket();
            }            
        },


        //click .set-status
        verifyChange: function(evt) {
            var agentID = evt.currentTarget.value;
            var that = this;
            if(this.settings.confirmChange) {
                var modal = this.require('popmodal');
                var that = this;                
                this.ajax('getSingleAgent', agentID).done(function(agent) {
                    agent = agent.user;
                    var message = that.changeStatusMessage(agent.name).unavailable;
                    if(agent.user_fields.agent_ooo) {
                        message = that.changeStatusMessage(agent.name).available;

                    }
                    modal(message, function(options) { 
                        console.log(unassignTickets);
                        console.log(options[0]);
                        var unassignTickets = that.settings.unassignTickets;
                        if(options[0] === "on") {
                            unassignTickets = true;
                        }

                        console.log(unassignTickets);
                        
                        that.trigger("toggle_status", {agentID: agentID, unassignTickets: unassignTickets});
                    });
                });
            } else {
                this.trigger("toggle_status", {agentID: agentID});
            }
        },

        //toggle_status
        updateStatus: function(evt) {
            var agentID = evt.agentID;
            console.log(evt.unassignTickets);
            var unassignTickets = evt.unassignTickets;
        console.log(unassignTickets);
            var that = this;
            this.require('update_status', this.settings).
                toggleStatus(agentID, unassignTickets).done(function(agentID) {
                //that.trigger('status_changed', {status: status, agentID: agentID});
            }).fail(function() {
            that.trigger("render_app");
                
            });
        },


        //status_changed
        notifyStatus: function(evt) {
            var status = "here"
            if(evt.agent.user_fields.agent_ooo) {
                status = "away";
            }
            services.notify("Updated status for " + evt.agent.name + " to " + status + ".");
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
    
        changeStatusMessage: function(name) {
            return { 
                available: {
                    header:  'Please confirm status change',
                    content: '<p>This action will mark ' + name + ' as available and allow tickets to be assigned.</p>',
                    confirm: '<p style="color: white; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Available</p>',        
                    cancel:  'Cancel'
                },
                unavailable: {
                    header:  'Please confirm status change',
                    content: '<p>This action will reassign ' + name + '&#39;s open tickets and change their status to away.</p>',
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
