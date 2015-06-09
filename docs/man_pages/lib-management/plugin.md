plugin 
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

<% if(isHtml) { %> 
### Related Commands

Command | Description
----------|----------
[library](library.html) | You must run the library command with a related command.
[library add](library-add.html) | Adds a native library to the current project.
[plugin add](plugin-add.html) | Installs the specified plugin and its dependencies.
[plugin remove](plugin-remove.html) | Uninstalls the specified plugin and its dependencies.
<% } %>