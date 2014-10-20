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
                        confirm: '<p style="color: white; font-family: proxima-nova, sans-serif; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Unavailable</p>',
                        cancel:  'Cancel',
                        options: '<p style="font-family: proxima-nova, sans-serif;"><label><input type="checkbox" name="reassign_current" /><span id="foo">Unassign All Open Tickets</span></label></p>'
                    },
                };
            },
            lockRender: false
        },


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
            } else {
                this.options.lockRender = false; //prevent one update if the render status is locked, then unlock: fixes an issue where the ticket.assignee.user.id.changed event returns the wrong user
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
        verifyAssign: function(data) { 
            // verifyAssign - start
            var that = this;
            if (this.ticket().assignee().user() === undefined && this.ticket().assignee().group() === undefined) {

                return true;
            } else if (this.ticket().assignee().user() === undefined && this.ticket().assignee().group() !== undefined) { 

                return true;
            } else { // (this.ticket().assignee().user() !== undefined && this.ticket().assignee().group() !== undefined)
                var asignee = this.ticket().assignee().user();
                var ticket = this.ticket().id();

                return this.promise(function(done, fail) { 
                    // PROMISE - start

                    that.ajax('getSingleAgent', asignee.id()).done(function(agent) { 
                        // that.ajax - start
                        agent = agent.user;

                        if (that.options.preventAssignOOO) { 
                            // IF - 1 - start
                            if (agent.user_fields[that.options.userFieldKey] && this.currentLocation() == 'ticket_sidebar' && this.currentLocation() !== 'new_ticket_sidebar') {

                                that.ajax('getSingleTicket', that.ticket().id()).done(function(ticket) {
                                    if(ticket.ticket.assignee_id == asignee.id()) {
                                        services.notify('Warning: ' + agent.name + ' is out of office, if this request requires immediate attention please re-assign to a different agent who is not out of office', 'alert', 5000);
                                        done();
                                    } else {
                                        services.notify('Warning: ' + agent.name + ' is out of office, please select a valid assignee for the ticket', 'alert', 5000);                         
                                        fail();
                                    }
                                });
                                // IF - 2 - start
                                // IF - 2 - end
                            } else if (agent.user_fields[that.options.userFieldKey] && this.currentLocation() == 'new_ticket_sidebar') {
                                // ELSE IF - start
                                services.notify(agent.name + ' is out of office and new tickets cannot be assigned', 'error', 5000); 
                                fail();
                                // ELSE IF - end
                            } else {
                                // ELSE - 2 start
                                done();
                                // ELSE - 2 end
                            }
                        } else { 
                            // IF - 1 - end
                            // ELSE - 1 - start
                            if(agent[that.options.userFieldKey]) {
                                that.notifyAssign(agent.name);
                            }
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
            services.notify("Updated status for " + evt.agent.name + " to " + status);
        },

        //status_error
        notifyFail: function(evt) {
            services.notify("Unable to update status for " + evt.agent.name, 'alert');
        },

        //created_requirements
        notifyInstalled: function(evt) {
            services.notify("Detected first run of app. Created user field and trigger in account", 'alert');
        },

        //unassigned_ooo
        notifyUnAssign: function(evt) {
            services.notify("Unassigned " + evt.count + " tickets previously assigned to " + evt.name + ".");
        },

        //assigned_ooo
        notifyAssign: function(name) {
            services.notify("Ticket assigned to " + name + " who is unavailable", 'alert');
        }

    };

}());
