module.exports = function() {
    
    var fetch_data = this.require('fetch_data');
    var update_status = this.require('update_status');
    var install_app = this.require('install_app');
    var app_tray = this.require('app_tray');
    var navbar = this.require('navbar');
    var modal_ui = this.require('modal_ui');
    
    //none of the functions are commonjs aware yet, so rebuild the original function layout
    
    //fetch_data
    this._paginate = fetch_data._paginate;
    this.fetchAllUsers = fetch_data.fetchAllUsers;
    this.checkInstalled = fetch_data.checkInstalled;

    //update_status
    this.toggleStatus = update_status.toggleStatus;  
    this.unassignAll = update_status.unassignAll;
    this.toggleTrigger = update_status.toggleTrigger; 

    //install_app
    this.installApp = install_app.installApp;
    this.addSetting = install_app.addSetting;

    //app_tray
    this.renderUser = app_tray.renderUser;
    this.renderTicket = app_tray.renderTicket;

    //navbar
    this.filterAgents = navbar.filterAgents;
    this.renderNavBar = navbar.renderNavBar;
    this.renderFilter = navbar.renderFilter;
    this.toggleSort = navbar.toggleSort;
     
    //modal_ui
    this.popModal = modal_ui.popModal;
    this.confirmAgentStatus = modal_ui.confirmAgentStatus;
    this.warnOnSave = modal_ui.warnOnSave;
    this.onModalAccept = modal_ui.onModalAccept;
    this.onModalCancel = modal_ui.onModalCancel;

};
