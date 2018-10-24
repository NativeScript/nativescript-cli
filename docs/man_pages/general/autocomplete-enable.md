<% if (isJekyll) { %>---
title: tns autocomplete enable
position: 2
---<% } %>

# tns autocomplete enable

### Description

Enables command-line completion for bash and zsh shells. You need to restart the shell to complete the operation.

<% if(isHtml) { %>> <% } %>NOTE: This operation might modify the `.bash_profile`, `.bashrc` and `.zshrc` files.

### Commands

Usage | Synopsis
------|-------
General | `$ tns autocomplete enable`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[autocomplete](autocomplete.html) | Asks for confirmation if command line autocompletion should be enabled for bash and zsh.
[autocomplete-status](autocomplete-status.html) | Prints the current status of your command-line completion settings.
[autocomplete-disable](autocomplete-disable.html) | Disables command-line completion for bash and zsh shells.
[usage-reporting](usage-reporting.html) | Configures anonymous usage reporting for the NativeScript CLI.
[error-reporting](error-reporting.html) | Configures anonymous error reporting for the NativeScript CLI.
[help](help.html) | Lists the available commands or shows information about the selected command.
[doctor](doctor.html) | Checks your system for configuration problems which might prevent the NativeScript CLI from working properly.
[proxy](proxy.html) | Displays proxy settings.
[proxy clear](proxy-clear.html) | Clears proxy settings.
[proxy set](proxy-set.html) | Sets proxy settings.
[update](update.html) | Updates the project with the latest versions of iOS/Android runtimes and cross-platform modules.
<% } %>