(function() {

    return {

        events: require('events'),

        requests: require('requests'),

        options:  {
            appTitle: 'ooo_app',
            installed: false,
            installationID: undefined,

            createTrigger: true,            
            triggerTitle: 'out-of-office app trigger',
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
                        confirm: '<p style="color: white; font-family: proxima-nova, sans-serif; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Unavailable</p>',
                        cancel:  'Cancel',
                        options: '<p style="font-family: proxima-nova, sans-serif;"><label><input type="checkbox" name="reassign_current" /><span id="foo">Unassign All Open Tickets</span></label></p>'
                    },
                };
            },
        },


        //app.created
        init: function(app) {
            this.switchTo('loading');

            this.require = require('context_loader')(this);

            console.log("Init: "+ this.currentLocation());

            if (this.currentLocation() != 'nav_bar') {
                console.log("Init: "+ this.currentLocation());

                this.require('install_app', this.options)();

            }

        },

        //loaded_settings
        createSettings: function(evt) {
            this.options = evt.settings;
            this.trigger("render_app");
        },


        //render_app
        render: function(evt) {

            console.log("Launch: "+ this.currentLocation());
            var ui = this.require('ui', this.options);
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


        //ticket.save
        //ticket.assignee.user.id.changed
        //ticket.assignee.group.id.changed
        verifyAssign: function(data) { 

            // EXISTING Tickets updated by the Requester while Assignee is OOO resets the Assignee field back to it's parent group and (notifies Requester)
            // NEW Tickets CAN NEVER be created with an Assignee that is OOO
            // EXISTING Tickets CAN be updated BY OTHER AGENTS while Assignee is marked as OOO with a warning
            // NEW OR EXISTING Tickets CAN be assigned to a group on creation/update without an Assignee as normal
            // NEW OR EXISTING Tickets CAN be assigned to an Assignee on creation/update (Barring role level custom permissions) as normal
            // Existing tickets not currently assigned to an OOO agent CAN NOT be assigned to them while they're OOO, unless the intended assignee is the current user even if current user is OOO
            // Desired Setting: "Allow existing tickets not assigned to an OOO agent to be re-assigned to an OOO agent if the OOO agent is the current user"
            // Known Issues - setting must be enabled for unassign all open tickets to work
            // Known Issues - you can assign a ticket to a group with a single agent if the agent is OOO - no deep check for this
            
            // verifyAssign - start
            var that = this;
            if (this.ticket().assignee().user() === undefined && this.ticket().assignee().group() === undefined) {
                console.log('User && Group ID undefined');

                return true;
            } else if (this.ticket().assignee().user() === undefined && this.ticket().assignee().group() !== undefined) { 
                console.log('No agent assigned - assigning to Group: ' + this.ticket().assignee().group().name()); 
                console.log('else if');

                return true;
            } else { // (this.ticket().assignee().user() !== undefined && this.ticket().assignee().group() !== undefined)
                console.log(this.ticket().assignee().user().id());
                var asignee = this.ticket().assignee().user();
                var ticket = this.ticket().id();
                console.log('else');

                return this.promise(function(done, fail) { 
                    // PROMISE - start
                    console.log('[PROMISE] - start');
                    console.log(data);

                    that.ajax('getSingleAgent', asignee.id()).done(function(agent) { 
                        // that.ajax - start
                        agent = agent.user;

                        if (that.options.preventAssignOOO) { 
                            // IF - 1 - start
                            if (agent.user_fields[that.options.userFieldKey] && this.currentLocation() == 'ticket_sidebar' && this.currentLocation() !== 'new_ticket_sidebar') {
                                    console.log("Ticket: " + ticket);
                                
                                that.ajax('getSingleTicket', that.ticket().id()).done(function(ticket) {
                                    if(ticket.ticket.assignee_id == asignee.id()) {
                                services.notify('Warning: ' + agent.name + ' is out of office. If this request requires immediate attention please re-assign to a different agent who is not out of office', 'alert', 5000);                                        
                                        done();
                                    } else {
                                services.notify('Warning: ' + agent.name + ' is out of office. Please select a valid assignee for the ticket.', 'alert', 5000);                         
                                        fail();
                                    }
                                });
                                // IF - 2 - start
                                console.log('[PROMISE] - IF - if');
                                console.log('ticket_sidebar');
                                console.log('OOO Agent updates permitted on existing tickets');
                                // IF - 2 - end
                            } else if (agent.user_fields[that.options.userFieldKey] && this.currentLocation() == 'new_ticket_sidebar') {
                                // ELSE IF - start
                                console.log('[PROMISE] - IF - else if');
                                console.log('new_ticket_sidebar');
                                console.log('because this is a NEW ticket = prevent save');
                                services.notify(agent.name + ' is out of office and new tickets cannot be assigned', 'error', 5000);
                                fail();
                                // ELSE IF - end
                            } else {
                                // ELSE - 2 start
                                console.log('[PROMISE] - IF - else');
                                done();
                                // ELSE - 2 end
                            }
                        } else { 
                            // IF - 1 - end
                            // ELSE - 1 - start
                            console.log('that.options.preventAssignOOO = FALSE');
                            if(agent[that.options.userFieldKey]) {
                                console.log('agent[that.options.userFieldKey] == TRUE');
                                that.notifyAssign(agent.name);
                            }
                            console.log('agent[that.options.userFieldKey] == FALSE');
                            done();
                            // ELSE - 1 - end
                        }
                        // that.ajax - end
                    });
                    // PROMISE - end
                });
            }
            // verifyAssign - end
        },

        //status_changed
        notifyStatus: function(evt) {
            var status = "available";
            if(evt.agent.user_fields.agent_ooo) {
                status = "unavailable";
            }
            services.notify("Updated status for " + evt.agent.name + " to " + status + ".");
        },

        //status_error
        notifyFail: function(evt) {
            services.notify("Unable to update status for " + evt.agent.name + ".", 'alert');
        },

        //loaded_settings
        notifyInstalled: function(evt) {
            services.notify("Detected first run of app. Created user field and trigger in account.", 'alert');
        },

        //unassigned_ooo
        notifyUnAssign: function(evt) {
            services.notify("Unassigned " + evt.count + " tickets previously assigned to " + evt.name + ".");
        },

        //assigned_ooo
        notifyAssign: function(name) {
            services.notify("Ticket assigned to " + name + " who is unavailable.", 'alert');
        }

    };

}());
