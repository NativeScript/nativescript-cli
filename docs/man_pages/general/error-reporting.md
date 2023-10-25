<% if (isJekyll) { %>---
title: ns error-reporting
position: 6
---<% } %>

# ns error-reporting

### Description

Configures anonymous error reporting for the NativeScript CLI. All data gathered is used strictly for improving the product and will never be used to identify or contact you.

### Commands

Usage | Synopsis
------|-------
General | `$ ns error-reporting [<Command>]`

### Arguments

`<Command>` extends the `error-reporting` command. You can set the following values for this attribute.
* `status` - Shows the current configuration for anonymous error reporting for the NativeScript CLI.
* `enable` - Enables anonymous error reporting.
* `disable` - Disables anonymous error reporting.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[usage-reporting](usage-reporting.html) | Configures anonymous usage reporting for the NativeScript CLI.
[autocomplete](autocomplete.html) | Enables command-line completion for bash and zsh shells.
[autocomplete-status](autocomplete-status.html) | Prints the current status of your command-line completion settings.
[autocomplete-enable](autocomplete-enable.html) | Enables command-line completion for bash and zsh shells.
[autocomplete-disable](autocomplete-disable.html) | Disables command-line completion for bash and zsh shells.
[doctor](doctor.html) | Checks your system for configuration problems which might prevent the NativeScript CLI from working properly.
[proxy](proxy.html) | Displays proxy settings.
[proxy clear](proxy-clear.html) | Clears proxy settings.
[proxy set](proxy-set.html) | Sets proxy settings.
[update](update.html) | Updates the project with the latest versions of iOS/Android runtimes and cross-platform modules.
<% } %>