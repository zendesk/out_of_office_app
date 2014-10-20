module.exports = {
    // App
    'app.created': function(){this.init();this.render();},
    'app.activated': function() {this.render();},
    'ticket.submit.start': function() {this.options.lockRender = true;},        //locks the rendering while ticket submissionis happening because assignee.id may be incorrect
    'pane.activated': function() {this.render();},
    'ticket.assignee.user.id.changed': function(data) {this.render();},
    'ticket.assignee.group.id.changed': function(data) {this.render();},
    'loaded_settings': function(settings) {this.createSettings(settings);},
    'toggle_status': function(agentID) {this.updateStatus(agentID);},

    // UI
    'created_requirements': function(evt){this.notifyInstalled();},
    'render_app': function() {this.render();},
    'unassigned_ooo': function(evt) {this.notifyUnAssign(evt);},
    'status_changed': function(evt) {this.notifyStatus(evt);},
    'status_error': function(evt) { this.notifyFail(evt);},
    'click .set-status': function(evt) {evt.preventDefault();},
    'click .status-toggle': function(evt) {this.verifyChange(evt);},
    
    'ticket.save': function() {return this.verifyAssign();},

    'keyup #filter_search': function(evt) {evt.preventDefault(); this.require('ui', this.settings).filterAgents(evt);},
    'click .srt_header': function(evt) {this.require('ui', this.settings).toggleSort(evt);},
};

