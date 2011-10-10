Why this app? The Dutch National Railways (NS) has begun to introduce free internet in their trains. A customer should connect to the TMOBILE WiFi network after which an introduction page should be shown. For webOS devices this introduction page is not shown, hence this app comes to the rescue.

###Usage
Just connect to the hotspot as usual. Your device will notify that a captive portal has been detected. This notification can be ignored. Instead open this app, wait a few moments for the gateway IP address(es) to appear, and press the green button. If all is well you will be taken to the introduction page where you can proceed as usual.

When you experience difficulties it may be that your normal 3G gateway IP address was selected instead. Manually select another address by tapping the gateway IP address field (a list will appear) and try again. It may help to put your device in Aeroplane mode first to avoid such issues (your phone network connection will be turned off as well as the 3G connection). When connected, disable Aeroplane mode to restore a working phone connection.

###Installation
One way is to get the source code and use the SDK tools to package it and then install it onto your webOS device. A bit cumbersome if you just want to use it. There is a simpler way using a custom feed in [Preware](http://www.preware.org/). Open Preware and via its applicatie menu select *Manage Feeds*. Scroll to the bottom and add a new feed:

* Name: sinds1984
* URL: http://project.sinds1984.nl/appfeed
* Is compressed: YES

Click on *Add Feed* and leave this screen. Preware will ask to refresh all feeds. The easiest way to find the app is to search for 'ns hotspot'. When it shows up install as usual. There is one dependancy: the Homebrew JS Service Framework of Jason Robitaille has be installed first. Look in Preware for installed Linux Applications. If you happen to use an app like Internalz via Preware then you're fine (it uses the same framework).

###License
Source code is available under a MIT style license, so you are free to do with it as you desire. It would be kind (but not necessary) to let me know. Of course NS and T-Mobile are names belonging to their respective owners.

###Some coding notes
It is a Mojo framework-based application and should work with webOS 2.0+ (Node.js services were not available in webOS 1).

To my knowledge webOS has no simple API call to get the gateway IP address. Therefore a Node.js-based background service is used (as is usual on webOS 2+) to fetch results from the Linux *route -n* command. This command is not supported for third-party apps, hence the regular jailed Node.js environment has to be circumvened, now using the Homebrew run-js-framework. See the pm-script files and the service D-BUS file for specifics.

####Changelog

#####0.9.4
* Gateway info resets upon WiFi status refresh.
* First try at auto-logout (unsuccessful).

#####0.9.3
* Changed way of selecting preferred gateway (10.x.x.x preferred).

#####0.9.2
* Selecting last gateway in list by default, added explanations.

#####0.9.1
* Adding post install script to enable better service access.

#####0.9.0
* First release, including TouchPad compatibility.

####Issues

* There may be an issue when a 3G gateway interferes with the data the app receives. Enable Aeroplane mode temporarily when connecting to circumvene the issue.