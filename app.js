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
                        content: '<p>This action will mark ' + name + 'as unavailable and prevet tickets from being assigned to them.</p>',
                        confirm: '<p style="color: white; font-size: 100%; height: 100%; line-height: 200%; border-radius: 3px; padding-top: 8px; padding-bottom: 8px">Mark as Unavailable</p>',
                        cancel:  'Cancel',
                        options: '<input type="checkbox" name="reassign_current" /> Unassign All Open Tickets?'
                    },
                };
            },
        },

        //app.init, installed_app
        init: function(app) {
            this.switchTo('loading');

            console.log('[init] you are here: ' + this.currentLocation());

            if(app.firstLoad) {
                this.require = require('context_loader')(this);
                this.require('install_app', this.options)();
            } else {
                this.trigger("render_app");                
            }
        },

        //loaded_settings
        createSettings: function(evt) {
            this.options = evt.settings;
            this.trigger("render_app");
        },


        //render_app
        render: function() {
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
        verifyAssign: function() {
            var that = this;
            var asignee = this.ticket().assignee().user();

            var modal   = this.require('popmodal'),
                message = {
                            header: 'Please Confirm',
                            content: '<li>You are trying to update a ticket with an Assignee that\'s currently out of office</li><li>To remove the Assignee and/or Group on this ticket select below</li><li>If you want to keep the Assignee and Group simply click \'yes\'</li>',
                            confirm: 'Confirm',
                            cancel: 'Cancel',
                            options: '<div class="checkbox c1"><label><input type="checkbox">Remove Assignee</label></div>'
                          };

            return this.promise(function(done, fail) {
                that.ajax('getSingleAgent', asignee.id()).done(function(agent) {
                    agent = agent.user;

                    if(that.options.preventAssignOOO) {
                        if(agent.user_fields[that.options.userFieldKey]) {
                            that.notifyAssign(agent.name);

                            // [JEREMIAH - start] added modal for save hook if non-assignee agent updates ticket for OOO assignee

                            var confirm = function(options) {
                                    var ticket          = that.ticket(),
                                        currentGroup    = ticket.assignee().group().id(),
                                        currentAssigneeId = ticket.assignee().user().id(), // This is where I got stuck
                                        currentAssigneeName = ticket.assignee().user().name();

                                    console.log(ticket.id());
                                    console.log(currentGroup);
                                    console.log(currentAssigneeId);
                                    console.log(currentAssigneeName);

                                    // handle options [start]
                                    if (options[0].checked) {
                                        console.log('remove assignee - not really though');
                                        // This is where I got stuck
                                        ticket.assignee({ id: null }); // Doesn't work

                                        // AJAX at this point is overwritten by save hook resolving - won't work
                                        // What's been tried to null the assignee is: 
                                        // ticket.assignee({ id: null });
                                        // ticket.assignee().remove({ id: currentAssignee });
                                        // services.notify('Unassigned ticket from ' + currentAssigneeName);
                                        
                                        done();
                                        
                                    } else {
                                        console.log('keep assignee');
                                        done();
                                    }
                                    // handle options [end]
                                },
                                cancel  = function() {
                                    console.log('cancel'); 
                                    fail();
                                };
                            
                            modal(message, confirm, cancel);

                            // [JEREMIAH - start] added modal for save hook if non-assignee agent updates ticket for OOO assignee

                        } else {
                            done();
                        }
                    } else {
                        if(agent[that.options.userFieldKey]) {
                            that.notifyAssign(agent.name);
                        }
                        done();
                    }
                });
            });

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
        },
    };

}());
