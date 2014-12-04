module.exports = {
    // App
    'app.created': function(){this.options.lockRender = false;this.init();this.render();},
    'app.activated': function() {this.options.lockRender = false;this.render();},
    'pane.activated': function() {this.options.lockRender = false;this.render();},
    'ticket.assignee.user.id.changed': function(data) {this.render();},
    'ticket.assignee.group.id.changed': function(data) {this.render();},
    'ticket.save': function() {this.options.lockRender = true; return this.require('ui', this.options).renderSave();},    
    'ticket.submit.always': function() {var that = this; setTimeout(function() {that.options.lockRender = false;}, 500);},
    'loaded_settings': function(settings) {this.createSettings(settings);},
    'toggle_status': function(agentID) {this.updateStatus(agentID);},

    // UI
    'created_requirements': function(evt){this.notifyInstalled();},
    'render_app': function() {this.render();},
    'tickets_tagged': function(evt) {this.notifyUnAssign(evt);},
    'status_changed': function(evt) {this.notifyStatus(evt);},
    'update_warning': function(evt) {this.warnStatus(evt);},
    'status_error': function(evt) { this.notifyFail(evt);},
    'click .set-status': function(evt) {evt.preventDefault();},
    'click .status-toggle': function(evt) {this.verifyChange(evt);},
    'keyup #filter_search': function(evt) {evt.preventDefault(); this.require('ui', this.settings).filterAgents(evt);},
    'click .srt_header': function(evt) {this.require('ui', this.settings).toggleSort(evt);},
    
    //Success Handlers
    'createTrigger.done': function() {this.notifyInstalled("trigger.");},
    'createUserField.done': function() {this.notifyInstalled("user field.");},

    //Failure Handlers
    'getAllAgents.fail': function() {this.renderRetry();},
    'getSingleAgent.fail': function() {this.renderRetry();},
    'functional_error': function(evt) {this.functionalError(evt);},
    'network_error': function(evt) {this.networkError(evt);},
    
    //reset failure count if able to get agent info
    'getAllAgents.done': function() {this.renderRetries = 0;},
    'getSingleAgent.done': function() {this.renderRetries = 0;},
    
};

