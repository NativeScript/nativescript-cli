<% if (isJekyll) { %>---
title: ns proxy
position: 14
---<% } %>

# ns proxy

### Description

Displays the current proxy settings of the NativeScript CLI.

### Commands

Usage | Synopsis
------|-------
General | `$ ns proxy [<Command>]`

### Arguments
`<Command>` extends the `proxy` command. You can set the following values for this attribute:
* `set` - Sets proxy settings
* `clear` - Clears proxy settings

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[proxy clear](proxy-clear.html) | Clears proxy settings.
[proxy set](proxy-set.html) | Sets proxy settings.
<% } %>
