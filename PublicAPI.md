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
* [projectDataService](#projectdataservice)
	* [getProjectData](#getprojectdata)
	* [getProjectDataFromContent](#getprojectdatafromcontent)
	* [getNsConfigDefaultContent](#getnsconfigdefaultcontent)
	* [getAssetsStructure](#getassetsstructure)
	* [getIOSAssetsStructure](#getiosassetsstructure)
	* [getAndroidAssetsStructure](#getandroidassetsstructure)
* [extensibilityService](#extensibilityservice)
	* [pathToExtensions](#pathToExtensions)
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
	* [liveSyncToPreviewApp](#livesynctopreviewapp)
	* [stopLiveSync](#stopLiveSync)
	* [enableDebugging](#enableDebugging)
	* [attachDebugger](#attachDebugger)
	* [disableDebugging](#disableDebugging)
	* [getLiveSyncDeviceDescriptors](#getLiveSyncDeviceDescriptors)
	* [events](#events)
* [analyticsSettingsService](#analyticsSettingsService)
	* [getClientId](#getClientId)
* [constants](#constants)
* [assetsGenerationService](#assetsgenerationservice)
	* [generateIcons](#generateicons)
	* [generateSplashScreens](#generatesplashscreens)
* [androidProcessService](#androidprocessservice)
	* [getAppProcessId](#getappprocessid)
* [sysInfo](#sysinfo)
	* [getSupportedNodeVersionRange](#getsupportednodeversionrange)
	* [getSystemWarnings](#getsystemwarnings)
* [devicesService](#devicesservice)
	* [getEmulatorImages](#getemulatorimages)
	* [startEmulator](#startemulator)
	* [startDeviceDetectionInterval](#startdevicedetectioninterval)
	* [stopDeviceDetectionInterval](#stopdevicedetectioninterval)
	* [startEmulatorDetectionInterval](#startemulatordetectioninterval)
	* [stopEmulatorDetectionInterval](#stopemulatordetectioninterval)
* [deviceEmitter](#deviceemitter)
	* [events](#deviceemitterevents)
* [previewDevicesService](#previewdevicesservice)
	* [deviceFound](#devicefound)
	* [deviceLost](#devicelost)
	* [deviceLog](#devicelog)
* [previewQrCodeService](#previewqrcodeservice)
	* [getPlaygroundAppQrCode](#getplaygroundappqrcode)
* [cleanupService](#cleanupservice)
	* [setCleanupLogFile](#setcleanuplogfile)
* [initializeService](#initializeService)
	* [initialize](#initialize)
* [logger](#logger)
	* [initialize](#initialize)
	* [getLevel](#getlevel)
	* [appenders](#appenders)
		* [emit-appender](#emit-appender)
		* [cli-appender](#cli-appender)
	* [custom layouts](#custom-layouts)


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

## projectDataService
`projectDataService` provides a way to get information about a NativeScript project.

A common interface describing the results of a method is `IProjectData`:

```TypeScript
interface IProjectData extends IProjectDir {
	projectName: string;
	platformsDir: string;
	projectFilePath: string;
	projectId?: string;
	dependencies: any;
	devDependencies: IStringDictionary;
	appDirectoryPath: string;
	appResourcesDirectoryPath: string;
	projectType: string;
	nsConfig: INsConfig;
	/**
	 * Initializes project data with the given project directory. If none supplied defaults to cwd.
	 * @param {string} projectDir Project root directory.
	 * @returns {void}
	 */
	initializeProjectData(projectDir?: string): void;
	/**
	 * Initializes project data with the given package.json, nsconfig.json content and project directory. If none supplied defaults to cwd.
	 * @param {string} packageJsonContent: string
	 * @param {string} nsconfigContent: string
	 * @param {string} projectDir Project root directory.
	 * @returns {void}
	 */
	initializeProjectDataFromContent(packageJsonContent: string, nsconfigContent: string, projectDir?: string): void;
	getAppDirectoryPath(projectDir?: string): string;
	getAppDirectoryRelativePath(): string;
	getAppResourcesDirectoryPath(projectDir?: string): string;
	getAppResourcesRelativeDirectoryPath(): string;
}

interface IProjectDir {
	projectDir: string;
}

interface INsConfig {
	appPath?: string;
	appResourcesPath?:string;
}
```

### getProjectData
Returns an initialized IProjectData object containing data about the NativeScript project in the provided `projectDir`.

* Definition:
```TypeScript
/**
 * Returns an initialized IProjectData object containing data about the NativeScript project in the provided projectDir
 * @param {string} projectDir The path to the project
 * @returns {IProjectData} Information about the NativeScript project
 */
getProjectData(projectDir: string): IProjectData
```

### getProjectDataFromContent
Returns an IProjectData object that is initialized with the provided package.json content, nsconfig.json content and `projectDir`.

* Definition:
```TypeScript
/**
 * Returns an initialized IProjectData object containing data about the NativeScript project in the provided projectDir
 * @param {string} packageJsonContent The content of the project.json file in the root of the project
 * @param {string} nsconfigContent The content of the nsconfig.json file in the root of the project
 * @param {string} projectDir The path to the project
 * @returns {IProjectData} Information about the NativeScript project
 */
getProjectDataFromContent(packageJsonContent: string, nsconfigContent: string, projectDir?: string): IProjectData
```

### getNsConfigDefaultContent
Returns the default content of "nsconfig.json" merged with the properties provided by the the `data` argument.
* Definition:
```TypeScript
/**
 * Returns the default content of "nsconfig.json" merged with the properties provided by the "data" argument.
 * @param {Object} data Properties that should not be defaulted.
 */
 getNsConfigDefaultContent(data?: Object): string
```

### getAssetsStructure
Gives information about the whole assets structure for both iOS and Android. For each of the platforms, the returned object will contain icons, splashBackgrounds, splashCenterImages and splashImages (only for iOS).
* Definition:
```TypeScript
/**
 * Gives information about the whole assets structure for both iOS and Android.
 * For each of the platforms, the returned object will contain icons, splashBackgrounds, splashCenterImages and splashImages (only for iOS).
 * @param {IProjectDir} opts Object with a single property - projectDir. This is the root directory where NativeScript project is located.
 * @returns {Promise<IAssetsStructure>} An object describing the current asset structure.
 */
getAssetsStructure(opts: IProjectDir): Promise<IAssetsStructure>;
```

* Usage:
```JavaScript
tns.projectDataService.getAssetsStructure({ projectDir: "/Users/username/myNativeScriptProject" })
	.then(assetsStructure => console.log(`The current assets structure is ${JSON.stringify(assetsStructure, null, 2)}.`))
	.catch(err => console.log("Failed to get assets structure."));
```

### getIOSAssetsStructure
Gives information about the assets structure for iOS. The returned object will contain icons, splashBackgrounds, splashCenterImages and splashImages.
* Definition:
```TypeScript
/**
 * Gives information about the whole assets structure for iOS.
 * The returned object will contain icons, splashBackgrounds, splashCenterImages and splashImages.
 * @param {IProjectDir} opts Object with a single property - projectDir. This is the root directory where NativeScript project is located.
 * @returns {Promise<IAssetGroup>} An object describing the current asset structure for iOS.
 */
getIOSAssetsStructure(opts: IProjectDir): Promise<IAssetGroup>;
```

* Usage:
```JavaScript
tns.projectDataService.getIOSAssetsStructure({ projectDir: "/Users/username/myNativeScriptProject" })
	.then(assetsStructure => console.log(`The current assets structure for iOS is ${JSON.stringify(assetsStructure, null, 2)}.`))
	.catch(err => console.log("Failed to get assets structure."));
```

### getAndroidAssetsStructure
Gives information about the assets structure for Android. The returned object will contain icons, splashBackgrounds and splashCenterImages.
* Definition:
```TypeScript
/**
 * Gives information about the whole assets structure for Android.
 * The returned object will contain icons, splashBackgrounds and splashCenterImages.
 * @param {IProjectDir} opts Object with a single property - projectDir. This is the root directory where NativeScript project is located.
 * @returns {Promise<IAssetGroup>} An object describing the current asset structure for Android.
 */
getAndroidAssetsStructure(opts: IProjectDir): Promise<IAssetGroup>;
```

* Usage:
```JavaScript
tns.projectDataService.getAndroidAssetsStructure({ projectDir: "/Users/username/myNativeScriptProject" })
	.then(assetsStructure => console.log(`The current assets structure for Android is ${JSON.stringify(assetsStructure, null, 2)}.`))
	.catch(err => console.log("Failed to get assets structure."));
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
### pathToExtensions
Get/Set the to the CLI extensions.

* Definition:
```TypeScript
/**
 * The path to the CLI extensions.
 */
pathToExtensions: string;
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
 * Describes service used to configure various settings.
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
tns.settingsService.setSettings({ userAgentName: "myUserAgent", profileDir: "customProfileDir" });
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
	console.log(`Unable to start debug operation on device ${errorData.deviceIdentifier}. Error is: ${errorData.message}.`);
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
 * @param {IDebugOptions} debugOptions Describe possible options to modify the behavior of the debug operation, for example stop on the first line.
 * @returns {Promise<IDebugInformation>} Device Identifier, full url and port where the frontend client can be connected.
 */
debug(debugData: IDebugData, debugOptions: IDebugOptions): Promise<IDebugInformation>;
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
	 * Defines if bundled Chrome DevTools should be used or specific commit.
	 * Default value is true for Android and false for iOS.
	 */
	useBundledDevTools?: boolean;

	/**
	 * Defines if https://chrome-devtools-frontend.appspot.com should be used instead of chrome-devtools://devtools
	 * In case it is passed, the value of `useBundledDevTools` is disregarded.
	 * Default value is false.
	 */
	useHttpUrl?: boolean;

	/**
	 * Defines the commit that will be used in cases where remote protocol is required.
	 * For Android this is the case when useHttpUrl is set to true or useBundledDevTools is set to false.
	 * For iOS the value is used by default and when useHttpUrl is set to true.
	 * Default value is 02e6bde1bbe34e43b309d4ef774b1168d25fd024 which corresponds to 55.0.2883 Chrome version
	 */
	devToolsCommit?: string;

	/**
	 * Defines if Chrome DevTools should be used for debugging.
	 */
	chrome?: boolean;

	/**
	 * Defines if thе application is already started on device.
	 */
	start?: boolean;
}
```

* Usage:
```JavaScript
tns.debugService.on("connectionError", errorData => {
	console.log(`Unable to start debug operation on device ${errorData.deviceIdentifier}. Error is: ${errorData.message}.`);
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
	.then(debugInfo => console.log(`Open the following url in Chrome DevTools: ${debugInfo.url}, port is: ${debugInfo.port} and deviceIdentifier is: ${debugInfo.deviceIdentifier}`))
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

> NOTE: In case `debugggingEnabled` is set to `true` in a deviceDescriptor, debugging will initially be enabled for that device and a debugger will be attached after a successful livesync operation.

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
	bundle: false,
	release: false,
	useLiveEdit: false
};

tns.liveSyncService.liveSync([ androidDeviceDescriptor, iOSDeviceDescriptor ], liveSyncData)
	.then(() => {
		console.log("LiveSync operation started.");
	}, err => {
		console.log("An error occurred during LiveSync", err);
	});
```

### liveSyncToPreviewApp
Starts a LiveSync operation to the Preview app. After scanning the QR code with the scanner provided in the NativeScript Playground app, the app will be launched on a device through the Preview app. Additionally, any changes made to the project will be automatically synchronized with the deployed app.

* Definition
```TypeScript
/**
 * Starts LiveSync operation by producting a QR code and starting watcher.
 * @param {IPreviewAppLiveSyncData} liveSyncData Describes the LiveSync operation - for which project directory is the operation and other settings.
 * @returns {Promise<IQrCodeImageData>}
 */
liveSyncToPreviewApp(liveSyncData: IPreviewAppLiveSyncData): Promise<IQrCodeImageData>;
```

* Usage:
```JavaScript
const liveSyncData = {
	projectDir,
	bundle: false,
	useHotModuleReload: false,
	env: { }
};
tns.liveSyncService.liveSyncToPreviewApp(liveSyncData)
	.then(qrCodeImageData => {
		console.log("The qrCodeImageData is: " + qrCodeImageData);
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

### enableDebugging
Enables debugging during a LiveSync operation. This method will try to attach a debugger to the application. Note that `userInteractionNeeded` event may be raised. Additional details about the arguments can be seen [here](https://github.com/NativeScript/nativescript-cli/blob/master/lib/definitions/livesync.d.ts).

* Definition
```TypeScript
/**
* Enables debugging for the specified devices
* @param {IEnableDebuggingDeviceOptions[]} deviceOpts Settings used for enabling debugging for each device.
* @param {IDebuggingAdditionalOptions} enableDebuggingOptions Settings used for enabling debugging.
* @returns {Promise<void>[]} Array of promises for each device.
*/
enableDebugging(deviceOpts: IEnableDebuggingDeviceOptions[], enableDebuggingOptions: IDebuggingAdditionalOptions): Promise<void>[];
```

* Usage
```JavaScript
const projectDir = "/tmp/myProject";
const liveSyncData = { projectDir };
const devices = [androidDeviceDescriptor, iOSDeviceDescriptor];
tns.liveSyncService.liveSync(devices, liveSyncData)
	.then(() => {
		console.log("LiveSync operation started.");
		devices.forEach(device => {
			tns.liveSyncService.enableDebugging([{
				deviceIdentifier: device.identifier
			}], { projectDir });
		});
	});
```

### attachDebugger
Attaches a debugger to the specified device. Additional details about the argument can be seen [here](https://github.com/NativeScript/nativescript-cli/blob/master/lib/definitions/livesync.d.ts).

* Definition
```TypeScript
/**
* Attaches a debugger to the specified device.
* @param {IAttachDebuggerOptions} settings Settings used for controling the attaching process.
* @returns {Promise<void>}
*/
attachDebugger(settings: IAttachDebuggerOptions): Promise<void>;
```

* Usage
```JavaScript
tns.liveSyncService.on("userInteractionNeeded", data => {
	console.log("Please restart the app manually");
	return tns.liveSyncService.attachDebugger(data);
});
```

### disableDebugging
Disables debugging during a LiveSync operation. This method will try to detach a debugger from the application. Additional details about the arguments can be seen [here](https://github.com/NativeScript/nativescript-cli/blob/master/lib/definitions/livesync.d.ts).

* Definition
```TypeScript
/**
* Disables debugging for the specified devices
* @param {IDisableDebuggingDeviceOptions[]} deviceOptions Settings used for disabling debugging for each device.
* @param {IDebuggingAdditionalOptions} debuggingAdditionalOptions Settings used for disabling debugging.
* @returns {Promise<void>[]} Array of promises for each device.
*/
disableDebugging(deviceOptions: IDisableDebuggingDeviceOptions[], debuggingAdditionalOptions: IDebuggingAdditionalOptions): Promise<void>[];
```

* Usage
```JavaScript
const projectDir = "/tmp/myProject";
const liveSyncData = { projectDir };
const devices = [androidDeviceDescriptor, iOSDeviceDescriptor];
tns.liveSyncService.liveSync(devices, liveSyncData)
	.then(() => {
		console.log("LiveSync operation started.");
		devices.forEach(device => {
			tns.liveSyncService.enableDebugging([{
				deviceIdentifier: device.identifier
			}], { projectDir });
			setTimeout(() => {
				tns.liveSyncService.disableDebugging([{
								deviceIdentifier: device.identifier
							}], { projectDir });
			}, 1000 * 30);
		});
	});
```

### getLiveSyncDeviceDescriptors
Gives information for currently running LiveSync operation and parameters used to start it on each device.

* Definition
```TypeScript
/**
 * Returns the device information for current LiveSync operation of specified project.
 * In case LiveSync has been started on many devices, but stopped for some of them at a later point,
 * calling the method after that will return information only for devices for which LiveSync operation is in progress.
 * @param {string} projectDir The path to project for which the LiveSync operation is executed
 * @returns {ILiveSyncDeviceInfo[]} Array of elements describing parameters used to start LiveSync on each device.
*/
getLiveSyncDeviceDescriptors(projectDir: string): ILiveSyncDeviceInfo[];
```

* Usage
```JavaScript
const projectDir = "myProjectDir";
const deviceIdentifiers = [ "4df18f307d8a8f1b", "12318af23ebc0e25" ];
const currentlyRunningDescriptors = tns.liveSyncService.getLiveSyncDeviceDescriptors(projectDir);
console.log(`LiveSync for ${projectDir} is currently running on the following devices: ${currentlyRunningDescriptors.map(descriptor => descriptor.identifier)}`);
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

* liveSyncExecuted - raised whenever CLI finishes a LiveSync operation for specific device. When `liveSync` method is called, the initial LiveSync operation will emit `liveSyncExecuted` for each specified device once it finishes the operation. After that the event will be emitted whenever a change is detected (in case file system watcher is started) and the LiveSync operation is executed for each device. The event is raised with the following data:
```TypeScript
{
	projectDir: string;
	deviceIdentifier: string;
	applicationIdentifier: string;
	/**
	 * Full paths to files synced during the operation. In case the `syncedFiles.length` is 0, the operation is "fullSync" (i.e. all project files are synced).
	 */
	syncedFiles: string[];
	isFullSync: boolean;
}
```

Example:
```JavaScript
tns.liveSyncService.on("liveSyncExecuted", data => {
	console.log(`Executed LiveSync on ${data.deviceIdentifier} for ${data.applicationIdentifier}. Uploaded files are: ${data.syncedFiles.join(" ")}.`);
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
	console.log(`Error detected during LiveSync on ${data.deviceIdentifier} for ${data.projectDir}. Error: ${data.error.message}.`);
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
	console.log(`Notification: ${data.notification} for LiveSync operation on ${data.deviceIdentifier} for ${data.projectDir}. `);
});
```

* userInteractionNeeded - raised whenever CLI needs to restart an application but cannot so the user has to restart it manually. The event is raised with an object, which can later be passed to `attachDebugger` method of `liveSyncService`:

Example:
```JavaScript
tns.liveSyncService.on("userInteractionNeeded", data => {
	console.log("Please restart the app manually");
	return tns.liveSyncService.attachDebugger(data);
});
```

* debuggerAttached - raised whenever CLI attaches the backend debugging socket and a frontend debugging client may be attached. The event is raised with an object containing the device's identifier, url for debugging and port

Example:
```JavaScript
tns.liveSyncService.on("debuggerAttached", debugInfo => {
	console.log(`Backend client connected, frontend client may be connected at ${debugInfo.url} to debug app on device ${debugInfo.deviceIdentifier}. Port is: ${debugInfo.port}`);
});
```

* debuggerDetached - raised whenever CLI detaches the backend debugging socket. The event is raised with an object of the `IDebugInformation` type:

Example:
```JavaScript
tns.liveSyncService.on("debuggerDetached", debugInfo => {
	console.log(`Detached debugger for device with id ${debugInfo.deviceIdentifier}`);
});
```

## analyticsSettingsService
Provides methods for accessing the analytics settings file data.

### getClientId
The `getClientId` method allows retrieving the clientId used in the analytics tracking

* Definition:
```TypeScript
/**
 * Gets the clientId used for analytics tracking
 * @returns {Promise<string>} Client identifier in UUIDv4 standard.
 */
getClientId(): Promise<string>;
```

* Usage:
```JavaScript
tns.analyticsSettingsService.getClientId()
	.then(clientId => console.log(clientId));
```

### getUserAgentString
The `getUserAgentString` method allows retrieving a user agent string identifying the current system

* Definition:
```TypeScript
/**
 * Gets user agent string identifing the current system in the following format: `${identifier} (${systemInfo}) ${osArch}`
 * @param {string} identifier The product identifier.
 * @returns {string} The user agent string.
 */
getUserAgentString(identifier: string): string;
```

* Usage:
```JavaScript
const userAgentString = tns.analyticsSettingsService.getUserAgentString("tns/3.3.0");
```

### getPlaygroundInfo
The `getPlaygroundInfo` method allows retrieving information for projects that are exported from playground

* Definition:
```TypeScript
/**
 * Gets information for projects that are exported from playground.
 * Returns null in case when project does not have playground key in package.json file (e.g is not exported from playground) and no playground info is saved in userSettings file
 * @param {string} projectDir The project directory.
 * @returns {Promise<IPlaygroundInfo>} Playground info. { id: string, usedTutorial: boolean }
 */
getPlaygroundInfo(projectDir: string): Promise<IPlaygroundInfo>;
```

* Usage:
```JavaScript
tns.analyticsSettingsService.getPlaygroundInfo("/my/project/path")
	.then(playgroundInfo => {
		console.log(playgroundInfo.id);
		console.log(playgroundInfo.usedTutorial);
	});
```

## constants
Contains various constants related to NativeScript.

## assetsGenerationService
`assetsGenerationService` module allows generation of assets - icons and splashes.

### generateIcons
The `generateIcons` method generates icons for specified platform (or both iOS and Android in case platform is not specified) and places them on correct location in the specified project.

* Definition:
```TypeScript
/**
 * Generate icons for iOS and Android
 * @param {IResourceGenerationData} iconsGenerationData Provides the data needed for icons generation
 * @returns {Promise<void>}
 */
generateIcons({ imagePath: string, projectDir: string, platform?: string }): Promise<void>;
```

* Usage:
```JavaScript
tns.assetsGenerationService.generateIcons({ projectDir: "/Users/username/myNativeScriptProject", imagePath: "/Users/username/image.png" })
	.then(() => {
		console.log("Successfully generated icons");
	});
```


### generateSplashScreens
The `generateSplashScreens` method generates icons for specified platform (or both iOS and Android in case platform is not specified) and places them on correct location in the specified project.

* Definition:
```TypeScript
/**
 * Generate splash screens for iOS and Android
 * @param {ISplashesGenerationData} splashesGenerationData Provides the data needed for splash screens generation
 * @returns {Promise<void>}
 */
generateSplashScreens({ imagePath: string, projectDir: string, platform?: string, background?: string }): Promise<void>;
```

* Usage:
```JavaScript
tns.assetsGenerationService.generateSplashScreens({ projectDir: "/Users/username/myNativeScriptProject", imagePath: "/Users/username/image.png", background: "blue" })
	.then(() => {
		console.log("Successfully generated splash screens");
	});
```

## androidProcessService
The `androidProcessService` exposes methods for getting information about the applications working on Android devices.

### getAppProcessId
The `getAppProcessId` returns the PID of the specified application. If the app is not running on device, the method will return null.

* Definition
```TypeScript
/**
 * Gets the PID of a running application.
 * @param deviceIdentifier {string} The identifier of the device.
 * @param appIdentifier The identifier of the application.
 * @return {string} Returns the process id matching the application identifier in the device process list.
 */
getAppProcessId(deviceIdentifier: string, appIdentifier: string): Promise<string>;
```

* Usage
```JavaScript
tns.androidProcessService.getAppProcessId("4df18f307d8a8f1b", "org.nativescript.demoapp")
	.then(pid => console.log(`The PID is ${pid}`))
	.catch(err => console.error(`Error while checking for PID: ${err}`));
```

## sysInfo
The `sysInfo` module exposes methods to get the current environment setup and warnings for it.

### getSupportedNodeVersionRange
The `getSupportedNodeVersionRange` method gives information about the supported Node.js versions for the current CLI. The result is a valid semver range, for example `>=6.0.0`.

* Definition
```TypeScript
/**
 * Returns the value of engines.node key from CLI's package.json file.
 * @return {string} The range of supported Node.js versions.
 */
getSupportedNodeVersionRange(): string;
```

* Usage
```JavaScript
const nodeJsRange = tns.sysInfo.getSupportedNodeVersionRange();
console.log(nodeJsRange);
```

### getSystemWarnings
The `getSystemWarnings` methods returns all deprecation warnings for current environment. For example, in case the support for the current OS is deprecated by CLI, the method will return array with one message describing the deprecation.

* Definition
```TypeScript
/**
 * Gets all global warnings for the current environment, for example Node.js version compatibility, OS compatibility, etc.
 * @return {Promise<string[]>} All warnings. Empty array is returned in case the system is setup correctly.
 */
getSystemWarnings(): Promise<string[]>;
```

* Usage
```JavaScript
tns.sysInfo.getSystemWarnings()
	.then(warnings => {
		warnings.forEach(warn => console.log(warn));
	})
	.catch(err => console.error(`Error while trying to get system warnings: ${err}`));
```

## devicesService
The `devicesService` module allows interaction with devices and emulators. You can get a list of the available emulators or start a specific emulator.

### getEmulators
The `getEmulators` method returns object of all running and available emulators. The result is in the following format:
```JavaScript
	{
		android: {
			devices: Mobile.IDeviceInfo[],
			errors: string[]
		},
		ios: {
			devices: Mobile.IDeviceInfo[],
			errors: string[]
		}
	}
```

This method accepts platform parameter. If provided only devices by specified platform will be returned.

* Usage
```TypeScript
tns.devicesService.getEmulators()
	.then(availableEmulatorsOutput => {
		Object.keys(availableEmulatorsOutput)
			.forEach(platform => {
				availableEmulatorsOutput[platform].devices.forEach(device => console.log(device));
			})
	})
```

### startEmulator
The `startEmulator` method starts the emulator specified by provided options. Returns an array of errors if something unexpected happens or null otherwise.
* Usage
```TypeScript
tns.devicesService.startEmulator({imageIdentifier: "my emulator imageIdentifier"})
	.then(errors => { });
```

### startDeviceDetectionInterval
Starts device detection interval, which is run on specified number of seconds. This allows detection of new attached devices, started emulators/simulators, detection when device/emulator/simulator is disconnected, etc.
> NOTE: The interval is started automatically when you call `devicesService.initialize` without passing `skipDeviceDetectionInterval: true`.

> NOTE: iOS Device detection interval cannot be stopped, so once started, it will always report connected/disconnected devices.

* Definition
```TypeScript
startDeviceDetectionInterval({ detectionInterval?: number, platform?: string }): void
```

* Usage
```JavaScript
tns.devicesService.startDeviceDetectionInterval({ detectionInterval: 1000 });
```

### stopDeviceDetectionInterval
Stops device detection interval started by `devicesService.initialize` or `devicesService.startDeviceDetectionInterval`.
* Definition
```TypeScript
stopDeviceDetectionInterval(): void
```

* Usage
```JavaScript
tns.devicesService.stopDeviceDetectionInterval();
```

### startEmulatorDetectionInterval
Starts emulator images detection interval, which is run on specified number of seconds. This allows detection of new installed emulator/simulator images.

* Definition
```TypeScript
startEmulatorDetectionInterval({ detectionInterval?: number }): void
```

* Usage
```JavaScript
tns.devicesService.startEmulatorDetectionInterval({ detectionInterval: 1000 });
```

### stopEmulatorDetectionInterval
Stops device detection interval started by `devicesService.startEmulatorDetectionInterval`.
* Definition
```TypeScript
stopEmulatorDetectionInterval(): void
```

* Usage
```JavaScript
tns.devicesService.stopEmulatorDetectionInterval();
```

## deviceEmitter
This module is used to emit information for devices, applications on them, etc.

### deviceEmitterEvents
`deviceEmitter` emits the following events:
`deviceEmitter` module is used to emit different events related to devices attached to the system.
You can use `deviceEmitter` to add handles for the following events:

* `deviceFound` - Raised when a new device is attached to the system. The callback function will receive one argument - `deviceInfoData`.
Sample usage:
```JavaScript
tns.deviceEmitter.on("deviceFound", (deviceInfoData) => {
	console.log("Found device with identifier: " + deviceInfoData.identifier);
});
```

* `deviceLost` - Raised when a device is detached from the system. The callback function will receive one argument - `deviceInfoData`.
Sample usage:
```JavaScript
tns.deviceEmitter.on("deviceLost", (deviceInfoData) => {
	console.log("Detached device with identifier: " + deviceInfoData.identifier);
});
```

* `deviceLogData` - Raised when attached device reports any information. This is the output of `adb logcat` for Android devices. For iOS this is the `iOS SysLog`.
The event is raised for any device that reports data. The callback function has two arguments - `deviceIdentifier` and `reportedData`. <br/><br/>
Sample usage:
```JavaScript
tns.deviceEmitter.on("deviceLogData", (identifier, reportedData) => {
	console.log("Device " + identifier + " reports: " + reportedData);
});
```

* `applicationInstalled` - Raised when application is installed on a device. The callback has two arguments - `deviceIdentifier` and `applicationIdentifier`. <br/><br/>
Sample usage:
```JavaScript
tns.deviceEmitter.on("applicationInstalled", (identifier, applicationIdentifier) => {
	console.log("Application " + applicationIdentifier  + " has been installed on device with id: " + identifier);
});
```

* `applicationUninstalled` - Raised when application is removed from device. The callback has two arguments - `deviceIdentifier` and `applicationIdentifier`. <br/><br/>
Sample usage:
```JavaScript
tns.deviceEmitter.on("applicationUninstalled", (identifier, applicationIdentifier) => {
	console.log("Application " + applicationIdentifier  + " has been uninstalled from device with id: " + identifier);
});
```

* `debuggableAppFound` - Raised when application on a device becomes available for debugging. The callback has one argument - `applicationInfo`. <br/><br/>
Sample usage:
```JavaScript
tns.deviceEmitter.on("debuggableAppFound", (applicationInfo) => {
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
tns.deviceEmitter.on("debuggableAppLost", (applicationInfo) => {
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

* `emulatorImageFound` - Raised when a new Android Emulator Image or iOS Simulator is created/installed on the system. The callback has a single argument that describes the new image:
```JavaScript
tns.deviceEmitter.on("emulatorImageFound", (emulatorImageInfo) => {
	console.log("Added new emulator image", emulatorImageInfo);
});
```
`emulatorImageInfo` is of type [Moble.IDeviceInfo](https://github.com/telerik/mobile-cli-lib/blob/61cdaaaf7533394afbbe84dd4eee355072ade2de/definitions/mobile.d.ts#L9-L86).

* `emulatorImageLost` - Raised when an Android Emulator Image or iOS Simulator is removed from the system. The callback has a single argument that describes the removed image:
```JavaScript
tns.deviceEmitter.on("emulatorImageLost", (emulatorImageInfo) => {
	console.log("Removed emulator image", emulatorImageInfo);
});
```
`emulatorImageInfo` is of type [Moble.IDeviceInfo](https://github.com/telerik/mobile-cli-lib/blob/61cdaaaf7533394afbbe84dd4eee355072ade2de/definitions/mobile.d.ts#L9-L86).

## previewDevicesService
The `previewDevicesService` module allows interaction with preview devices. You can get a list of the connected preview devices and logs from specified device.

### previewDevicesEmitterEvents

* `deviceFound` - Raised when the QR code is scanned with any device. The callback function will receive one argument - `device`.
Sample usage:
```JavaScript
tns.previewDevicesService.on("deviceFound", device => {
	console.log("Attached device with identifier: " + device.id);
});
```

* `deviceLost` - Raised when the Preview app is stopped on a specified device. The callback function will receive one argument - `device`.
Sample usage:
```JavaScript
tns.previewDevicesService.on("deviceLost", device => {
	console.log("Detached device with identifier: " + device.id);
});
```

* `deviceLog` - Raised when the app deployed in Preview app reports any information. The event is raised for any device that reports data. The callback function has two arguments - `device` and `message`. <br/><br/>
Sample usage:
```JavaScript
tns.previewDevicesService.on("deviceLogData", (device, message) => {
	console.log("Device " + device.id + " reports: " + message);
});
```

## previewQrCodeService
The `previewQrCodeService` exposes methods for getting information about the QR of the Playground app and deployed app in Preview app.

### getPlaygroundAppQrCode
Returns information used to generate the QR code of the Playground app.

* Usage:
```TypeScript
tns.previewQrCodeService.getPlaygroundAppQrCode()
	.then(result => {
		console.log("QR code data for iOS platform: " + result.ios);
		console.log("QR code data for Android platform: " + result.android);
	});
```

## cleanupService
The `cleanupService` is used to handle actions that should be executed after CLI's process had exited. This is an internal service, that runs detached childProcess in which it executes CLI's cleanup actions once CLI is dead. As the process is detached, logs from it are not shown anywhere, so the service exposes a way to add log file in which the child process will write its logs.

### setCleanupLogFile
Defines the log file location where the child cleanup process will write its logs.

> NOTE: You must call this method immediately after requiring NativeScript CLI. In case you call it after the cleanup process had started, it will not use the passed log file.

* Definition
```TypeScript
/**
 * Sets the file in which the cleanup process will write its logs.
 * This method must be called before starting the cleanup process, i.e. when CLI is initialized.
 * @param {string} filePath Path to file where the logs will be written. The logs are appended to the passed file.
 * @returns {void}
 */
setCleanupLogFile(filePath: string): void;
```

* Usage
```JavaScript
const tns = require("nativescript");
tns.cleanupService.setCleanupLogFile("/Users/username/cleanup-logs.txt");
```

## initializeService
The `initializeService` is used to initialize CLI's configuration at the beginning and print all warnings related to current environment.

### initialize
This method executes initialization actions based on the passed parameters. In case `loggerOptions` are not passed, the default CLI logger will be used.
After initialization, the method will print all system warnings.

* Definition
```TypeScript
interface IInitializeOptions {
	loggerOptions?: ILoggerOptions;
	settingsServiceOptions?: IConfigurationSettings;
	extensibilityOptions?: { pathToExtensions: string };
}

interface IInitializeService {
	initialize(initOpts?: IInitializeOptions): Promise<void>;
}

```

> NOTE: For more information about loggerOptions, you can check `logger`.

* Usage
	* Initialization without passing any data - `logger` will be initialized with default CLI settings. Warnings will be printed if there are any.
	```JavaScript
	const tns = require("nativescript");
	tns.initializeService.initialize();
	```
	* Initialize with custom settings service options:
	```JavaScript
	const tns = require("nativescript");
	tns.initializeService.initialize({ settingsServiceOptions: { profileDir: "/Users/username/customDir", userAgentName: "MyApp" } });
	```
	* Initialize with custom extensibility path:
	```JavaScript
	const tns = require("nativescript");
	tns.initializeService.initialize({ extensibilityOptions: { pathToExtensions: "/Users/username/customDir/extensions" } });
	```

## logger

`logger` module is used to show any kind of information to the user. The `logger` uses `log4js` internally, which allows setting different levels for the messages.
The levels are available in `tns.constants.LoggerLevel` enum. Only messages from the current log level (or higher) are shown to the user, i.e. in case the log level is set to `INFO`, `DEBUG` and `TRACE` messages will not be shown to the user, but `WARN` and `ERROR` messages will be shown. </br>
`logger` module can be configured how to show the messages by using different appenders and layouts. </br>
* `appenders` are responsible for output of log events. They may write events to files, send emails, store them in a database, or anything. Most appenders use layouts to serialise the events to strings for output.
* `layout` is a function for converting a LogEvent into a string representation.

`log4js` has predefined appenders and layouts that can be used. In case you do not pass any options to logger's initialization, CLI will default to [console appender](https://log4js-node.github.io/log4js-node/console.html) with [messagePassThrough layout](https://log4js-node.github.io/log4js-node/layouts.html#message-pass-through) with `INFO` log level.</br>
You can override only the properties you want, i.e. only the log level, the layout or the appender. </br>
`nativescript` itself has additional appenders that you can use. More information about them can be found below. You can get a full list of the available appenders by checking the `tns.constants.LoggerAppenders` object. </br>

> NOTE: When CLI is used as a command-line tool, it uses a custom appender and layout in order to write coloured messages to stdout or stderr.

### initialize
The `initialize` method initializes the log4js settings - level, appender and layout. Once called, the settings cannot be changed anymore for the current process.

* Definition
```TypeScript
interface IAppenderOptions extends IDictionary<any> {
	type: string;
	layout?: Layout;
}

interface ILoggerOptions {
	level?: LoggerLevel;
	appenderOptions?: IAppenderOptions;
}

initialize(opts?: ILoggerOptions): void;
```

* Usage
  * Initialize with default settings:
	```JavaScript
	tns.logger.initialize();
	```
  * Initialize with DEBUG log level:
	```JavaScript
	tns.logger.initialize({ level: tns.constants.LoggerLevel.DEBUG });
	```
  * Initialize with different appender, for example [fileSync](https://log4js-node.github.io/log4js-node/fileSync.html) appender:
	```JavaScript
	tns.logger.initialize({ appenderOptions: { type: "fileSync" } });
	```
  * Initialize with different layout, for example [Pattern](https://log4js-node.github.io/log4js-node/layouts.html#pattern) layout:
	```JavaScript
	tns.logger.initialize({ appenderOptions: { layout: { type: "pattern" } } });
	```
  * Initialize with custom appender, layout and level:
	```JavaScript
	tns.logger.initialize({ appenderOptions: { type: "fileSync", layout: { type: "pattern" } }, level: tns.constants.LoggerLevel.DEBUG });
	```

### getLevel
This method returns information for the current log level.

* Definition
```TypeScript
getLevel(): string;
```

* Usage
```JavaScript
console.log(`Current log level is: ${tns.logger.getLevel()}`);
```

### appenders
The `appenders` are log4js concept. `appenders` are responsible for output of log events. You can use all predefined [log4js appenders](https://log4js-node.github.io/log4js-node/appenders.html) and also several predefined CLI appenders

#### emit-appender
The `emit-appender` is used to emit the log events through a passed emitter instead of writing the messages. Whenever a message should be shown, the `emit-appender` emits `logData` event with an object containing the `loggingEvent` and the message passed through the specified layout stored in `formattedMessage` property.

* Usage:
```JavaScript
const tns = require("nativescript");
const { EventEmitter } = require("events");
const { EMIT_APPENDER_EVENT_NAME, LoggerAppenders } = tns.constants;
const emitter = new EventEmitter();
// IMPORTANT: Add the event handler before calling logger's initialize method.
// This is required as log4js makes a copy of the appenderOptions, where the emitter is passed
// NOTE: In case you want to debug the event handler, place `debugger` in it.
emitter.on(EMIT_APPENDER_EVENT_NAME, (logData) => {
	if (logData.loggingEvent.level.levelStr === LoggerLevel.WARN) {
		console.log(`WARNING: ${logData.formattedMessage}`);
	}
});

const logger = tns.logger;
logger.initialize({
	appenderOptions: {
		type: LoggerAppenders.emitAppender,
		emitter
	}
});
```

> NOTE: In several cases CLI passes additional configuration properties in the `context` of the `loggingEvent`. Full list is available in the `tns.constants.LoggerConfigData` object. These properties are used by CLI's layout and appender to change the way the message is printed on the terminal and if it should be on stderr or stdout.

#### cli-appender
`cli-appender` prints messages to stdout or stderr based on the passed options for the message.

* Usage
```JavaScript
const tns = require("nativescript");
const { EventEmitter } = require("events");
const { EMIT_APPENDER_EVENT_NAME, LoggerAppenders } = tns.constants;

const logger = tns.logger;
logger.initialize({
	appenderOptions: {
		type: LoggerAppenders.cliAppender,
	}
});
```

### custom layouts
You can define your own layout function in the following way:
```JavaScript
const log4js = require("nativescript/node_modules/log4js");
const util = require("util");
log4js.addLayout("myCustomLayout", (config) => {
    return (loggingEvent) => {
        return util.format.apply(null, loggingEvent.data);
    }
});

tns.logger.initialize({ appenderOptions: { layout: { type: "myCustomLayout" } } });
```

## How to add a new method to Public API
CLI is designed as command line tool and when it is used as a library, it does not give you access to all of the methods. This is mainly implementation detail. Most of the CLI's code is created to work in command line, not as a library, so before adding method to public API, most probably it will require some modification.
For example the `$options` injected module contains information about all `--` options passed on the terminal. When the CLI is used as a library, the options are not populated. Before adding method to public API, make sure its implementation does not rely on `$options`.

More information how to add a method to public API is available [here](https://github.com/telerik/mobile-cli-lib#how-to-make-a-method-public).
After that add each method that you've exposed to the tests in `tests/nativescript-cli-lib.ts` file. There you'll find an object describing each publicly available module and the methods that you can call.
