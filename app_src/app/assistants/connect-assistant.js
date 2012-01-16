function ConnectAssistant(args) {
	// reference to StageAssistant instance
	currentStageControl = args;
}

ConnectAssistant.prototype.setup = function () {
	
	this.connectIcon = this.controller.get('connect_wifi_icon');
	this.connectTitle = this.controller.get('connect_wifi_title');
	this.responseText = this.controller.get('response_message');
	this.responseText.hide();
	
	// Setup application menu
	this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttr, StageAssistant.appMenuModel);
	
	// accommodate wider tablet screens
	currentStageControl.adjustForTablet(this);
	
	// Setup command menu
	this.controller.setupWidget(Mojo.Menu.commandMenu, this.attributes = {
           menuClass: 'no-fade'
        }, StageAssistant.cmdMenuModel);
	
	// Set title
	this.controller.get('main_header_title').update(Mojo.Controller.appInfo.title);
	
	// Setup gateway selector  
	this.gatewayModel = {
	    choices: StageAssistant.gateways,
	    value: '',
	    disabled: true
	};
	this.controller.setupWidget('gateway_selector',
		this.attributes = {
			label: $L('Gateway')
		},
		this.gatewayModel
	);
	
	// setup open hotspot button
	this.openButtonModel = {
		buttonLabel : $L('Open hotspot launchpage'),
		buttonClass : 'affirmative',
		disabled : true
	};
	this.openButtonAttr = {
		//type : 'Activity'		
	};
	this.controller.setupWidget('open_hotspot_button',this.openButtonAttr,this.openButtonModel);
	    
	// event handlers
	this.gatewaySelector = this.controller.get('gateway_selector');
	this.gatewayChangeBinder = this.handleGatewayChange.bind(this);
	Mojo.Event.listen(this.gatewaySelector, Mojo.Event.propertyChange, this.gatewayChangeBinder);
	this.handleOpenButtonBinder = this.handleOpenButton.bind(this);
	Mojo.Event.listen(this.controller.get('open_hotspot_button'), Mojo.Event.tap, this.handleOpenButtonBinder);
};

ConnectAssistant.prototype.activate = function (event) {
	// event listeners
	Mojo.Event.listen(this.gatewaySelector, Mojo.Event.propertyChange, this.gatewayChangeBinder);
	Mojo.Event.listen(this.controller.get('open_hotspot_button'), Mojo.Event.tap, this.handleOpenButtonBinder);
	
	StageAssistant.connectOpen = true;
	
	// start getting the wifi status
	this.getWifiStatus();
};

ConnectAssistant.prototype.deactivate = function (event) {
	// event listeners
	Mojo.Event.stopListening(this.gatewaySelector, Mojo.Event.propertyChange, this.gatewayChangeBinder);
	Mojo.Event.stopListening(this.controller.get('open_hotspot_button'), Mojo.Event.tap, this.handleOpenButtonBinder);
};

ConnectAssistant.prototype.cleanup = function (event) {	
	// event listeners
	Mojo.Event.stopListening(this.gatewaySelector, Mojo.Event.propertyChange, this.gatewayChangeBinder);
	Mojo.Event.stopListening(this.controller.get('open_hotspot_button'), Mojo.Event.tap, this.handleOpenButtonBinder);
	StageAssistant.connectOpen = false;
};

//
// EVENT HANDLERS GO BELOW HERE
//

ConnectAssistant.prototype.handleGatewayChange = function (event) {
	// set destination IP based on event.value;
};

ConnectAssistant.prototype.handleOpenButton = function (event) {
	
	// get the URL based on the currently selected gateway
	var launchPageURL = 'http://' + currentStageControl.getDestinationIP(this.gatewayModel.value);
	Mojo.Log.info("*** url: "+ launchPageURL);
	// open webpage
	currentStageControl.openBrowser( launchPageURL );
};

//
// FUNCTIONS GO BELOW HERE
//

ConnectAssistant.prototype.getWifiStatus = function () {
	
	// first check if there is wifi available
	if (StageAssistant.deviceHasWifi) {
		// ask for current status
		currentStageControl.getConnectivityStatus( this.updateWifiStatus.bind(this) ); // arg is callback
	} else {
		// give error message
		this.connectIcon.className = 'title'; // reset
		this.connectIcon.addClassName('error');
		this.connectTitle.update( $L('Device supports no WiFi') );
	}
};

ConnectAssistant.prototype.updateWifiStatus = function (success) {
	Mojo.Log.info("update Wifi status: "+success);
	
	if (!success) {
		// set wifi status to not connected (default style)
		this.connectIcon.className = 'title';
		// update SSID label
		this.connectTitle.update( $L('Connect to WiFi hotspot') );
		
		// also reset gateway info (e.g. when user was connected but is no longer)
		currentStageControl.resetGateways();
		this.updateGatewayInfo(false, 'disconnected');
	} else {
		// set wifi status to connected
		this.connectIcon.className = 'title';
		// webOS 1.x does not give network connection quality
		// test for existence of variable
		if (StageAssistant.wifiObject.networkConfidenceLevel !== undefined) {
			// when available just communicate actual value
			this.connectIcon.addClassName(StageAssistant.wifiObject.networkConfidenceLevel);
		} else {
			// so show at least some connection as it is available
			this.connectIcon.addClassName('fair');
		}
		// update SSID label
		this.connectTitle.update( $L('Connected to ') + StageAssistant.wifiObject.ssid );
		
		// get the gateway route table so we can choose one from there later on
		currentStageControl.getGateways( this.updateGatewayInfo.bind(this) ); // arg is callback
	}
};

ConnectAssistant.prototype.updateGatewayInfo = function (success, optionalMessage) {
	
    var i;
    
    // set new information
    this.gatewayModel.choices = StageAssistant.gateways;
    
    if (!success || this.gatewayModel.choices.length === 0) {
	// disable models
	this.gatewayModel.disabled = true;
	this.openButtonModel.disabled = true;
	// reset value
	this.gatewayModel.value = '';
	
	// set response message
	if (optionalMessage === 'disconnected') {
		// not an error, so show no message
		this.responseText.hide();
	} else {
		this.responseText.update( $L('Problem getting a gateway') + '<br/>' + optionalMessage);
		this.responseText.show();
	}
    } else {
	// pick one gateway as the default
	// prefer a gateway IP that starts with 10.x.x.x
	for (i = 0; i < this.gatewayModel.choices.length-1; i++) {
	    if ( this.gatewayModel.choices[i].value.match(/^10\./) !== null ) {
		// just exit as we have found a preferred gateway
		break;
	    }
	}
	// if no preferred gateway is found, i will be equal to the last one in the array
	this.gatewayModel.value = this.gatewayModel.choices[i].value;
	
	// enable models
	this.gatewayModel.disabled = false;
	this.openButtonModel.disabled = false;
	// hide response message if it was shown
	this.responseText.hide();
    }
    
    // update widget models
    this.controller.modelChanged(this.gatewayModel);
    this.controller.modelChanged(this.openButtonModel);
};

// this.webview_widget.mojo.setNetworkInterface(this.ifNameToUse); // 'eth0'
// Host: www.nstrein.ns.nl