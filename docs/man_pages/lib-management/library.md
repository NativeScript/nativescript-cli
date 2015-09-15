library
==========

Usage | Synopsis
---|---
General | `$ tns library <Command>`

Lets you manage third-party native libraries in your project. You must run the `library` command with a command extension.

IMPORTANT: The `tns library` command is deprecated and will be removed in a future release. Use the `tns plugin` set of commands instead. For more information, <% if(isHtml) { %>see the [plugin](plugin.html) set of commands.<% } %><% if(isConsole) { %>run `tns help plugin`.<% } %>.

### Attributes
`<Command>` extends the `library` command. You can set the following values for this attribute.
* `add` - Adds a locally stored native library to the current project.

<% if(isHtml) { %>
### Related Commands

Command | Description
----------|----------
[library add](library-add.html) | Adds a native library to the current project.
<% } %>