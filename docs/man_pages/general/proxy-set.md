proxy set
==========

Usage | Synopsis
------|-------
General | `$ tns proxy set [<Hostname> [<Port><% if(isWindows) {%> [<Username> [<Password>]]<%}%>]]`

Sets proxy settings.

### Attributes
* `<Hostname>` the hostname of the proxy. If you do not provide this when running the command, the NativeScript CLI will prompt you to provide it.
* `<Port>` the port of the proxy. If you do not provide this when running the command, the NativeScript CLI will prompt you to provide it.
<% if(isWindows) {%>
* `<Username>` and `<Password>` are your credentials for the proxy. These are not necessary, however if you provide a `<Username>` you need to provide a `<Password>` too.
<% } %>

<% if(isHtml) { %>
### Command Limitations

* You can set credentials only on Windows Systems.

### Related Commands

Command | Description
----------|----------
[proxy](proxy.html) | Displays proxy settings.
[proxy clear](proxy-clear.html) | Clears proxy settings.
<% } %>
