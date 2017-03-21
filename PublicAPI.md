Public API
==

This document describes all methods that can be invoked when NativeScript CLI is required as library, i.e.

<table>
	<tr>
        <td>
        	JavaScript
        </td>
        <td>
        	TypeScript
        </td>
    </tr>
    <tr>
    	<td>
<pre lang="javascript">
const tns = require("nativescript");
</pre>
        </td>
    	<td>
<pre lang="typescript">
import * as tns from "nativescript";
</pre>
        </td>
    </tr>

</table>

## Module projectService

`projectService` modules allow you to create new NativeScript application.

* `createProject(projectSettings: IProjectSettings): Promise<void>` - Creates new NativeScript application. By passing `projectSettings` argument you specify the name of the application, the template that will be used, etc.:
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

Sample usage:
<table>
	<tr>
        <td>
        	JavaScript
        </td>
        <td>
        	TypeScript
        </td>
    </tr>
    <tr>
    	<td>
<pre lang="javascript">
const projectSettings = {
	projectName: "my-ns-app",
    template: "ng",
    pathToProject: "/home/my-user/project-dir"
};

tns.projectService.createProject(projectSettings)
	.then(() => console.log("Project successfully created."))
    .catch((err) => console.log("Unable to create project, reason: ", err);
</pre>
        </td>
    	<td>
<pre lang="typescript">
const projectSettings: IProjectSettings = {
	projectName: "my-ns-app",
    template: "ng",
    pathToProject: "/home/my-user/project-dir"
};

tns.projectService.createProject(projectSettings)
	.then(() => console.log("Project successfully created."))
    .catch((err) => console.log("Unable to create project, reason: ", err);
</pre>
        </td>
    </tr>
</table>

* `isValidNativeScriptProject(projectDir: string): boolean` - Checks if the specified path is a valid NativeScript project. Returns `true` in case the directory is a valid project, `false` otherwise.

Sample usage:
<table>
	<tr>
        <td>
        	JavaScript
        </td>
        <td>
        	TypeScript
        </td>
    </tr>
    <tr>
    	<td>
<pre lang="javascript">
const isValidProject = tns.projectService.isValidNativeScriptProject("/tmp/myProject");
</pre>
        </td>
    	<td>
<pre lang="typescript">
const isValidProject = tns.projectService.isValidNativeScriptProject("/tmp/myProject");
</pre>
        </td>
    </tr>
</table>

## How to add a new method to Public API
CLI is designed as command line tool and when it is used as a library, it does not give you access to all of the methods. This is mainly implementation detail. Most of the CLI's code is created to work in command line, not as a library, so before adding method to public API, most probably it will require some modification.
For example the `$options` injected module contains information about all `--` options passed on the terminal. When the CLI is used as a library, the options are not populated. Before adding method to public API, make sure its implementation does not rely on `$options`.

More information how to add a method to public API is available [here](https://github.com/telerik/mobile-cli-lib#how-to-make-a-method-public).
After that add each method that you've exposed to the tests in `tests/nativescript-cli-lib.ts` file. There you'll find an object describing each publicly available module and the methods that you can call.
