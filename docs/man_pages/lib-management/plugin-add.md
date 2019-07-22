<% if (isJekyll) { %>---
title: tns plugin add
position: 1
---<% } %>

# tns plugin add

### Description

<% if(isConsole) { %>Installs the specified plugin and any packages that it depends on.<% } %>
<% if(isHtml) { %>Installs the specified plugin and its dependencies in the local `node_modules` folder, adds it to the `dependencies` section in `package.json`, and prepares the plugin for all installed platforms. If you have not configured any platforms for the project, the NativeScript CLI will prepare the plugin when you add a platform.<% } %>

### Commands

Usage | Synopsis
------|-------
General | `$ tns plugin add <Plugin>`
Alias | `$ tns plugin install <Plugin>`

### Arguments

* `<Plugin>` is a valid NativeScript plugin, specified by any of the following.
    * A `<Name>` or `<Name>@<Version>` where `<Name>` is the name of a plugin that is published in the npm registry and `<Version>` is a valid version of this plugin.
    * A `<Local Path>` to the directory which contains the plugin, including its `package.json` file.
    * A `<Local Path>` to a `.tar.gz` archive containing a directory with the plugin and its `package.json` file.
    * A `<URL>` which resolves to a `.tar.gz` archive containing a directory with the plugin and its `package.json` file.
    * A `<git Remote URL>` which resolves to a `.tar.gz` archive containing a directory with the plugin and its `package.json` file.

<% if(isHtml) { %>

### Prerequisites

* Verify that the plugin that you want to add contains a valid `package.json` file. Valid `package.json` files contain a `nativescript` section.

### Related Commands

Command | Description
----------|----------
[plugin](plugin.html) | Lets you manage the plugins for your project.
[plugin install](plugin-install.html) | Installs the specified plugin and its dependencies.
[plugin remove](plugin-remove.html) | Uninstalls the specified plugin and its dependencies.
<% } %>
