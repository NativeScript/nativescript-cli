<% if (isJekyll) { %>---
title: ns autocomplete
position: 4
---<% } %>

# ns autocomplete

### Description

Prints your current command-line completion settings. If disabled, prompts you to enable it.

<% if(isHtml) { %>> <% } %>NOTE: This operation might modify the `.bash_profile`, `.bashrc` and `.zshrc` files.

### Commands

Usage | Synopsis
------|-------
General | `$ ns autocomplete [<Command>]`
Get settings | `$ ns autocomplete status`
Enable | `$ ns autocomplete enable`
Disable | `$ ns autocomplete disable`

### Arguments

`<Command>` extends the `autocomplete` command. You can set the following values for this attribute.
* `status` - Prints your current command-line completion settings.
* `enable` - Enables command-line completion. You need to restart the shell to complete the operation.
* `disable` - Disables command-line completion. You need to restart the shell to complete the operation.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
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