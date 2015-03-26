library add
==========

Usage | Syntax
------|-------
General | `$ tns library add <Platform> <Library path>`
Android | `$ tns library add android <Library path>`
iOS | `$ tns library add ios <Library path>`

Copies the native library at `<Library path>` to the current project and adds it to the native build for the selected platform.
The NativeScript runtime will expose the APIs available in the native library in your application.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[library](library.html) | You must run the library command with a related command.
<% } %>