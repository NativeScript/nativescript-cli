<% if (isJekyll) { %>---
title: tns plugin build
position: 8
---<% } %>

# tns plugin build

### Description

<% if(isConsole) { %>Attempts to build the plugin's Android-specific project files located in `platforms/android`. Strips and removes `include.gradle` flavor declarations, if any are present. <% } %>
<% if(isHtml) { %>Attempts to build the plugin's Android-specific project files located in `platforms/android`. The resulting Android Library (aar), and the generated Android Gradle project used to build the library can be found at `platforms/android`. Also strips and removes `include.gradle` flavor declarations, if any are present. For more information about working with plugins, see [NativeScript Plugins](https://github.com/NativeScript/nativescript-cli/blob/master/PLUGINS.md).<% } %>

### Commands

Usage | Synopsis
------|-------
General | `$ tns plugin build`

<% if(isHtml) { %>

### Prerequisites

* Verify that the command is being executed in the source directory of a plugin - e.g. `nativescript-barcodescanner/src`

### Related Commands

Command | Description
----------|----------
[plugin](plugin.html) | Lets you manage the plugins for your project.
[plugin install](plugin-install.html) | Installs the specified plugin and its dependencies.
[plugin remove](plugin-remove.html) | Uninstalls the specified plugin and its dependencies.
<% } %>
