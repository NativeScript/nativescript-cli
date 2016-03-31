plugin search
==========

Usage | Synopsis
---|---
General | `$ tns plugin search [<PluginName>] [--all] [--count <Count>]`

Finds NativeScript plugins in npm.

### Options
* `--all` - Specifies that all results will be shown at once.
* `--count` - Specifies the number of results to show at a time. If not set, the default value is 10. After showing the specified number of results, the CLI will prompt you to continue showing more results or to exit the operation.

> **NOTE:** You cannot set --all and --count simultaneously.

### Attributes
* `<PluginName>` is the name of plugin that you want to find. When specified the search string in npm will be "`nativescript <PluginName>`".
* `<Count>` is the number of the plugins to display.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[plugin](plugin.html) | Lets you manage the plugins for your project.
[plugin add](plugin-add.html) | Installs the specified plugin and its dependencies.
[plugin remove](plugin-remove.html) | Uninstalls the specified plugin and its dependencies.
[plugin find](plugin-find.html) | Finds NativeScript plugins in npm.
<% } %>
