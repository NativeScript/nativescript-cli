mobile-cli-lib
==============

Provides an easy way for working with devices.
Contains common infrastructure for CLIs - mainly AppBuilder and NativeScript.

Installation
===

Latest version: 0.22.0

Release date: 2016, December 15

### System Requirements

Before installing the `mobile-cli-lib`, verify that your system meets the following requirements.

#### Windows Systems

**Minimum Software Requirements**

* Windows 7 or later
* .NET 4.0 or later
* Node.js
	* (Windows 7 systems): Node.js 0.10.26 or a later stable official release except 0.10.34<br/>A [known issue](https://github.com/joyent/node/issues/8894) prevents the `mobile-cli-lib` from working properly with Node.js 0.10.34.
	* (Windows 8 and later systems): Node.js 0.12.0 or a later stable official release<br/>A [known issue](https://github.com/SBoudrias/Inquirer.js/issues/235) in Inquirer.js prevents the interactive prompts from working properly in `cmd` shells on Windows 8 or later systems with Node.js 0.10.x.

**Additional Software Requirements for iOS On-Device Deployment**

* iTunes (latest official)
* Node.js

> The bitness of Node.js and iTunes must match.

**Additional Software Requirements for Android On-Device Deployment**

* Device drivers required by your system to recognize the connected Android device
* For testing in the native emulators
	* JDK 8 or later
	* Android SDK 19 or later
	* (Optional) Genymotion

**Additional Software Requirements for Windows Phone On-Device Deployment**

> In this version of the `mobile-cli-lib`, you cannot deploy and LiveSync to connected Windows Phone devices from the command line.

#### OS X Systems

**Minimum Software Requirements**

* OS X Mavericks
* Node.js 0.10.26 or a later stable official release except 0.10.34<br/>A [known issue](http://docs.telerik.com/platform/appbuilder/troubleshooting/known-issues/known-issues-cli-and-sp#the-appbuilder-command-line-interface-and-appbuilder-package-for-sublime-text-27-have-introduced-the-following-known-issues) prevents the `mobile-cli-lib` from working properly with Node.js 0.10.34.
* Mono 3.12 or later

**Additional Software Requirements for iOS On-Device Deployment**

* iTunes (latest official)
* For testing in the native emulator
	* Xcode 5 or later

**Additional Software Requirements for Android On-Device Deployment**

* Device drivers required by your system to recognize the connected Android device
* For testing in the native emulators
	* JDK 8 or later
	* Android SDK 19 or later
	* (Optional) Genymotion

**Additional Software Requirements for Windows Phone On-Device Deployment**

> In this version of the `mobile-cli-lib`, you cannot deploy and LiveSync to connected Windows Phone devices from the command line.

#### Linux Systems

**Minimum Software Requirements**

* Ubuntu 14.04 LTS<br/>The `mobile-cli-lib` is tested and verified to run on Ubuntu 14.04 LTS. You might be able to run the `mobile-cli-lib` on other Linux distributions.
* Node.js 0.10.26 or a later stable official release except 0.10.34<br/>A [known issue](http://docs.telerik.com/platform/appbuilder/troubleshooting/known-issues/known-issues-cli-and-sp#the-appbuilder-command-line-interface-and-appbuilder-package-for-sublime-text-27-have-introduced-the-following-known-issues) prevents the `mobile-cli-lib` from working properly with Node.js 0.10.34.

   > **TIP:** You can follow the instructions provided [here](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager) to install Node.js on your system.

* An Internet browser (latest official release)
* (64-bit systems) The runtime libraries for the ia32/i386 architecture
   * In the terminal, run the following command.

      ```
      sudo apt-get install lib32z1 lib32ncurses5 lib32bz2-1.0 libstdc++6:i386
      ```

**Additional Software Requirements for iOS On-Device Deployment**

> In this version of the `mobile-cli-lib`, you cannot deploy and LiveSync on connected iOS devices from the command line. You need to manually deploy the application package using iTunes.

**Additional Software Requirements for Android On-Device Deployment**

* Device drivers required by your system to recognize the connected Android device
* G++ compiler
   * In the terminal, run `sudo apt-get install g++`
* For testing in the native emulators
	* JDK 8 or later
	* Android SDK 19 or later
	* (Optional) Genymotion

**Additional Software Requirements for Windows Phone On-Device Deployment**

> In this version of the `mobile-cli-lib`, you cannot deploy and LiveSync to connected Windows Phone devices from the command line.

### Install the mobile-cli-lib

The `mobile-cli-lib` should be added as dependency in your project's `package.json`.

Usage
==

In order to use mobile-cli-lib, just add a reference to it in your package.json:
```JSON
dependencies: {
	"mobile-cli-lib": "0.4.0"
}
```

After that execute `npm install` in the directory, where your `package.json` is located. This command will install all your dependencies in `node_modules` directory. Now you are ready to use `mobile-cli-lib` in your project:

```JavaScript
var common = require("mobile-cli-lib");
common.fs.getFileSize("D:\\Work\\t.txt")
    .then(function (result) {
        console.log("File size is: " + result);
        return result;
    }, function (err) {
        console.log("Error happened:");
        console.log(err);
    });
```

### Sample application

You can find a sample application [here](https://gist.github.com/rosen-vladimirov/f9d9919ba9a413679af7). Just download the zip file and execute `npm install` in the project directory.
After that you can execute `node index.js` in your terminal. In case you have file `D:\Work\t.txt`, the application will show you its size. In case you do not have such file, the application will show an error.
You can change the filename in `index.js`.

Public API
==

This section contains information about each public method.

Device related public API, exposes `IDeviceInfo` data, that contains the following information:
```TypeScript
/**
 * Describes available information for a device.
 */
interface IDeviceInfo {
	/**
	 * Unique identifier of the device.
	 */
	identifier: string;

	/**
	 * The name of the device.
	 * For Android this is the value of device's 'ro.product.name' property.
	 * For iOS this is the value of device's 'DeviceName' property.
	 */
	displayName: string;

	/**
	 * Device model.
	 * For Android this is the value of device's 'ro.product.model' property.
	 * For iOS this is the value of device's 'ProductType' property.
	 */
	model: string;

	/**
	 * Version of the OS.
	 * For Android this is the value of device's 'ro.build.version.release' property.
	 * For iOS this is the value of device's 'ProductVersion' property.
	 */
	version: string;

	/**
	 * Vendor of the device.
	 * For Android this is the value of device's 'ro.product.brand' property.
	 * For iOS the value is always "Apple".
	 */
	vendor: string;

	/**
	 * Device's platform.
	 * Can be Android or iOS.
	 */
	platform: string;

	/**
	 * Status of device describing if you can work with this device or there's communication error.
	 * Can be Connected or Unreachable.
	 */
	status: string;

	/**
	 * Additional information for errors that prevents working with this device.
	 * It will be null when status is Connected.
	 */
	errorHelp: string;

	/**
	 * Defines if the device is tablet or not.
	 * For Android the value will be true when device's 'ro.build.characteristics' property contains "tablet" word or when the 'ro.build.version.release' is 3.x
	 * For iOS the value will be true when device's 'ProductType' property contains "ipad" word.
	 */
	isTablet: boolean;

	/**
	 * Optional property describing the color of the device.
	 * Available for iOS only - the value of device's 'DeviceColor' property.
	 */
	color?: string;

	/**
	 *  Optional property describing the architecture of the device
	 *  Available for iOS only - can be "armv7" or "arm64"
	 */
	activeArchitecture?: string;
}
```

### Module companionAppsService
> Stability 2 - Stable

`companionAppsService` gives access to companion apps identifiers.

* `getAllCompanionAppIdentifiers`: returns all companion app identifiers in a JSON object, where the top level keys are frameworks (cordova and nativescript) and inner keys are platforms (android, ios, wp8).
Sample usage:
```JavaScript
var companionAppIdentifiers = require("mobile-cli-lib").companionAppsService.getAllCompanionAppIdentifiers();
```
Result object is something like:
```JSON
{
	'cordova': {
		'android': 'android.cordova.companion.app.identifier',
		'ios': 'ios.cordova.companion.app.identifier',
		'wp8': 'wp8.cordova.companion.app.identifier'
	},
	'nativescript': {
		'android': 'android.nativescript.companion.app.identifier',
		'ios': 'ios.nativescript.companion.app.identifier',
		'wp8': null
	}
}
```

* `getCompanionAppIdentifier(framework: string, platform: string): string` - returns companion app identifier for specified framework and platform.
Sample usage:
```JavaScript
var companionAppIdentifiers = require("mobile-cli-lib").companionAppsService.getCompanionAppIdentifier("cordova", "android");
```

### Module deviceEmitter
> Stability 2 - Stable

`deviceEmitter` module is used to emit different events related to devices attached to the system.
You can use `deviceEmitter` to add handles for the following events:

* `deviceFound` - Raised when a new device is attached to the system. The callback function will receive one argument - deviceInfoData.
Sample usage:
```JavaScript
require("mobile-cli-lib").deviceEmitter.on("deviceFound",  function(deviceInfoData) {
	console.log("Found device with identifier: " + deviceInfoData.identifier);
});
```

* `deviceLost` - Raised when a device is detached from the system. The callback function will receive one argument - deviceInfoData.
Sample usage:
```JavaScript
require("mobile-cli-lib").deviceEmitter.on("deviceLost",  function(deviceInfoData) {
	console.log("Detached device with identifier: " + deviceInfoData.identifier);
});
```

* `deviceLogData` - Raised when attached device reports any information. This is the output of `adb logcat` for Android devices. For iOS this is the `iOS SysLog`.
The event is raised for any device that reports data. The callback function has two arguments - `deviceIdentifier` and `reportedData`. <br/><br/>
Sample usage:
```JavaScript
require("mobile-cli-lib").deviceEmitter.on("deviceLogData",  function(identifier, reportedData) {
	console.log("Device " + identifier + " reports: " + reportedData);
});
```

* `applicationInstalled` - Raised when application is installed on a device. The callback has two arguments - `deviceIdentifier` and `applicationIdentifier`. <br/><br/>
Sample usage:
```JavaScript
require("mobile-cli-lib").deviceEmitter.on("applicationInstalled",  function(identifier, applicationIdentifier) {
	console.log("Application " + applicationIdentifier  + " has been installed on device with id: " + identifier);
});
```

* `applicationUninstalled` - Raised when application is removed from device. The callback has two arguments - `deviceIdentifier` and `applicationIdentifier`. <br/><br/>
Sample usage:
```JavaScript
require("mobile-cli-lib").deviceEmitter.on("applicationUninstalled",  function(identifier, applicationIdentifier) {
	console.log("Application " + applicationIdentifier  + " has been uninstalled from device with id: " + identifier);
});
```

* `debuggableAppFound` - Raised when application on a device becomes available for debugging. The callback has one argument - `applicationInfo`. <br/><br/>
Sample usage:
```JavaScript
require("mobile-cli-lib").deviceEmitter.on("debuggableAppFound",  function(applicationInfo) {
	console.log("Application " + applicationInfo.appIdentifier  + " is available for debugging on device with id: " + applicationInfo.deviceIdentifier);
});
```
Sample result for `applicationInfo` will be:
```JSON
{
	"deviceIdentifier": "4df18f307d8a8f1b",
	"appIdentifier": "com.telerik.Fitness",
	"framework": "NativeScript",
	"title": "NativeScript Application"
}
```

* `debuggableAppLost` - Raised when application on a device is not available for debugging anymore. The callback has one argument - `applicationInfo`. <br/><br/>
Sample usage:
```JavaScript
require("mobile-cli-lib").deviceEmitter.on("debuggableAppLost",  function(applicationInfo) {
	console.log("Application " + applicationInfo.appIdentifier  + " is not available for debugging anymore on device with id: " + applicationInfo.deviceIdentifier);
});
```
Sample result for `applicationInfo` will be:
```JSON
{
	"deviceIdentifier": "4df18f307d8a8f1b",
	"appIdentifier": "com.telerik.Fitness",
	"framework": "NativeScript",
	"title": "NativeScript Application"
}
```

* `debuggableViewFound` - Raised when a new debuggable WebView is found. The callback has three arguments - `deviceIdentifier`, `appIdentifier` and `webViewInfo`.

Sample usage:
```JavaScript
require("mobile-cli-lib")
	.deviceEmitter.on("debuggableViewFound",  function(deviceIdentifier, appIdentifier, debuggableViewInfo) {
	console.log("On device " + deviceIdentifier + " the application " + appIdentifier  + " now has new WebView: " + debuggableViewInfo);
});
```
Sample result for `debuggableViewInfo` will be:
```JSON
{
	"description": "",
	"devtoolsFrontendUrl": "http://chrome-devtools-frontend.appspot.com/serve_rev/@211d45a5b74b06d12bb016f3c4d54095faf2646f/inspector.html?ws=127.0.0.1:53213/devtools/page/4050",
	"id": "4050",
	"title": "New tab",
	"type": "page",
	"url": "chrome-native://newtab/",
	"webSocketDebuggerUrl": "ws://127.0.0.1:53213/devtools/page/4050"
}
```

* `debuggableViewLost` - Raised when a debuggable WebView is lost. The callback has three arguments - `deviceIdentifier`, `appIdentifier` and `webViewInfo`.

Sample usage:
```JavaScript
require("mobile-cli-lib")
	.deviceEmitter.on("debuggableViewLost",  function(deviceIdentifier, appIdentifier, debuggableViewInfo) {
	console.log("On device " + deviceIdentifier + " the application " + appIdentifier  + " now cannot debug WebView: " + debuggableViewInfo);
});
```
Sample result for `debuggableViewInfo` will be:
```JSON
{
	"description": "",
	"devtoolsFrontendUrl": "http://chrome-devtools-frontend.appspot.com/serve_rev/@211d45a5b74b06d12bb016f3c4d54095faf2646f/inspector.html?ws=127.0.0.1:53213/devtools/page/4050",
	"id": "4050",
	"title": "New tab",
	"type": "page",
	"url": "chrome-native://newtab/",
	"webSocketDebuggerUrl": "ws://127.0.0.1:53213/devtools/page/4050"
}
```

* `debuggableViewChanged` - Raised when a property of debuggable WebView is changed, for example it's title. The callback has three arguments - `deviceIdentifier`, `appIdentifier` and `webViewInfo`.

Sample usage:
```JavaScript
require("mobile-cli-lib")
	.deviceEmitter.on("debuggableViewChanged",  function(deviceIdentifier, appIdentifier, debuggableViewInfo) {
	console.log("On device " + deviceIdentifier + " the application " + appIdentifier  + " has changes in WebView: " + debuggableViewInfo);
});
```
Sample result for `debuggableViewInfo` will be:
```JSON
{
	"description": "",
	"devtoolsFrontendUrl": "http://chrome-devtools-frontend.appspot.com/serve_rev/@211d45a5b74b06d12bb016f3c4d54095faf2646f/inspector.html?ws=127.0.0.1:53213/devtools/page/4050",
	"id": "4050",
	"title": "New tab 2",
	"type": "page",
	"url": "chrome-native://newtab/",
	"webSocketDebuggerUrl": "ws://127.0.0.1:53213/devtools/page/4050"
}
```

* `companionAppInstalled` - Raised when application is removed from device. The callback has two arguments - `deviceIdentifier` and `framwork`. <br/><br/>
Sample usage:
```JavaScript
require("mobile-cli-lib").deviceEmitter.on("companionAppInstalled",  function(identifier, framwework) {
	console.log("Companion app for " + framework  + " has been installed on device with id: " + identifier);
});
```

* `companionAppUninstalled` - Raised when application is removed from device. The callback has two arguments - `deviceIdentifier` and `framwork`. <br/><br/>
Sample usage:
```JavaScript
require("mobile-cli-lib").deviceEmitter.on("companionAppUninstalled",  function(identifier, framwework) {
	console.log("Companion app for " + framework  + " has been uninstalled from device with id: " + identifier);
});
```

### Module devicesService
> Stability: 2 - Stable

This module allows interaction with devices. You can get a list of the attached devices or deploy on specific devices.

* `getDevices()` - This function returns array of all connected devices. For each of them the following information is provided:
Sample usage:
```JavaScript
var devices = require("mobile-cli-lib").devicesService.getDevices();
devices.forEach(function(device) {
	console.log("Device " + device.identifier + " is connected.");
});
```

* `deployOnDevices(deviceIdentifiers: string[], packageFile: string, appId: string, projectName: string)` - Deploys the specified package to the specified devices.
Returns array of Promises. Each of them will be rejected in case the file cannot be deployed on the device or in case there's no device with such identifier.
The function accepts three arguments:
	* `deviceIdentifiers` - array of the unique identifiers of the devices where the application will be deployed.
	* `packageFile` - path to the specified package (`.apk` or `.ipa`);
	* `appId` - the identifier of the package. This corresponds to id from `package.json`.
	* `projectName` - the project name, this is usually the dir name of the project

Sample usage:
```JavaScript
Promise.all(require("mobile-cli-lib")
				.devicesService
				.deployOnDevices(["129604ab96a4d0053023b4bf5b288cf34a9ed5fa", "153544fa45f4a5646543b5bf1b221fe31a8fa6bc"], "./app.ipa", "com.telerik.testApp", "Test App"))
			.then(function(data) {
				console.log(data);
			}, function(err) {
				console.log(err);
			});
```

* `setLogLevel(logLevel: string, deviceIdentifier?: string)` - Sets the logging level for device(s) to `INFO` or `FULL`.
The method has two parameters, only the first one is mandatory. When only `logLevel` is passed, it's value is used for all currently connected devices and all devices that will be connected in the future.
By default the logging level is set to `INFO`. For example when there are two devices attached and this method is called in the following way:
```JavaScript
require("mobile-cli-lib").devicesService.setLogLevel("FULL");
```
Everything that the devices report will be raised in `deviceEmitter.deviceLogData` event. When a new device is attached, all of the information that it reports will also be send.
When the `deviceIdentifier` is passed, the value of the log level will be used only for this device. For example when all devices report all of their logs (`FULL`) level, you may call:
```JavaScript
require("mobile-cli-lib").devicesService.setLogLevel("INFO", "129604ab96a4d0053023b4bf5b288cf34a9ed5fa");
```
This will set the logging level to `INFO` only for device with identifier `129604ab96a4d0053023b4bf5b288cf34a9ed5fa`.


* `isAppInstalledOnDevices(deviceIdentifiers: string[], appIdentifier: string, framework: string): Promise<IAppInstalledInfo>[]` - checks if the specified application is installed on each of the specified devices and is LiveSync supported for this application.
The returned type for each device is `IAppInstalledInfo`:
```JavaScript
/**
 * Describes if LiveSync is supported for specific device and application.
 */
interface IAppInstalledInfo extends ILiveSyncSupportedInfo {
	/**
	 * Unique identifier of the device.
	 */
	deviceIdentifier: string;

	/**
	 * Application identifier.
	 */
	appIdentifier: string;

	/**
	 * Defines if application is installed on device.
	 */
	isInstalled: boolean;

	/**
	 * Result, indicating is livesync supported for specified device and specified application.
	 * `true` in case livesync is supported and false otherwise.
	 */
	isLiveSyncSupported: boolean;
}
```

> NOTE: This method will try to start the application on each device in order to understand is LiveSync supported.
Sample usage:
```JavaScript
Promise.all(require("mobile-cli-lib")
				.devicesService
				.isAppInstalledOnDevices(devicesFound, "com.telerik.myApp", "cordova"))
		.then(function(data) {
			console.log(data);
		}, function(err) {
			console.log(err);
		});
```
Sample result will be:
```JSON
[{
	"deviceIdentifier": "deviceId1",
	"appIdentifier": "appId",
	"isInstalled": true,
	"isLiveSyncSupported": true
}, {
	"deviceIdentifier": "deviceId2",
	"appIdentifier": "appId",
	"isInstalled": false,
	"isLiveSyncSupported": false
}]
```

* `isCompanionAppInstalledOnDevices(deviceIdentifiers: string[], framework: string): Promise<IAppInstalledInfo>[]` - checks if the companion application is installed on each of the specified devices and is LiveSync supported for this application.
The returned type for each device is `IAppInstalledInfo` (check above for full description of the interface).
Sample usage:
```JavaScript
Promise.all(require("mobile-cli-lib")
				.devicesService
				.isCompanionAppInstalledOnDevices(devicesFound, "cordova"))
		.then(function(data) {
			console.log(data);
		}, function(err) {
			console.log(err);
		});
```
Sample result will be:
```JSON
[{
	"deviceIdentifier": "deviceId1",
	"appIdentifier": "com.telerik.AppBuilder",
	"isInstalled": true,
	"isLiveSyncSupported": true
}, {
	"deviceIdentifier": "deviceId2",
	"appIdentifier": "com.telerik.AppBuilder",
	"isInstalled": false,
	"isLiveSyncSupported": false
}]
```


* `mapAbstractToTcpPort(deviceIdentifier: string, appIdentifier: string, framework: string): Promise<string>` - This function forwards the abstract port of the web view on the device to available tcp port on the host and returns the tcp port.

Sample usage:
```JavaScript
require("mobile-cli-lib").devicesService.mapAbstractToTcpPort("4df18f307d8a8f1b", "com.telerik.test", "Cordova")
	.then(function(port) {
		console.log(port);
	}, function(err) {
		console.log(err);
	});
```

* `getDebuggableApps(deviceIdentifiers: string[]): Promise<IDeviceApplicationInformation[]>[]` - This function checks the proc/net/unix file of each device from the deviceIdentifiers argument for web views connected to abstract ports and returns information about the applications.
```JavaScript
/**
 * Describes basic information about application on device.
 */
interface IDeviceApplicationInformation {
	/**
	 * The device identifier.
	 */
	deviceIdentifier: string;

	/**
	 * The application identifier.
	 */
	appIdentifier: string;

	/**
	 * The framework of the project (Cordova or NativeScript).
	 */
	framework: string;
}
```

Sample usage:
```JavaScript
Promise.all(require("mobile-cli-lib").devicesService.getDebuggableApps(["4df18f307d8a8f1b", "JJY5KBTW75TCHQUK"]))
	.then(function(data) {
		data.forEach(function(apps) {
			console.log(apps);
		});
	}, function(err) {
		console.log(err);
	});
```
Sample result will be:
```JSON
[[{
	"deviceIdentifier": "4df18f307d8a8f1b",
	"appIdentifier": "com.telerik.Fitness",
	"framework": "NativeScript"
}, {
	"deviceIdentifier": "4df18f307d8a8f1b",
	"appIdentifier": "com.telerik.livesynctest",
	"framework": "Cordova"
}], [{
	"deviceIdentifier": "JJY5KBTW75TCHQUK",
	"appIdentifier": "com.telerik.PhotoAlbum",
	"framework": "NativeScript"
}]]
```

* `getDebuggableApps(deviceIdentifiers: string[]): Promise<IDeviceApplicationInformation[]>[]` - This function checks the proc/net/unix file of each device from the deviceIdentifiers argument for web views connected to abstract ports and returns information about the applications.
```JavaScript
/**
 * Describes basic information about application on device.
 */
interface IDeviceApplicationInformation {
	/**
	 * The device identifier.
	 */
	deviceIdentifier: string;

	/**
	 * The application identifier.
	 */
	appIdentifier: string;

	/**
	 * The framework of the project (Cordova or NativeScript).
	 */
	framework: string;
}
```

Sample usage:
```JavaScript
Promise.all(require("mobile-cli-lib").devicesService.getDebuggableApps(["4df18f307d8a8f1b", "JJY5KBTW75TCHQUK"]))
	.then(function(data) {
		data.forEach(function(apps) {
			console.log(apps);
		});
	}, function(err) {
		console.log(err);
	});
```
Sample result will be:
```JSON
[[{
	"deviceIdentifier": "4df18f307d8a8f1b",
	"appIdentifier": "com.telerik.Fitness",
	"framework": "NativeScript"
}, {
	"deviceIdentifier": "4df18f307d8a8f1b",
	"appIdentifier": "com.telerik.livesynctest",
	"framework": "Cordova"
}], [{
	"deviceIdentifier": "JJY5KBTW75TCHQUK",
	"appIdentifier": "com.telerik.PhotoAlbum",
	"framework": "NativeScript"
}]]
```

* `getDebuggableViews(deviceIdentifier: string, appIdentifier: string): Promise<IDebugWebViewInfo[]>` - This function returns WebViews that can be debugged for specified application on specified device.
> NOTE: This method works only for Cordova based applications. DO NOT pass appIdentifier of NativeScript application.

```JavaScript
/**
 * Describes information for WebView that can be debugged.
 */
interface IDebugWebViewInfo {
	/**
	 * Short description of the view.
	 */
	description: string;

	/**
	 * Url to the devtools.
	 * @example http://chrome-devtools-frontend.appspot.com/serve_rev/@211d45a5b74b06d12bb016f3c4d54095faf2646f/inspector.html?ws=127.0.0.1:53213/devtools/page/4024
	 */
	devtoolsFrontendUrl: string;

	/**
	 * Unique identifier of the web view. Could be number or GUID.
	 * @example 4027
	 */
	id: string;

	/**
	 * Title of the WebView.
	 * @example https://bit.ly/12345V is not available
	 */
	title: string;

	/**
	 * Type of the WebView.
	 * @example page
	 */
	type: string;

	/**
	 * URL loaded in the view.
	 * @example https://bit.ly/12345V
	 */
	url: string;

	/**
	 * Debugger URL.
	 * @example ws://127.0.0.1:53213/devtools/page/4027
	 */
	webSocketDebuggerUrl: string;
}
```

Sample usage:
```JavaScript
require("mobile-cli-lib")
	.devicesService
	.getDebuggableViews("4df18f307d8a8f1b", "com.telerik.cordovaApp")
	.then(function(data) {
		console.log(data);
	}, function(err) {
		console.log(err);
	});
```

Sample result will be:
```JSON
[{
		"description": "",
		"devtoolsFrontendUrl": "http://chrome-devtools-frontend.appspot.com/serve_rev/@211d45a5b74b06d12bb016f3c4d54095faf2646f/inspector.html?ws=127.0.0.1:53213/devtools/page/4050",
		"id": "4050",
		"title": "New tab",
		"type": "page",
		"url": "chrome-native://newtab/",
		"webSocketDebuggerUrl": "ws://127.0.0.1:53213/devtools/page/4050"
	},

	{
		"description": "",
		"devtoolsFrontendUrl": "http://chrome-devtools-frontend.appspot.com/serve_rev/@211d45a5b74b06d12bb016f3c4d54095faf2646f/inspector.html?ws=127.0.0.1:53213/devtools/page/4032",
		"id": "4032",
		"title": "New tab",
		"type": "page",
		"url": "chrome-native://newtab/",
		"webSocketDebuggerUrl": "ws://127.0.0.1:53213/devtools/page/4032"
	}
]
```

* `getInstalledApplications(deviceIdentifier: string): Promise<string[]>` - returns information about applications installed on specified device. The method will reject the resulting Promise in case the passed `deviceIdentifier` is not found (i.e. there's no currently attached device with this identifier).

Sample usage:
```JavaScript
require("mobile-cli-lib").devicesService.getInstalledApplications("4df18f307d8a8f1b")
	.then(function(appIdentifiers) {
		console.log("Installed applications are: ", appIdentifiers);
	}, function(err) {
		console.log(err);
	});
```
Sample result of the method call is:
```JSON
["com.telerik.app1", "org.nativescript.app1"]
```

### Module liveSyncService
> Stability: 1 - Could be changed due to some new requirments.

This module allows LiveSync applications on different devices.

The following types are used:
```TypeScript
/**
 * Describes the result of a single livesync operation started by Proton.
 */
interface ILiveSyncOperationResult {
	/**
	 * Defines if the operation is successful (set to true) or not (value is false).
	 */
	isResolved: boolean;

	/**
	 * Error when livesync operation fails. If `isResolved` is true, error will be undefined.
	 */
	error?: Error;
}

/**
 * Describes result of all LiveSync operations per device.
 */
interface IDeviceLiveSyncResult {
	/**
	 * Identifier of the device.
	 */
	deviceIdentifier: string;

	/**
	 * Result of LiveSync operation for application.
	 */
	liveSyncToApp?: ILiveSyncOperationResult;

	/**
	 * Result of LiveSync operation to companion app.
	 */
	liveSyncToCompanion?: ILiveSyncOperationResult;
}
```
* `livesync(devicesInfo: IDeviceLiveSyncInfo[], projectDir: string, filePaths?: string[]): Promise<IDeviceLiveSyncResult>[]` - LiveSync changes on the specified devices.
In case filePaths are not specified, the whole project directory will be synced.
The `devicesInfo` array describes livesync operations for each device. Each object should be described with the following properties:
```TypeScript
/**
 * Describes device's LiveSync information.
 */
interface IDeviceLiveSyncInfo {
	/**
	 * Unique identifier of the device.
	 */
	deviceIdentifier: string;

	/**
	 * Defines if changes have to be synced to installed application.
	 */
	syncToApp: boolean;

	/**
	 * Defines if changes have to be synced to companion app.
	 */
	syncToCompanion: boolean;
}
```

Sample usage:
```JavaScript
var deviceInfos = [{"deviceIdentifier": "129604ab96a4d0053023b4bf5b288cf34a9ed5fa", "syncToApp": true, "syncToCompanion": false},
					{"deviceIdentifier": "153544fa45f4a5646543b5bf1b221fe31a8fa6bc", "syncToApp": true, "syncToCompanion": false}];
// Full Sync - the whole project dir will be synced
Promise.all(require("mobile-cli-lib").liveSyncService.livesync(deviceInfos, projectDir))
	.then(function(result) {
			console.log("Finished with full sync, result is: ", result);
	}).catch(function(err) {
			console.log("Error while livesyncing: ", err);
	});

// Or use livesync only for some files:
var filesToSync = [path.join(projectDir,"app","components", "homeView", "homeView.xml"),
					path.join(projectDir,"app","components", "addressView", "addressView.xml")]
Promise.all(require("mobile-cli-lib").liveSyncService.livesync(deviceInfos, projectDir, filesToSync))
	.then(function(result) {
			console.log("Finished with partial sync, result is: ", result);
	}).catch(function(err) {
			console.log("Error while livesyncing: ", err);
	});
```

* `deleteFiles(devicesInfo: IDeviceLiveSyncInfo[], projectDir: string, filePaths: string[]): Promise<IDeviceLiveSyncResult>[]` - Deletes specified files from devices's livesync directories.
The `devicesInfo` array describes livesync operations for each device. Check `livesync` method above fore more information.

Sample usage:
```JavaScript
var deviceInfos = [{"deviceIdentifier": "129604ab96a4d0053023b4bf5b288cf34a9ed5fa", "syncToApp": true, "syncToCompanion": false},
					{"deviceIdentifier": "153544fa45f4a5646543b5bf1b221fe31a8fa6bc", "syncToApp": true, "syncToCompanion": false}];

var filesToSync = [path.join(projectDir,"app","components", "homeView", "homeView.xml"),
					path.join(projectDir,"app","components", "addressView", "addressView.xml")]
Promise.all(require("mobile-cli-lib").liveSyncService.deleteFiles(deviceInfos, projectDir, filesToSync))
	.then(function(result) {
			console.log("Finished with deleting files, result is: ", result);
	}).catch(function(err) {
			console.log("Error while deleting files: ", err);
	});
```

### Module npmService
> Stability: 1 - Could be changed due to some new requirments.

This module is used to install or uninstall packages from npm.

The following types are used:
```TypeScript
/**
 * Describes information for single npm dependency that has to be installed.
 */
interface INpmDependency {
	/**
	 * Name of the dependency.
	 */
	name: string;

	/**
	 * @optional The version of the dependency that has to be installed.
	 */
	version?: string;

	/**
	 * Defines if @types/<name> should be installed as well.
	 */
	installTypes: boolean;
}

/**
 * Describes the result of npm install command.
 */
interface INpmInstallResult {
	/**
	 * The result of installing a single dependency.
	 */
	result?: INpmInstallDependencyResult,

	/**
	 * The error that occurred during the operation.
	 */
	error?: Error;
}
```

* `install(packageName: string, pathToSave: string, config: IDictionary<string | boolean>): Promise<INpmInstallResult>` - Installs everything from package.json or specified dependency.
In case there's information which dependency to install, the method will check it and install only this dependency and possibly its @types.

Note that the last argument - `config` can be used to pass flags to the `npm install` opration like `save`, `save-dev`, `ignore-scripts` and so on.

Sample usage:
```JavaScript
// Install all dependencies from package.json.
require("mobile-cli-lib").npmService.install("lodash@3.x", "D:\\test\\project", { save: true, "save-exact": true })
	.then(function(result) {
			console.log("The npm result is: ", result);
	}).catch(function(err) {
			console.log("Error while installing packages from npm: ", err);
	});
```

Sample result will be:
```JSON
{}
```

```JavaScript
// Install specific dependency from npm.
var dependency = {
	name: "lodash",
	version: "4.15.0",
	installTypes: true
};

require("mobile-cli-lib").npmService.install("D:\\test\\project", dependency)
	.then(function(result) {
			console.log("The npm result is: ", result);
	}).catch(function(err) {
			console.log("Error while installing packages from npm: ", err);
	});
```

Sample result will be:
```JSON
{
	"result": {
		"isInstalled": true,
		"isTypesInstalled": true
	}
}
```

* `uninstall(projectDir: string, dependency: string): Promise` - Uninstalls the dependency and the @types/<dependency> devDependency.
The method will remove them from package.json and from node_modules dir.

Sample usage:
```JavaScript
require("mobile-cli-lib").npmService.uninstall("D:\\test\\project", "lodash")
	.then(function() {
			console.log("The dependency is uninstalled.");
	}).catch(function(err) {
			console.log("Error while uninstalling packages from npm: ", err);
	});
```

Technical details
==

### Injector
Similar to `AngularJS`, `mobile-cli-lib` is using `$injector` to retrive object instances, instantiate types and load modules. Each module must be registered in the `$injector`, so when another module depends on it, the `$injector` will create a new instance of the dependency or reuse already created one.

#### How to add new module
* Add a new file with kebab-case ([spinal-case](http://en.wikipedia.org/wiki/Letter_case#Special_case_styles)) name. For example when the class that you'll add is called `DeviceService`, it is good practice to call the file `device-service.ts`.

* Add your class in the file. The class name should be in <a href="https://msdn.microsoft.com/en-us/library/x2dbyw72(v=vs.71).aspx">Pascal case</a>

```TypeScript
class DeviceService {
}
```
> NOTE: The reference path at the top must point the the root of the project, where `.d.ts` file is created by `grunt`.

* Register the class in the injector with the name that all other modules will use when they want instance of the `DeviceService`. The name should be in <a href="https://msdn.microsoft.com/en-us/library/x2dbyw72(v=vs.71).aspx">Camel case</a>:
```TypeScript
class DeviceService {
}
$injector.register("deviceService", DeviceService);
```

* Add the methods you need in your implementation:
```TypeScript
class DeviceService {
	public listDevices(): void {
		// implementation is here
	}
}
$injector.register("deviceService", DeviceService);
```

* If your class depends on other modules, registered in the `$injector`, you can access them by adding them as parameters of the constructor:
```TypeScript
class DeviceService {
	constructor(private $fs: IFileSystem) { }
}
$injector.register("deviceService", DeviceService);
```

> NOTE: In case you do not place access modifier (`private`, `protected` or `public`, you'll be able to use the dependant module only in the constructor.

> NOTE: The name of the module must be exactly the same as the one used for registering in the `$injector`, in this case this is `fs` module. The preceding dollar symbol `$` is mandatory.
Now you can access `fs` methods by using `this.$fs.<method>`.

* The last step is to add your module to `bootstrap.ts`:
```TypeScript
$injector.require("deviceService", "./device-service");
```
This line tells the `$injector` to look for module called "deviceService" in a file `device-service` located at the root of the `mobile-cli-lib`.
> NOTE: The name of the module must be the same as the one used in `$injector.register` call.
`$injector.require` will not load the file. It will be loaded by `$injector` when someone asks for module "deviceService".

### How to make a method public
In order to expose public API, we use TypeScript decorators and some "magic" in our bootstrapping. When you want to expose method `B` from class `A`, you have to do the following:
* In `bootstrap.ts` make sure to use `requirePublic` method of the `$injector` when requiring the file:

```TypeScript
$injector.requirePublic("deviceService", "./device-service")
```

* Add the exported decorator on the method which you want to expose: `@decorators.exported('deviceService')`, where decorators are imported from the root of the project: `import decorators = require("./decorators");`

> IMPORTANT: `exported` decorator requires one parameter which MUST be the first parameter passed to `requirePublic` method. This is the name of the module that will be publicly exposed.

After you have executed these two steps, you can start using your publicly available method:

```JavaScript
var common = require("mobile-cli-lib");
common.deviceService.listDevices() /* NOTE: here we are not using the class name DeviceService, but the module name - deviceService */
	.then(function (a) {
    	console.log("After promise had returned.");
    	return a;
	})
    .catch(function (err) {
    	console.log("Error happened:");
    	console.log(err);
	});
```

#### Behind the scenes of generating public API
`requirePublic` method of the `injector` is doing some "magic" in order to support lazy loading, correct dependency resolving and exposing only some of the methods, not the whole power of the common lib.
When you require `mobile-cli-lib` module, you receive $injector's publicApi - it is the "exported one". `requirePublic` method defines getter for each module that is passed, for example when you say:
```TypeScript
	$injector.requirePublic("deviceService", "./device-service")
```
a new property is added to publicApi - `deviceService` and a getter is added for it. When you try to access this module, `require("mobile-cli-lib").deviceService.listDevices()`, the getter is called. It resolves the module, by parsing the provided file (`./device-service`)
and that's the time when decorators are executed. For each decorated method, a new entry in `$injector.publicApi.__modules__` is created. This is not the same method that you've decorated - it's entirely new method, that returns a Promise.
The new method will be used in the publicApi, while original implementation will still be used in all other places in the code. The promisified method will call the original one (in a separate Fiber) and will resolve the Promise with the result of the method.


Issues
==

### Missing dependencies

Some of our modules must be added: staticConfig, config, analyticsService, etc.

### Tests for injector

Add more tests for yok and for register decorator.
