<% if (isJekyll) { %>---
title: tns extension uninstall
position: 8
---<% } %>

# tns extension uninstall

### Description

Uninstalls the specified extension, after which you will no longer be able to use the functionality added by this extensions to the NativeScript CLI.

### Commands

Usage | Synopsis
------|-------
General | `$ tns extension uninstall <Extension>`

### Arguments

* `<Extension>` is the name of the extension as listed in its `package.json` file.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[extension](extension.html) | Prints information about all installed extensions.
[extension-uninstall](extension-uninstall.html) | Uninstalls specified extension.
[extension-install](extension-install.html) | Installs specified extension.
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