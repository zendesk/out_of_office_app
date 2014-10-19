module.exports = {
    // App
    'app.created': function(){this.init();},
    'app.activated': function() {this.render();},
    'pane.activated': function() {this.render();},
    'ticket.assignee.user.id.changed': function(data) {this.init(data); return this.verifyAssign(data);},
    'ticket.assignee.group.id.changed': function(data) {this.init(data); return this.verifyAssign(data);},
    'loaded_settings': function(settings) {this.createSettings(settings);},
    'toggle_status': function(agentID) {this.updateStatus(agentID);},

    // UI
    'created_requirements': function(evt){this.notifyInstalled(evt);},
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

