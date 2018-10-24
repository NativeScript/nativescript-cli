<% if (isJekyll) { %>---
title: tns update
position: 15
---<% } %>

# tns update

### Description

Updates the project with the latest versions of iOS/Android runtimes and cross-platform modules.
In order to get the latest development release instead, pass `next` as argument:
`tns update next`

You can also switch to specific version by passing it to the command:
`tns update 5.0.0`

### Commands

Usage | Synopsis
------|-------
General | `$ tns update`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[usage-reporting](usage-reporting.html) | Configures anonymous usage reporting for the NativeScript CLI.
[error-reporting](error-reporting.html) | Configures anonymous error reporting for the NativeScript CLI.
[autocomplete](autocomplete.html) | Prints your current command-line completion settings. If disabled, prompts you to enable it.
[help](help.html) | Lists the available commands or shows information about the selected command.
[doctor](doctor.html) | Checks your system for configuration problems which might prevent the NativeScript CLI from working properly.
[proxy](proxy.html) | Displays proxy settings.
[proxy clear](proxy-clear.html) | Clears proxy settings.
[proxy set](proxy-set.html) | Sets proxy settings.
[update](update.html) | Updates the project with the latest versions of iOS/Android runtimes and cross-platform modules.
<% } %>
