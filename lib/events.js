this.require = require('context_loader')(this);
this.init = this.require('load_modules');

module.exports = {
    // App
    'app.activated': this.init(data),
    'pane.activated': this.init(data),
    'pane.deactivated': 'renderUser',
    'ticket.assignee.user.id.changed': 'renderTicket',

    // UI
    'click .modalAccept': 'onModalAccept',
    'click .modalCancel': 'onModalCancel',
    'click .set-status': 'toggleStatus',
    'click .status-toggle': 'confirmAgentStatus',
    'keyup #filter_search': 'filterAgents',
    'ticket.save': 'warnOnSave',
    'click .srt_header': 'toggleSort'
};

