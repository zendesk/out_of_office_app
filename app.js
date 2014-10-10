(function() {

    return {

        defaultState: 'loading',
        triggerTitle: 'out-of-office app trigger',
        userFieldName: 'Agent Out?',
        userFieldKey: 'agent_ooo',

        events: require('events'), //magic happens here

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
            tagUnassignedTickets: false,
            unassignTag: 'reasign_ooo',

            preventAssignOOO: true,
        },

        //app.init, installed_app
        init: function(app) {
            this.switchTo('loading');            

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
            var that = this;
            if(this.options.confirmChange) {
                var modal = this.require('popmodal');
                this.ajax('getSingleAgent', agentID).done(function(agent) {
                    agent = agent.user;
                    var message = that.changeStatusMessage(agent.name).unavailable;
                    if(agent.user_fields.agent_ooo) {
                        message = that.changeStatusMessage(agent.name).available;

                    }
                    modal(message, function(input) { 
                        var unassignTickets = that.options.unassignTickets;
                        if(input.length === 1) {
                            if(input[0].checked === true) {
                                unassignTickets = true;
                            }
                        }                        

                        that.trigger("toggle_status", {agentID: agentID, unassignTickets: unassignTickets});

                    });
                });
            } else {
                this.trigger("toggle_status", {agentID: agentID, unassignTickets: that.options.unassignTickets});
            }
        },

        //toggle_status
        updateStatus: function(evt) {
            var agentID = evt.agentID;
            var unassignTickets = evt.unassignTickets;
            var that = this;
            this.require('update_status', this.options).
                toggleStatus(agentID, unassignTickets).done(function(agentID) {
            }).fail(function() {
                that.trigger("render_app");
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

        //ticket.save
        verifyAssign: function() {
            var that = this;
            var asignee = this.ticket().assignee().user();


            return this.promise(function(done, fail) {
                that.ajax('getSingleAgent', asignee.id()).done(function(agent) {
                    agent = agent.user;
                    if(that.options.preventAssignOOO) {
                        if(agent.user_fields[that.options.userFieldKey]) {
                            that.notifyAssign(agent.name);
                            fail();
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
    };

}());
