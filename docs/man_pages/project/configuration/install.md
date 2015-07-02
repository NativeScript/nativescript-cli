install
==========

Usage | Synopsis
---|---
General | `$ tns install [--path]`

Installs all platforms and dependencies described in the `package.json` file in the current directory.

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