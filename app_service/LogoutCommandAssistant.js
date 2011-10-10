var libraries = MojoLoader.require({ name: "foundations", version: "1.0" });
var http = IMPORTS.require("http");

/**
 * Service requests webpage at the address <logout.>
 * According to NS / T-Mobile info this is enough to log out from their hotspot.
 * 
 * Can be tested via CLI: luna-send -P -n 1 palm://nl.sinds1984.hotspot.service/logout '{}'
 */
var LogoutCommandAssistant = function () {};

LogoutCommandAssistant.prototype = {
    
    future: undefined,
    
    // we start here in the process
    run: function (future) {
        //console.log("***** LogoutCommand"); //+ this.controller.args.name
        
        this.future = future;
        this.doLogout(function (response) {
            this.future.result = {
                "error": response.error,
                "message": response.text,
                "status_code": response.code
            };
        }.bind(this));
    },
    
    // performs a HTTP GET request and returns whether it was successful
    doLogout: function (callback) {
        
        var logout = http.createClient(80, 'www.sinds1984.nl');
        var request = logout.request(
            'GET',
            '/',
            {'host': 'www.sinds1984.nl'}
        );
        
        // set event handlers
        request.on('response', function (response) {
             // call function with data
            callback({
                error: false,
                text: 'success',
                code: response.statusCode
            });
        });
        // no clue whether error event is supported in NodeJS 0.2.3
        request.on('error', function (response) {
             // call function with error data
            callback({
                error: true,
                text: response.message,
                code: response.statusCode
            });
        });
        
        // finish request (makes more sense after setting event handlers?)
        request.end();
    }
};