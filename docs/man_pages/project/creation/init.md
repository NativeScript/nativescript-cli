init
==========

Usage | Synopsis
---|---
General | `$ tns init [--path <Directory>] [--force]`

Initializes a project for development. The command prompts you to provide your project configuration interactively and uses the information to create a new `package.json` file or update the existing one.

### Options
* `--path` - Specifies the directory where you want to initialize the project, if different from the current directory. The directory must be empty.
* `--force` - If set, applies the default project configuration and does not show the interactive prompt. The default project configuration targets the latest official runtimes and sets `org.nativescript.<folder_name>` for application identifier.

<% if(isHtml) { %> 
### Related Commands

Command | Description
----------|----------
[create](create.html) | Creates a new project for native development with NativeScript from the default template or from an existing NativeScript project.
[install](/lib-management/install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
<% } %> 