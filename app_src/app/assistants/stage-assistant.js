function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

/**
 * this function is for setup tasks that have to happen when the stage is first created.
 */
StageAssistant.prototype.setup = function() {
    // free as in 'a square has four sides to choose from'
    this.controller.setWindowOrientation('free');
    
    // set locale if possible
    if (Mojo.Locale.getCurrentFormatRegion() === 'nl') {
	Mojo.Locale.set('nl_nl');	
    }
    // push the first scene, including a reference to this stage controller
    this.controller.pushScene({name: 'connect'}, this);
};

//
//  MENU AND COMMAND HANDLERS ETC. GO HERE
//

/**
 * Handles commands that have bubbled up throught the command chain.
 * Commands that are not handled within a scene are caught here.
 */
StageAssistant.prototype.handleCommand = function(event) {
    var currentStageControl = Mojo.Controller.appController.getActiveStageController();
    var currentScene = this.controller.activeScene();
    //Mojo.Log.info("*** event.type: " + event.type + ", command: " + event.command);
    
    // handle command menu taps
    if (event.type === Mojo.Event.command) {
	switch(event.command)
	{	
	    case 'do-appConnect':
		if (!StageAssistant.connectOpen) {
		    this.controller.swapScene({'name': 'connect', transition: Mojo.Transition.crossFade}, this);
		}
	    break;
	    case 'do-appHelp':
		StageAssistant.cmdMenuModel.items[1].toggleCmd = 'do-appHelp';
		if (!StageAssistant.helpOpen) {
		    this.controller.swapScene({'name': 'help', transition: Mojo.Transition.crossFade}, this);
		}
	    break;
	    default:
		Mojo.Log.error("Got command " + event.command);
	    break;
	}
    }
};

//
// FUNCTIONS GO BELOW HERE
//

/**
 * Function requests connectivity status.
 * NOTE: function return asynchronously, only to with a parameter to callback function.
 *
 * @return Boolean: true if connected via WiFi, false if not
 */
StageAssistant.prototype.getConnectivityStatus = function(callback) {
	
    var currentScene = this.controller.activeScene();
	
    // check connectivity
    var connectivityRequest = currentScene.serviceRequest('palm://com.palm.connectionmanager', {
        method: 'getstatus',
        parameters: {
	    subscribe: true // we will be notified in case of changes
        },
        onSuccess: function (response) {
            var hasWiFiConnection = false;
            
            // set global object to received object
            StageAssistant.wifiObject = response.wifi;
            //Mojo.Log.info("*** "+ JSON.stringify(StageAssistant.wifiObject) );
	    
	    // use: onInternet: 'yes' | 'no' | 'captivePortal'
	    // the isInternetConnectionAvailable variable would be false for captive portals
	    // if we have internet
            if ((response.wifi.onInternet !== 'on') && (response.wifi.state === "connected")) {
		hasWiFiConnection = true;
            }
	    
	    // callback with status and wifi object
	    if (callback) {
		callback( hasWiFiConnection );
	    }
        }.bind(this),
        onFailure: function(response) {
            // reset global wifi object
            StageAssistant.wifiObject = StageAssistant.wifiObjectDefault;
	    
            if (callback) {
		callback(false); // no connectivity determined
	    }
        }.bind(this)
    });
};

StageAssistant.prototype.getGateways = function (callback) {
    Mojo.Log.info("*** getting gateways...");
    var currentScene = this.controller.activeScene();
	
    // get gateway table
    var tableRequest = currentScene.serviceRequest('palm://nl.sinds1984.hotspot.service/', {
        method: 'route',
        parameters: {},
        onSuccess: function (response) {
	    Mojo.Log.info("*** got gateway table");
	    var i, j = 0, gatewayArray = [];
	    
	    // when there is no error get the gateway addresses from the response table
	    if (!response.error) {
		for (i = 0; i < response.table.length; i++) {
		    Mojo.Log.info(JSON.stringify(response.table[i]));
		    if (response.table[i].flags.toLowerCase().indexOf('g') !== -1 && response.table[i].iface.toLowerCase().indexOf('eth') !== -1) {
			// it is a WiFi gateway so add it
			gatewayArray[j] = {};
			gatewayArray[j].value = response.table[i].gateway;
			gatewayArray[j].label = response.table[i].gateway;
			j++;
		    }
		}
	    }
	    
	    // set gatewayArray to global variable
	    this.filterDuplicatesFromArray(gatewayArray); // operates on input, no return
	    StageAssistant.gateways = gatewayArray;
	    
	    if (callback) {
		callback(true);
	    }
        }.bind(this),
        onFailure: function(response) {
            Mojo.Log.error("*** no luck getting gateway table: "+response.message);
	    // set gateways global variable to empty
	    StageAssistant.gateways = [];
	    
            if (callback) {
		callback(false, response.message);
	    }
        }.bind(this)
    });
};

StageAssistant.prototype.resetGateways = function () {
    StageAssistant.gateways = [];
};

/**
 * Function receives a gateway array and deletes any duplicate entries in it.
 * Manipulations are done on the input array itself, not a copy.
 * Therefore this function does not return anything.
 */
StageAssistant.prototype.filterDuplicatesFromArray = function (inputArray) {
    
    var i, j;
    
    // go from highest index to lowest, otherwise it ends prematurely
    // due to the array getting shortened by removals
    for (i = inputArray.length-1; i >= 0; i--) {
	// should it be removed? yes if available at lower index
	for (j = inputArray.length-1; j > i; j--) {
	    if (inputArray[j].value == inputArray[i].value) {
		inputArray.splice(j,1);
	    }
	}
    }
};

/**
 * NOTE: IPv4 only for now
 *
 * @param ipAsString An IP address as string, e.g. '192.168.1.12'
 * @return Array of integer values, e.g. [ 192, 168, 1, 12 ]
 */
StageAssistant.prototype.convertIPStringToArray = function(ipAsString) {
	// split string on dots, returns array of strings
	var i, ipArray = ipAsString.split('.');
	
	// convert each string element to integer
	for (i = 0; i < ipArray.length; i++) {
		ipArray[i] = parseInt(ipArray[i], 10); // base 10
	}
	
	return ipArray;
};

/**
 * Converts e.g. [10,12,13,14] to '10.12.13.14' and returns the string
 */
StageAssistant.prototype.convertIPArrayToString = function(ipAsArray) {
	var i, returnIP = '';
	
	// loop over each element and add to string
	for (i = 0; i < ipAsArray.length; i++) {
		// add dot in front of number, but not for first element
		if (i !== 0) {
			returnIP += '.';
		}
		// add integer
		returnIP += ipAsArray[i];
	}
	
	return returnIP;
};

/**
 * @return String IP value of destination address
 */
StageAssistant.prototype.getDestinationIP = function(inputIP) {
	
	var destIP,
	    sourceIP = this.convertIPStringToArray( inputIP );
	
	// when current connection is to a TMOBILE hotspot adjust the IP
	if (StageAssistant.wifiObject.ssid.toLowerCase().indexOf('tmobile') !== -1) {
	    // base array of destination IP
	    destIP = [10, 161, 0, 0]; // 0's to be adjusted
	    
	    // manipulate ip array to become correct gateway
	    // depends on the last integer
	    if ( sourceIP[3] === 1) {
		    // nn
		    destIP[2] = sourceIP[2];
		    destIP[3] = 182;
	    } else if ( sourceIP[3] === 129) {
		    // nn+1
		    destIP[2] = sourceIP[2] + 1;
		    destIP[3] = 54;
	    }
	} else {
	    // just use the source IP
	    destIP = sourceIP;
	}
	
	// return converted to string
	return this.convertIPArrayToString( destIP );
};

/**
 * Function calls Mojo service to launch webbrowser.
 *
 * @param addressToOpen Wellformed URL as string variable.
 */
StageAssistant.prototype.openBrowser = function(addressToOpen) {
	
    var currentScene = this.controller.activeScene();
    
    // open browser
    currentScene.serviceRequest('palm://com.palm.applicationManager', {
        method: 'open',
        parameters: {
	        id: "com.palm.app.browser",
	        params: {
	              target: addressToOpen
	        }
        }
    });
    
    // TODO close this app?
    //this.controller.window.close(); // this should be currentScene
};

/**
 * Function adds 'tablet' classes if the device is a tablet
 * Essentially the header gets adjusted if it has the correct id's
 * and content that is wrapped within a container with id 'content_wrapper'
 * gets its width maximized at 510px, similar to single pane Enyo views.
 */
StageAssistant.prototype.adjustForTablet = function(sceneRef) {
	if (StageAssistant.isTablet) {
		sceneRef.controller.get('body-connect').addClassName('tablet');
		sceneRef.controller.get('the_header').className = '';
		sceneRef.controller.get('the_header').addClassName('palm-page-header-tablet');
		sceneRef.controller.get('the_header_wrapper').className = '';
		sceneRef.controller.get('the_header_wrapper').addClassName('palm-page-header-wrapper-tablet');
		sceneRef.controller.get('content_wrapper').addClassName('tablet');
	}
};

//
// MODELS GO BELOW HERE
//

StageAssistant.appMenuAttr = {omitDefaultItems: true};

StageAssistant.appMenuModel = {
        visible: true,
        items: [ 
		//Mojo.Menu.editItem,
		{ label: $L('Help'), command: 'do-appHelp', disabled: false }
        ]
};

StageAssistant.cmdMenuModel = {
	items:	[
		{visible: false, disabled: true},
		{label: $L('Views'), toggleCmd:'do-appConnect', items: [
			{icon: 'connect-scene', command:'do-appConnect'},
			{icon: 'help-scene', command:'do-appHelp'}
			]
		},
		{visible: false, disabled: true}
		]
};

//
// VARIABLES BELOW HERE
//

StageAssistant.connectOpen = false;

StageAssistant.helpOpen = false;

/**
 * Variable is true if device is a tablet
 * Works by using a function that executes once upon launch to set the variable.
 */
StageAssistant.isTablet = (function() {
	//Mojo.Log.info("****** name: "+Mojo.Environment.DeviceInfo.modelName);
	//Mojo.Log.info("*** version: "+Mojo.Environment.DeviceInfo.platformVersionMajor);
	//Mojo.Log.info("** keyboard: "+Mojo.Environment.DeviceInfo.keyboardAvailable);
	// decision is for now based on webOS version number (touchpad is on v3, smartphones v1 or v2)
	if (Mojo.Environment.DeviceInfo.platformVersionMajor < 3) {
		return false;
	} else {
		return true;
	}
})();

/**
 * Variable is true if WiFi is available on the device
 * Wrapped in function to avoid issue with emulator returning false (hampers development)
 */
StageAssistant.deviceHasWifi = (function() {
	//Mojo.Log.info(JSON.stringify(Mojo.Environment.DeviceInfo));
	if (Mojo.Environment.DeviceInfo.wifiAvailable) {
		return true;
	} else if (Mojo.Environment.DeviceInfo.modelName.toLowerCase().indexOf('emulator') !== -1) {
		return true;
	} else if (Mojo.Environment.DeviceInfo.modelName.toLowerCase().indexOf('device') !== -1) {
		return true;
	} else {
		return false;
	}
})();

/**
 * Global object that equals a connectionmanager service request's response.wifi object
 * NOTE: actual response.wifi object has more variables then shown here or documented in SDK (?)
 */
StageAssistant.wifiObject = {
	bssid: '',
	ssid: '',
	ipAddress: '',
	ipIntegerArray: [ 0, 0, 0, 0 ], // IPv4 only (limited by webOS to IPv4 anyway)
	state: 'disconnected', // 'connected' || 'disconnected'
	networkConfidenceLevel: 'none' // connection strength, e.g. none | low | average | excellent
};

/**
 * Default values for previous object for easy restoring to default, disconnected state.
 */
StageAssistant.wifiObjectDefault = {
	bssid: '',
	ssid: '',
	ipAddress: '',
	ipIntegerArray: [ 0, 0, 0, 0 ],
	state: 'disconnected',
	networkConfidenceLevel: 'none'
};

/**
 * Global variable that holds the currently available gateway information
 * Dummy object: { label: '192.168.2.1', value: '192.168.2.1' }
 */
StageAssistant.gateways = [];