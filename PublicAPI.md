Public API
==

This document describes all methods that can be invoked when NativeScript CLI is required as library, i.e.

```JavaScript
const tns = require("nativescript");
```

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
Installs specified extension and loads it in the current process, so the functionality that it adds can be used immediately.

* Definition:
```TypeScript
/**
 * Installs and loads specified extension.
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

## How to add a new method to Public API
CLI is designed as command line tool and when it is used as a library, it does not give you access to all of the methods. This is mainly implementation detail. Most of the CLI's code is created to work in command line, not as a library, so before adding method to public API, most probably it will require some modification.
For example the `$options` injected module contains information about all `--` options passed on the terminal. When the CLI is used as a library, the options are not populated. Before adding method to public API, make sure its implementation does not rely on `$options`.

More information how to add a method to public API is available [here](https://github.com/telerik/mobile-cli-lib#how-to-make-a-method-public).
After that add each method that you've exposed to the tests in `tests/nativescript-cli-lib.ts` file. There you'll find an object describing each publicly available module and the methods that you can call.