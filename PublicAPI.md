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

## How to add a new method to Public API
CLI is designed as command line tool and when it is used as a library, it does not give you access to all of the methods. This is mainly implementation detail. Most of the CLI's code is created to work in command line, not as a library, so before adding method to public API, most probably it will require some modification.
For example the `$options` injected module contains information about all `--` options passed on the terminal. When the CLI is used as a library, the options are not populated. Before adding method to public API, make sure its implementation does not rely on `$options`.

More information how to add a method to public API is available [here](https://github.com/telerik/mobile-cli-lib#how-to-make-a-method-public).
After that add each method that you've exposed to the tests in `tests/nativescript-cli-lib.ts` file. There you'll find an object describing each publicly available module and the methods that you can call.
