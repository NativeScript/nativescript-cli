<% if (isJekyll) { %>---
title: tns plugin remove
position: 4
---<% } %>

# tns plugin remove

### Description

<% if(isConsole) { %>Uninstalls a plugin by its name.<% } %>
<% if(isHtml) { %>Removes the specified plugin and its dependencies from the local `node_modules` folder and the `dependencies` section in `package.json`. This operation does not remove the plugin from the installed platforms and you need to run `$ tns prepare` to finish uninstalling the plugin.<% } %>

### Commands

Usage | Synopsis
------|-------
General | `$ tns plugin remove <Plugin>`

### Arguments

* `<Plugin>` is the name of the plugin as listed in its `package.json` file.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[plugin](plugin.html) | Lets you manage the plugins for your project.
[plugin add](plugin-add.html) | Installs the specified plugin and its dependencies.
<% } %>
