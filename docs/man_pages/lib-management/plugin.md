<% if (isJekyll) { %>---
title: tns plugin
position: 10
---<% } %>
# tns plugin
==========

Usage | Synopsis
---|---
List plugins | `$ tns plugin`
Manage plugins | `$ tns plugin <Command>`

Lets you manage the plugins for your project.

### Attributes
`<Command>` extends the `plugin` command. You can set the following values for this attribute.
* `add` - Installs the specified plugin and its dependencies.
* `remove` - Uninstalls the specified plugin and its dependencies.
* `update` - Uninstalls and installs the specified plugin(s) and its dependencies.
* `find` - Finds NativeScript plugins in npm.
* `search` - Finds NativeScript plugins in npm.
* `build` - Builds the Android parts of a NativeScript plugin.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[plugin add](plugin-add.html) | Installs the specified plugin and its dependencies.
[plugin remove](plugin-remove.html) | Uninstalls the specified plugin and its dependencies.
[plugin update](plugin-update.html) | Updates the specified plugin(s) and its dependencies.
[plugin build](plugin-build.html) | Builds the Android project of a NativeScript plugin, and updates the `include.gradle`.
<% } %>
