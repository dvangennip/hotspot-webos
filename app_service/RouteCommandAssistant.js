var libraries = MojoLoader.require({ name: "foundations", version: "1.0" });
var exec = IMPORTS.require("child_process").exec;

/**
 * Service request a kernel route table from the system and returns the table
 * as a JS array with each Object therein being one row from the table.
 * 
 * Can be tested via CLI: luna-send -P -n 1 palm://nl.sinds1984.hotspot.service/route '{}'
 * or: /media/cryptofs/apps/usr/palm/services# /var/usr/bin/run-homebrew-js-service nl.sinds1984.hotspot.service
 *
 * NOTE: needs to be run as root - use Homebrew JS Service Framework by Jason Robitaille
 */
var RouteCommandAssistant = function () {};

RouteCommandAssistant.prototype = {
    
    future: undefined,
    
    // we start here in the process
    run: function (future) {
        //console.log("***** RouteCommand"); //+ this.controller.args.name
        
        this.future = future;
        this.getRouteTable(function (response) {
            this.future.result = {
                "error": response.error,
                "message": response.text,
                "table": response.table
            };
        }.bind(this));
    },
    
    /**
     * Its purpose is to execute a shell command from within the service
     * and return its results
     * NOTE: asynchronous function!
     */
    getRouteTable: function (callback) {

        // uses route command to generate a kernel route table
        exec("route -n",
            {                           // Options object
                encoding: 'utf8',
                timeout: 0,
                maxBuffer: 200*1024,
                killSignal: 'SIGTERM', // was SIGKILL
                cwd: null,
                env: null
            },
            function (error, stdout, stderr) {      // callback function
                if (error !== null) {
                    //console.log("*** STDERR: "+stderr);
                    // call function with error data
                    callback({
                        error: true,
                        text: stderr,
                        table: []
                    });
                } else {
                    // get data parsed and respond
                    //console.log("*** STDOUT: "+stdout);
                    
                    var myTable = this.parseRouteTable(stdout); //stdout;
                    // call function with fresh table
                    callback({
                        error: false,
                        text: 'Route fetched successfully',
                        table: myTable
                    });
                }
            }.bind(this)
        );
    },

    /**
     * Example data (shows that first two lines are just headers):
     * 
     * Kernel IP routing table
     * Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
     * 10.12.22.88     0.0.0.0         255.255.255.252 U     0      0        0 rmnet0
     * 10.0.2.0        0.0.0.0         255.255.255.0   U     0      0        0 eth0
     * 0.0.0.0         10.0.2.2        0.0.0.0         UG    0      0        0 eth0
     * 0.0.0.0         10.0.2.2        0.0.0.0         UG    30     0        0 eth0
     *
     * rmnet0 is for EDGE / 3G
     * eth0 is for ethernet: wired and WiFi (wlan0 may show up for different devices?)
     */
    parseRouteTable: function (rawtable) {
        
        var i, raw = rawtable, routetable = [];
        
        // manipulate raw data first
        raw = raw.replace(/\n/g, ",").split(","); // each row is now an element
        
        // put per row data into object (if there is indeed regular data)
        if (raw.length >= 3) {
            // skip first two lines (just headers)
            for (i = 2; i < raw.length-1; i++) {
                // split row into elements
                raw[i] = raw[i].replace(/\s+/g, ",").split(",");
                
                // place into variables
                routetable[i-2] = {};
                routetable[i-2].destination = raw[i][0]; // '0.0.0.0'
                routetable[i-2].gateway = raw[i][1]; //'10.0.2.2';
                routetable[i-2].genmask = raw[i][2]; //'0.0.0.0';
                routetable[i-2].flags = raw[i][3]; // 'UG';
                routetable[i-2].metric = parseInt(raw[i][4], 10); // 0;
                routetable[i-2].ref = parseInt(raw[i][5], 10); // 0;
                routetable[i-2].use = parseInt(raw[i][6], 10); // 0;
                routetable[i-2].iface = raw[i][7]; // 'eth0';
            }
        }
        
        return routetable;
    }
};