install
==========

Usage | Synopsis
---|---
General | `$ tns install [module] [--path]`

When executed without a `module` argument - install all platforms and dependencies described in the `package.json` file in the current directory.

When a `module` argument is given - install the specified npm module. If `module` is a path to an existing directory, then the npm module from that path is installed. If `module` does not refer to an existing directory, then the module with the name `nativescript-dev-<module>` is installed from the npm registry. This command is intended for installing NativeScript-related development modules. For example, by executing `tns install typescript`, TypeScript support is installed into the project. Look for modules in the npm registry whose name starts with `nativescript-dev` to discover other development modules for NativeScript.

<% if(isHtml) { %>
The `package.json` file must be a valid `package.json` describing the configuration of a NativeScript project. If missing or corrupted, you can recreate the file by running `$ tns init` in the directory of a NativeScript project.
<% } %>

### Options
* `--path` - Specifies the directory which contains the `package.json` file, if different from the current directory.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[platform](platform.html) | Lists all platforms that the project currently targets.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>