Public API
==

This document describes all methods that can be invoked when NativeScript CLI is required as library, i.e.

```JavaScript
const tns = require("nativescript");
```

# Contents
* [projectService](#projectservice)
	* [createProject](#createproject)
	* [isValidNativeScriptProject](#isvalidnativescriptproject)
* [extensibilityService](#extensibilityservice)
	* [installExtension](#installextension)
	* [uninstallExtension](#uninstallextension)
	* [getInstalledExtensions](#getinstalledextensions)
	* [loadExtensions](#loadextensions)
* [settingsService](#settingsservice)
	* [setSettings](#setsettings)
* [npm](#npm)
	* [install](#install)
	* [uninstall](#uninstall)
	* [search](#search)
	* [view](#view)
* [analyticsService](#analyticsservice)
	* [startEqatecMonitor](#starteqatecmonitor)
* [debugService](#debugservice)
	* [debug](#debug)
* [liveSyncService](#livesyncservice)
	* [liveSync](#livesync)
	* [stopLiveSync](#stopLiveSync)
	* [events](#events)


## Module projectService

`projectService` modules allow you to create new NativeScript application.

### createProject
* Description: `createProject(projectSettings: IProjectSettings): Promise<void>` - Creates new NativeScript application. By passing `projectSettings` argument you specify the name of the application, the template that will be used, etc.:

```TypeScript
/**
 * Describes available settings when creating new NativeScript application.
 */
interface IProjectSettings {
	/**
	 * Name of the newly created application.
	 */
	projectName: string;

	/**
	 * Selected template from which to create the project. If not specified, defaults to hello-world template.
	 * Template can be any npm package, local dir, github url, .tgz file.
	 * If it is set to `angular` or `ng`, default NativeScript Angular Hello World template will be used.
	 * If it is set to `typescript` or `tsc`, default NativeScript TypeScript Hello World template will be used.
	 */
	template?: string;

	/**
	 * Application identifier for the newly created application. If not specified, defaults to org.nativescript.<projectName>.
	 */
	appId?: string;

	/**
	 * Path where the project will be created. If not specified, defaults to current working dir.
	 */
	pathToProject?: string;

	/**
	 * Defines if invalid application name can be used for project creation.
	 */
	force?: boolean;

	/**
	 * Defines whether the `npm install` command should be executed with `--ignore-scripts` option.
	 * When it is passed, all scripts (postinstall for example) will not be executed.
	 */
	ignoreScripts?: boolean;
}
```

* Sample usage:
```JavaScript
const projectSettings = {
	projectName: "my-ns-app",
	template: "ng",
	pathToProject: "/home/my-user/project-dir"
};

tns.projectService.createProject(projectSettings)
	.then(() => console.log("Project successfully created."))
	.catch((err) => console.log("Unable to create project, reason: ", err);
```

### isValidNativeScriptProject
* Definition: `isValidNativeScriptProject(projectDir: string): boolean` - Checks if the specified path is a valid NativeScript project. Returns `true` in case the directory is a valid project, `false` otherwise.

* Sample usage:
```JavaScript
const isValidProject = tns.projectService.isValidNativeScriptProject("/tmp/myProject");
console.log(isValidProject); // true or false
```

## extensibilityService
`extensibilityService` module gives access to methods for working with CLI's extensions - list, install, uninstall, load them. The extensions add new functionality to CLI, so once an extension is loaded, all methods added to it's public API are accessible directly through CLI when it is used as a library. Extensions may also add new commands, so they are accessible through command line when using NativeScript CLI.

A common interface describing the results of a method is `IExtensionData`:
```TypeScript
/**
 * Describes each extension.
 */
interface IExtensionData {
	/**
	 * The name of the extension.
	 */
	extensionName: string;
}
```

### installExtension
Installs specified extension.

* Definition:
```TypeScript
/**
 * Installs a specified extension.
 * @param {string} extensionName Name of the extension to be installed. It may contain version as well, i.e. myPackage, myPackage@1.0.0, myPackage.tgz, https://github.com/myOrganization/myPackage/tarball/master, https://github.com/myOrganization/myPackage etc.
 * @returns {Promise<IExtensionData>} Information about installed extensions.
 */
installExtension(extensionName: string): Promise<IExtensionData>;
```

* Usage:
```JavaScript
tns.extensibilityService.installExtension("extension-package")
	.then(extensionData => console.log(`Successfully installed extension ${extensionData.extensionName}.`))
	.catch(err => console.log("Failed to install extension."));
```

### uninstallExtension
Uninstalls specified extensions, so its functionality will no longer be available through CLI.

* Definition:
```TypeScript
/**
 * Uninstalls extension from the installation.
 * @param {string} extensionName Name of the extension to be uninstalled.
 * @returns {Promise<void>}
 */
uninstallExtension(extensionName: string): Promise<void>;
```

* Usage:
```JavaScript
tns.extensibilityService.uninstallExtension("extension-package")
	.then(() => console.log("Successfully uninstalled extension."))
	.catch(err => console.log("Failed to uninstall extension."));
```

### getInstalledExtensions
Gets information about all installed extensions.

* Definition:
```TypeScript
/**
 * Gets information about installed dependencies - names and versions.
 * @returns {IStringDictionary}
 */
getInstalledExtensions(): IStringDictionary;
```

* Usage:
```JavaScript
const installedExtensions = tns.extensibilityService.getInstalledExtensions();
for (let extensionName in installedExtensions) {
	const version = installedExtensions[extensionName];
	console.log(`The extension ${extensionName} is installed with version ${version}.`);
}
```

### loadExtensions
Loads all currently installed extensions. The method returns array of Promises, one for each installed extension. In case any of the extensions cannot be loaded, only its Promise is rejected.

* Definition
```TypeScript
/**
 * Loads all extensions, so their methods and commands can be used from CLI.
 * For each of the extensions, a new Promise is returned. It will be rejected in case the extension cannot be loaded. However other promises will not be reflected by this failure.
 * In case a promise is rejected, the error will have additional property (extensionName) that shows which is the extension that cannot be loaded in the process.
 * @returns {Promise<IExtensionData>[]} Array of promises, each is resolved with information about loaded extension.
 */
loadExtensions(): Promise<IExtensionData>[];
```

* Usage:
```JavaScript
const loadExtensionsPromises = tns.extensibilityService.loadExtensions();
for (let promise of loadExtensionsPromises) {
	promise.then(extensionData => console.log(`Loaded extension: ${extensionData.extensionName}.`),
		err => {
			console.log(`Failed to load extension: ${err.extensionName}`);
			console.log(err);
		});
}
```

### loadExtension
Loads a specified extension.

* Definition
```TypeScript
/**
 * Loads a single extension, so its methods and commands can be used from CLI.
 * @param {string} extensionName Name of the extension to be installed. It may contain version as well, i.e. myPackage, myPackage@1.0.0
 * A Promise is returned. It will be rejected in case the extension cannot be loaded.
 * @returns {Promise<IExtensionData>} Promise, resolved with IExtensionData.
 */
loadExtension(extensionName: string): Promise<IExtensionData>;
```

* Usage:
```JavaScript
tns.extensibilityService.loadExtension("my-extension")
	.then(extensionData => console.log(`Loaded extension: ${extensionData.extensionName}.`),
		err => {
			console.log(`Failed to load extension: ${err.extensionName}`);
			console.log(err);
		});
}
```

## settingsService
`settingsService` module provides a way to configure various settings.

### setSettings
Used to set various settings in order to modify the behavior of some methods.
* Auxiliary interfaces:
```TypeScript
/**
 * Describes configuration settings that modify the behavior of some methods.
 */
interface IConfigurationSettings {
	/**
	 * This string will be used when constructing the UserAgent http header.
	 * @type {string}
	 */
	userAgentName: string;
}
```

* Definition:
```TypeScript
/**
 * Describes service used to confugure various settings.
 */
interface ISettingsService {
	/**
	 * Used to set various settings in order to modify the behavior of some methods.
	 * @param {IConfigurationSettings} settings Settings which will modify the behaviour of some methods.
	 * @returns {void}
	 */
	setSettings(settings: IConfigurationSettings): void;
}
```

* Usage:
```JavaScript
tns.settingsService.setSettings({ userAgentName: "myUserAgent" });
```

## npm
`npm` module provides a way to interact with npm specifically the use of install, uninstall, search and view commands.

### install
Installs specified package. Note that you can use the third argument in order to pass different options to the installation like `ignore-scripts`, `save` or `save-exact` which work exactly like they would if you would execute npm from the command line and pass them as `--` flags.
* Auxiliary interfaces:
```TypeScript
/**
 * Describes information about installed package.
 */
interface INpmInstallResultInfo {
	/**
	 * Installed package's name.
	 * @type {string}
	 */
	name: string;
	/**
	 * Installed package's version.
	 * @type {string}
	 */
	version: string;
	/**
	 * The original output that npm CLI produced upon installation.
	 * @type {INpmInstallCLIResult}
	 */
	originalOutput: INpmInstallCLIResult;
}
```

* Definition:
```TypeScript
/**
 * Installs dependency
 * @param  {string}                            packageName The name of the dependency - can be a path, a url or a string.
 * @param  {string}                            pathToSave  The destination of the installation.
 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate installation.
 * @return {Promise<INpmInstallResultInfo>}                Information about installed package.
*/
install(packageName: string, pathToSave: string, config: IDictionary<string | boolean>): Promise<INpmInstallResultInfo>;
```

* Usage:
```JavaScript
tns.npm.install("lodash", "/tmp/myProject", { save: true }).then(result => {
	console.log(`${result.name} installed successfully`);
}, err => {
	console.log("An error occurred during installation", err);
});
```

### uninstall
Uninstalls a specified package.

* Definition:
```TypeScript
/**
 * Uninstalls a dependency
 * @param  {string}                            packageName The name of the dependency.
 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate  uninstallation.
 * @param  {string}                            path  The destination of the uninstallation.
 * @return {Promise<any>}                The output of the uninstallation.
*/
uninstall(packageName: string, config?: IDictionary<string | boolean>, path?: string): Promise<string>;
```

* Usage:
```JavaScript
tns.npm.uninstall("lodash", "/tmp/myProject", { save: true }).then(output => {
	console.log(`Uninstalled successfully, output: ${output}`);
}, err => {
	console.log("An error occurred during uninstallation", err);
});
```

### search
Searches for a package using keywords.

* Definition:
```TypeScript
/**
 * Searches for a package.
 * @param  {string[]}                            filter Keywords with which to perform the search.
 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate search.
 * @return {Promise<string>}                The output of the uninstallation.
 */
search(filter: string[], config: IDictionary<string | boolean>): Promise<string>;
```

* Usage:
```JavaScript
tns.npm.search(["nativescript", "cloud"], { silent: true }).then(output => {
	console.log(`Found: ${output}`);
}, err => {
	console.log("An error occurred during searching", err);
});
```

### view
Provides information about a given package.

* Definition
```TypeScript
/**
 * Provides information about a given package.
 * @param  {string}                            packageName The name of the package.
 * @param  {IDictionary<string | boolean>} config      Additional options that can be passed to manipulate view.
 * @return {Promise<any>}                Object, containing information about the package.
 */
view(packageName: string, config: Object): Promise<any>;
```

* Usage:
```JavaScript
tns.npm.view(["nativescript"], {}).then(result => {
	console.log(`${result.name}'s latest version is ${result["dist-tags"].latest}`);
}, err => {
	console.log("An error occurred during viewing", err);
});
```

## analyticsService
Provides a way to configure analytics.

### startEqatecMonitor
* Definition:
```TypeScript
/**
 * Starts analytics monitor with provided key.
 * @param {string} projectApiKey API key with which to start analytics monitor.
 * @returns {Promise<void>}.
 */
startEqatecMonitor(projectApiKey: string): Promise<void>;
```


## debugService
Provides methods for debugging applications on devices. The service is also event emitter, that raises the following events:
* `connectionError` event - this event is raised when the debug operation cannot start on iOS device. The causes can be:
  * Application is not running on the specified iOS Device.
  * Application is not built in debug configuration on the specified iOS device.
  The event is raised with the following information:
```TypeScript
{
	/**
	 * Device identifier on which the debug process cannot start.
	 */
	deviceId: string;

	/**
	 * The error message.
	 */
	message: string;

	/**
	 * Code of the error.
	 */
	code: number
}
```

* Usage:
```JavaScript
tns.debugService.on("connectionError", errorData => {
	console.log(`Unable to start debug operation on device ${errorData.deviceId}. Error is: ${errorData.message}.`);
});
```

### debug
The `debug` method allows starting a debug operation for specified application on a specific device. The method returns a Promise, which is resolved with a url. The url should be opened in Chrome DevTools in order to debug the application.

The returned Promise will be rejected in case any error occurs. It will also be rejected in case:
1. Specified deviceIdentifier is not found in current list of attached devices.
1. The device, specified as deviceIdentifier is connected but not trusted.
1. The specified application is not installed on the device.
1. Trying to debug applications on connected iOS device on Linux.
1. In case the application is not running on the specified device.
1. In case the installed application is not built in debug configuration.

* Definition:
```TypeScript
/**
 * Starts debug operation based on the specified debug data.
 * @param {IDebugData} debugData Describes information for device and application that will be debugged.
 * @param {IDebugOptions} debugOptions Describe possible options to modify the behaivor of the debug operation, for example stop on the first line.
 * @returns {Promise<string>} URL that should be opened in Chrome DevTools.
 */
debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<string>;
```

The type of arguments that you can pass are described below:
```TypeScript
/**
 * Describes information for starting debug process.
 */
interface IDebugData {
	/**
	 * Id of the device on which the debug process will be started.
	 */
	deviceIdentifier: string;

	/**
	 * Application identifier of the app that it will be debugged.
	 */
	applicationIdentifier: string;

	/**
	 * Path to .app built for iOS Simulator.
	 */
	pathToAppPackage?: string;

	/**
	 * The name of the application, for example `MyProject`.
	 */
	projectName?: string;

	/**
	 * Path to project.
	 */
	projectDir?: string;
}

/**
 * Describes all options that define the behavior of debug.
 */
interface IDebugOptions {
	/**
	 * Defines if bundled Chrome DevTools should be used or specific commit. Valid for iOS only.
	 */
	useBundledDevTools?: boolean;
}
```

* Usage:
```JavaScript
tns.debugService.on("connectionError", errorData => {
	console.log(`Unable to start debug operation on device ${errorData.deviceId}. Error is: ${errorData.message}.`);
});

const debugData = {
	deviceIdentifier: "4df18f307d8a8f1b",
	applicationIdentifier: "com.telerik.app1",
	projectName: "app1",
	projectDir: "/Users/myUser/app1"
};

const debugOptions = {
	useBundledDevTools: true
};

tns.debugService.debug(debugData, debugOptions)
	.then(url => console.log(`Open the following url in Chrome DevTools: ${url}`))
	.catch(err => console.log(`Unable to start debug operation, reason: ${err.message}.`));
```

## liveSyncService
Used to LiveSync changes on devices. The operation can be started for multiple devices and stopped for each of them. During LiveSync operation, the service will emit different events based on the action that's executing.

### liveSync
Starts a LiveSync operation for specified devices. During the operation, application may have to be rebuilt (for example in case a change in App_Resources is detected).
By default the LiveSync operation will start file system watcher for `<project dir>/app` directory and any change in it will trigger a LiveSync operation.
After calling the method once, you can add new devices to the same LiveSync operation by calling the method again with the new device identifiers.

> NOTE: Consecutive calls to `liveSync` method for the same project will execute the initial sync (deploy and fullSync) only for new device identifiers. So in case the first call is for devices with ids [ 'A' , 'B' ] and the second one is for devices with ids [ 'B', 'C' ], the initial sync will be executed only for device with identifier 'C'.

> NOTE: In case a consecutive call to `liveSync` method requires change in the pattern for watching files (i.e. `liveSyncData.syncAllFiles` option has changed), current watch operation will be stopped and a new one will be started.

* Definition
```TypeScript
/**
 * Starts LiveSync operation by rebuilding the application if necessary and starting watcher.
 * @param {ILiveSyncDeviceInfo[]} deviceDescriptors Describes each device for which we would like to sync the application - identifier, outputPath and action to rebuild the app.
 * @param {ILiveSyncInfo} liveSyncData Describes the LiveSync operation - for which project directory is the operation and other settings.
 * @returns {Promise<void>}
 */
liveSync(deviceDescriptors: ILiveSyncDeviceInfo[], liveSyncData: ILiveSyncInfo): Promise<void>;
```

* Usage:
```JavaScript
const projectDir = "myProjectDir";
const androidDeviceDescriptor = {
	identifier: "4df18f307d8a8f1b",
	buildAction: () => {
		return tns.localBuildService.build("Android", { projectDir, bundle: false, release: false, buildForDevice: true });
	},
	outputPath: null
};

const iOSDeviceDescriptor = {
	identifier: "12318af23ebc0e25",
	buildAction: () => {
		return tns.localBuildService.build("iOS", { projectDir, bundle: false, release: false, buildForDevice: true });
	},
	outputPath: null
};

const liveSyncData = {
	projectDir,
	skipWatcher: false,
	watchAllFiles: false,
	useLiveEdit: false
};

tns.liveSyncService.liveSync([ androidDeviceDescriptor, iOSDeviceDescriptor ], liveSyncData)
	.then(() => {
		console.log("LiveSync operation started.");
	}, err => {
		console.log("An error occurred during LiveSync", err);
	});
```

### stopLiveSync
Stops LiveSync operation. In case deviceIdentifires are passed, the operation will be stopped only for these devices.

* Definition
```TypeScript
/**
 * Stops LiveSync operation for specified directory.
 * @param {string} projectDir The directory for which to stop the operation.
 * @param {string[]} @optional deviceIdentifiers Device ids for which to stop the application. In case nothing is passed, LiveSync operation will be stopped for all devices.
 * @returns {Promise<void>}
 */
stopLiveSync(projectDir: string, deviceIdentifiers?: string[]): Promise<void>;
```

* Usage
```JavaScript
const projectDir = "myProjectDir";
const deviceIdentifiers = [ "4df18f307d8a8f1b", "12318af23ebc0e25" ];
tns.liveSyncService.stopLiveSync(projectDir, deviceIdentifiers)
	.then(() => {
		console.log("LiveSync operation stopped.");
	}, err => {
		console.log("An error occurred during stopage.", err);
	});
```

### Events
`liveSyncService` raises several events in order to provide information for current state of the operation.
* liveSyncStarted - raised whenever CLI starts a LiveSync operation for specific device. When `liveSync` method is called, the initial LiveSync operation will emit `liveSyncStarted` for each specified device. After that the event will be emitted only in case when liveSync method is called again with different device instances. The event is raised with the following data:
```TypeScript
{
	projectDir: string;
	deviceIdentifier: string;
	applicationIdentifier: string;
}
```

Example:
```JavaScript
tns.liveSyncService.on("liveSyncStarted", data => {
	console.log(`Started LiveSync on ${data.deviceIdentifier} for ${data.applicationIdentifier}.`);
});
```

* liveSyncExecuted - raised whenever CLI finishes a LiveSync operation for specific device. When `liveSync` method is called, the initial LiveSync operation will emit `liveSyncExecuted` for each specified device once it finishes the operation. After that the event will be emitted whenever a change is detected (in case file system watcher is staretd) and the LiveSync operation is executed for each device. The event is raised with the following data:
```TypeScript
{
	projectDir: string;
	deviceIdentifier: string;
	applicationIdentifier: string;
	/**
	 * Full paths to files synced during the operation. In case the `syncedFiles.length` is 0, the operation is "fullSync" (i.e. all project files are synced).
	 */
	syncedFiles: string[];
}
```

Example:
```JavaScript
tns.liveSyncService.on("liveSyncExecuted", data => {
	console.log(`Executed LiveSync on ${data.deviceIdentifier} for ${data.applicationIdentifier}. Uploaded files are: ${syncedFiles.join(" ")}.`);
});
```

* liveSyncStopped - raised when LiveSync operation is stopped. The event will be raised when the operation is stopped for each device and will be raised when the whole operation is stopped. The event is raised with the following data:
```TypeScript
{
	projectDir: string;
	/**
	 * Passed only when the LiveSync operation is stopped for a specific device. In case it is not passed, the whole LiveSync operation is stopped.
	 */
	deviceIdentifier?: string;
}
```

Example:
```JavaScript
tns.liveSyncService.on("liveSyncStopped", data => {
	if (data.deviceIdentifier) {
		console.log(`Stopped LiveSync on ${data.deviceIdentifier} for ${data.projectDir}.`);
	} else {
		console.log(`Stopped LiveSync for ${data.projectDir}.`);
	}
});
```

* liveSyncError - raised whenever an error is detected during LiveSync operation. The event is raised for specific device. Once an error is detected, the event will be raised and the LiveSync operation will be stopped for this device, i.e. `liveSyncStopped` event will be raised for it. The event is raised with the following data:
```TypeScript
{
	projectDir: string;
	deviceIdentifier: string;
	applicationIdentifier: string;
	error: Error;
}
```

Example:
```JavaScript
tns.liveSyncService.on("liveSyncError", data => {
	console.log(`Error detected during LiveSync on ${data.deviceIdentifier} for ${data.projectDir}. Error: ${err.message}.`);
});
```

* notify - raised when LiveSync operation has some data that is important for the user. The event is raised for specific device. The event is raised with the following data:
```TypeScript
{
	projectDir: string;
	deviceIdentifier: string;
	applicationIdentifier: string;
	notification: string;
}
```

Example:
```JavaScript
tns.liveSyncService.on("notify", data => {
	console.log(`Notification: ${notification} for LiveSync operation on ${data.deviceIdentifier} for ${data.projectDir}. `);
});
```

## How to add a new method to Public API
CLI is designed as command line tool and when it is used as a library, it does not give you access to all of the methods. This is mainly implementation detail. Most of the CLI's code is created to work in command line, not as a library, so before adding method to public API, most probably it will require some modification.
For example the `$options` injected module contains information about all `--` options passed on the terminal. When the CLI is used as a library, the options are not populated. Before adding method to public API, make sure its implementation does not rely on `$options`.

More information how to add a method to public API is available [here](https://github.com/telerik/mobile-cli-lib#how-to-make-a-method-public).
After that add each method that you've exposed to the tests in `tests/nativescript-cli-lib.ts` file. There you'll find an object describing each publicly available module and the methods that you can call.