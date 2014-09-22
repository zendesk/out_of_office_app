//Private, module only utilities go in var utility - they will be pulled into
//the functions but won't be accessible to code that requires the module
var util = {
    version: '.03',
    
    changeStatus: function(message, userID) {
        util.popModal(message, function() {
            util.userStatus.toggleStatus(userID);
            if(util.appFramework.$('.option input').is(':checked')){
                util.userStatus.unassignAll(userID);
            }
        });
    }
};

module.exports = {
    
    factory: function(context) { 
        util.appFramework = context;
        util.userStatus = context.require('update_status');
        util.popModal = context.require('popmodal');
        return {
            confirmAgentStatus: this.confirmAgentStatus,
            saveHook: this.saveHook
        };
    },

    confirmAgentStatus: function(userID) { 
        this.ajax('getSingleAgent', userID).done(function(user) {
            var message = util.appFramework.changeStatusMessage(user.user);            
            if(user.user.user_fields.agent_ooo === false) {
                util.changeStatus(message.available, userID);
            } else {
                util.changeStatus(message.unavailable, userID);
            }
        });
    },
    
    saveHook: function() {
        var asignee = util.appFramework.ticket().assignee().user();
        return this.promise(function(done, fail) {
            if(asignee == 'undefined') {
                done();
            } else {
                this.ajax('getSingleAgent', assignee.id()).done(function(user) {
                    if(user.user.user_fields.agent_ooo === false) {
                        done();
                    } else {
                        var message = util.appFramework.saveHookMessage(user.user.id);
                        var fail = function() {fail()};
                        util.popModal(message, fail, fail);
                    }
                });
            }
        });
    }
};

