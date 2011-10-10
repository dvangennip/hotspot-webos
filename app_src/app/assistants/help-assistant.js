function HelpAssistant(args) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	
	// reference to StageAssistant instance
	this.currentStageControl = args;
}

HelpAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
	
	// Setup application menu
	this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
	
	// Setup command menu
	this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
           menuClass: 'no-fade'
        }, StageAssistant.cmdMenuModel);
    
	// accommodate wider tablet screens
	currentStageControl.adjustForTablet(this);
	
	// Set title
	this.controller.get('main_header_title').update(Mojo.Controller.appInfo.title);
	this.controller.get('version_info').update('<em>' + $L('Version ') + Mojo.Controller.appInfo.version + ' (BETA)</em>');
};

HelpAssistant.prototype.activate = function(event) {
	StageAssistant.helpOpen = true;
};

HelpAssistant.prototype.deactivate = function(event) {};

HelpAssistant.prototype.cleanup = function(event) {
	StageAssistant.helpOpen = false;
};