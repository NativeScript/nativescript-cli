<% if (isJekyll) { %>---
title: ns help
position: 10
---<% } %>

# ns help

### Description

Opens the command reference for all commands in your browser or shows information about the selected command in the browser.

To list all commands available in the console, run `$ ns -h`.
To print information about a selected command in the console, run `$ ns <Command> -h`.

### Commands

Usage | Synopsis
------|-------
General | `$ ns help [<Command>]`

### Arguments

* `<Command>` is any of the available commands as listed by `$ ns help` or `$ ns -h`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[usage-reporting](usage-reporting.html) | Configures anonymous usage reporting for the NativeScript CLI.
[error-reporting](error-reporting.html) | Configures anonymous error reporting for the NativeScript CLI.
[autocomplete](autocomplete.html) | Prints your current command-line completion settings. If disabled, prompts you to enable it.
[doctor](doctor.html) | Checks your system for configuration problems which might prevent the NativeScript CLI from working properly.
[info](info.html) | Displays version information about the NativeScript CLI, core modules, and runtimes.
[proxy](proxy.html) | Displays proxy settings.
[proxy clear](proxy-clear.html) | Clears proxy settings.
[proxy set](proxy-set.html) | Sets proxy settings.
<% } %>
