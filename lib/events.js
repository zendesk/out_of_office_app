module.exports = {
    // App
    'app.activated': function(data) {this.init(data)},
    'pane.activated': function(data) {this.init(data)},
    'pane.deactivated': function(data) {this.init(data)},
    'ticket.assignee.user.id.changed': function(data) {this.init(data)},

    // UI
    'click .set-status': function(evt) {evt.preventDefault(); this.ui().modal.confirmAgentStatus(evt.currentTarget.value)},
    'click .status-toggle': function(evt) {this.ui().modal.toggleStatus(evt.currentTarget.value)},
    'ticket.save': function() {return this.ui().modal.saveHook},    
    'keyup #filter_search': function(evt) {evt.preventDefault(); this.ui().filterAgents(evt)},
    'click .srt_header': function(evt) {evt.preventDefault(); this.ui().toggleSort(evt)},
};

