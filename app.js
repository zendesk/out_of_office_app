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
                        content: '<p>This action will mark ' + name + ' as available and allow tickets to be assigned.</p>',
                        confirm: '<p style="color: white; background-color: #79a21d; border-color: #79a21d; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Available</p>',        
                        cancel:  'Cancel'
                    },
                    unavailable: {
                        header:  'Please confirm status change',
                        content: '<p>This action will mark ' + name + ' as unavailable and prevet tickets from being assigned to them.</p>',
                        confirm: '<p style="color: white; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Unavailable</p>',
                        cancel:  'Cancel',
                        options: '<input type="checkbox" name="reassign_current" /> Unassign All Open Tickets?'
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

            var ui = this.require('ui', this.options);
            
            // verifyAssign - start
            var that = this;
            if (this.ticket().assignee().user() === undefined && this.ticket().assignee().group() === undefined) {
                console.log('User && Group ID undefined');
                return true;

            } else if (this.ticket().assignee().user() === undefined && this.ticket().assignee().group() !== undefined) { 
                console.log('No agent assigned - assigning to Group: ' + this.ticket().assignee().group().name()); 
                console.log('else if');
                ui.renderTicket();
                return true;

            } else if (this.ticket().assignee().user() !== undefined && this.ticket().assignee().group() !== undefined) { // there is an Assignee & a group
                var asignee = this.ticket().assignee().user();
                console.log('else');

                return this.promise(function(done, fail) { 
                    // PROMISE - start
                    console.log('[PROMISE] - start');

                    that.ajax('getSingleAgent', asignee.id()).done(function(agent) { 
                        // that.ajax - start
                        agent = agent.user;

                        if (that.options.preventAssignOOO) { 
                            // IF - 1 - start
                            if (agent.user_fields[that.options.userFieldKey] && this.currentLocation() == 'ticket_sidebar' && this.currentLocation() !== 'new_ticket_sidebar') {
                                // IF - 2 - start
                                console.log('[PROMISE] - IF - if');
                                console.log('ticket_sidebar');
                                console.log('OOO Agent updates permitted on existing tickets');
                                services.notify('Warning: ' + agent.name + ' is out of office. If this request requires immediate attention please re-assign to a different agent who is not out of office', 'alert', 5000);
                                done();
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
                                ui.renderTicket();
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