<% if (isJekyll) { %>---
title: tns extension install
position: 7
---<% } %>

# tns extension install

### Description

Installs specified extension. Each extension adds additional functionality that's accessible directly from NativeScript CLI.

### Commands

Usage | Synopsis
------|-------
General | `$ tns extension install <Extension>`

### Arguments

* `<Extension>` can be any of the following.
    * A `<Name>` or `<Name>@<Version>` where `<Name>` is the name of a package that is published in the npm registry and `<Version>` is a valid version of this plugin.
    * A `<Local Path>` to the directory which contains the extension, including its `package.json` file.
    * A `<Local Path>` to a `.tar.gz` archive containing a directory with the extension and its `package.json` file.
    * A `<URL>` which resolves to a `.tar.gz` archive containing a directory with the extension and its `package.json` file.
    * A `<git Remote URL>` which resolves to a `.tar.gz` archive containing a directory with the extension and its `package.json` file.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[extension](extension.html) | Prints information about all installed extensions.
[extension-uninstall](extension-uninstall.html) | Uninstalls specified extension.
[autocomplete-status](autocomplete-status.html) | Prints the current status of your command-line completion settings.
[autocomplete-enable](autocomplete-enable.html) | Configures your current command-line completion settings.
[autocomplete-disable](autocomplete-disable.html) | Disables command-line completion for bash and zsh shells.
[usage-reporting](usage-reporting.html) | Configures anonymous usage reporting for the NativeScript CLI.
[error-reporting](error-reporting.html) | Configures anonymous error reporting for the NativeScript CLI.
[doctor](doctor.html) | Checks your system for configuration problems which might prevent the NativeScript CLI from working properly.
[proxy](proxy.html) | Displays proxy settings.
[proxy clear](proxy-clear.html) | Clears proxy settings.
[proxy set](proxy-set.html) | Sets proxy settings.
[update](update.html) | Updates the project with the latest versions of iOS/Android runtimes and cross-platform modules.
<% } %>