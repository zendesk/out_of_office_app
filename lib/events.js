module.exports = {
    // App
    'app.activated': function(data) {this.init(data)},
    'pane.activated': function(data) {this.init(data)},
    'ticket.assignee.user.id.changed': function(data) {this.init(data)},
    'loaded_settings': function(settings) {this.createSettings(settings)},
    'toggle_status': function(agentID) {this.updateStatus(agentID)},

    // UI
    'render_app': function() {this.render()},
    'status_changed': function(evt) {console.log(evt);this.notifyStatus(evt)},
    'click .set-status': function(evt) {evt.preventDefault(); },
    'click .status-toggle': function(evt) {console.log(evt);this.verifyChange(evt)},
    'ticket.save': function() {},    
    'keyup #filter_search': function(evt) {this.require('ui', this.settings).filterAgents(evt)},
    'click .srt_header': function(evt) {this.require('ui', this.settings).toggleSort(evt)},
};

