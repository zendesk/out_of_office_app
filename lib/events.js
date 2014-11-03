module.exports = {
    // App
    'app.created': function(){this.init();this.render();},
    'app.activated': function() {this.render();},
    'pane.activated': function() {this.render();},
    'ticket.assignee.user.id.changed': function(data) {this.render();},
    'ticket.assignee.group.id.changed': function(data) {this.render();},
    'ticket.submit.always': function() {this.renderHook();},
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

    //Failure Handlers
    'getAllAgents.fail': function() {this.notifyError("get list of agents.");},
    'getSingleAgent.fail': function() {this.notifyError("get agent profile.");},
    'url.fail': function() {this.notifyError("load URL.");},
    'setAgentStatus.fail': function() {this.notifyError("set agent status.");},
    'getTriggerData.fail': function() {this.notifyError("get trigger settings.");},
    'modifyTrigger.fail': function() {this.notifyError("update trigger.");},
    'unassignMany.fail': function() {this.notifyError("unassign all tickets.");},
    'ticketPreview.fail': function() {this.notifyError("get list of assigned tickets.");},
    'getSingleTicket.fail': function() {this.notifyError("get ticket data.");},
    'createTrigger.fail': function() {this.notifyError("create app trigger.");},
    'createUserField.fail': function() {this.notifyError("create user field.");},
    'getInstalledApps.fail': function() {this.notifyError("get list of installed apps.");},
    
    //reset failure count if able to get agent info
    'getAllAgents.done': function() {this.renderRetries = 0;},
    'getSingleAgent.done': function() {this.renderRetries = 0;},
    
};

