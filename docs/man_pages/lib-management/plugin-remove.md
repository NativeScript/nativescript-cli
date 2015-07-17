plugin remove 
==========

Usage | Synopsis
------|-------
General | `$ tns plugin remove <Plugin>`

<% if(isConsole) { %>Uninstalls a plugin by its name.<% } %>
<% if(isHtml) { %>Removes the specified plugin and its dependencies from the local `node_modules` folder and the `dependencies` section in `package.json`. This operation does not remove the plugin from the installed platforms and you need to run `$ tns prepare` to finish uninstalling the plugin. For more information about working with plugins, see [NativeScript Plugins](https://github.com/NativeScript/nativescript-cli/blob/master/PLUGINS.md).<% } %>

### Attributes

* `<Plugin>` is the name of the plugin as listed in its `package.json` file.

<% if(isHtml) { %> 
### Related Commands

Command | Description
----------|----------
[library](library.html) | You must run the library command with a related command.
[library add](library-add.html) | Adds a native library to the current project.
[plugin](plugin.html) | Lets you manage the plugins for your project.
[plugin add](plugin-add.html) | Installs the specified plugin and its dependencies.
<% } %>