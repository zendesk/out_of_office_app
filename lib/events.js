module.exports = {
    // App
    'loaded_settings': function(evt) {this.options = evt.settings; this.render();}, //app is installed, moving on
    'click .status-toggle': function(evt) {evt.preventDefault();this.verifyChange(evt);},
    'toggle_status': function(agentID) {this.updateStatus(agentID);},
    'ticket.save': function() {this.lockRender = true; return this.require('ui', this.options).renderSave();},    //run the save hook, but keep the UI locked to prevent the assignee from flickering due to lotus bug
    'ticket.submit.always': function() {var that = this; setTimeout(function() {that.lockRender = false;}, 500);}, //this will unlock rendering 500ms after the ticket has been saved. 
                                                                                                                   //Tweak the value if you see froze/incorrect results in the ticket sidebar
    // Render
    'render_app': function() {this.render();},
    'app.created': function(){this.lockRender = false;this.init();this.render();}, //unlock rendering since we are starting fresh
    'app.activated': function() {this.lockRender = false;this.render();},
    'pane.activated': function() {this.lockRender = false;this.render();},
    'ticket.assignee.user.id.changed': function() {this.render();},
    'ticket.assignee.group.id.changed': function() {this.render();},
    'keyup #filter_search': function(evt) {evt.preventDefault();this.require('ui', this.options).renderFilter();}, //user typing in filter box
    'click .srt_header': function(evt) {evt.preventDefault();this.require('ui', this.options).toggleSort(evt.currentTarget);}, //user clicking on sort headers

    // Notifications
    'tickets_tagged': function(evt) {this.notifyUnAssign(evt);},
    'status_changed': function(evt) {this.notifyStatus(evt);},
    'update_warning': function(evt) {this.warnStatus(evt);},
    
    //Success Handlers
    'createTrigger.done': function() {this.notifyInstalled("trigger");},
    'createUserField.done': function() {this.notifyInstalled("user_field");},

    //Failure Handlers
    'getAllAgents.fail': function() {this.renderRetry();},
    'getSingleAgent.fail': function() {this.renderRetry();},
    'functional_error': function(evt) {this.functionalError(evt);},
    'network_error': function(evt) {this.networkError(evt);},
    
    //reset failure count if able to get agent info
    'getAllAgents.done': function() {this.renderRetries = 0;},
    'getSingleAgent.done': function() {this.renderRetries = 0;},
    
};

