<% if (isJekyll) { %>---
title: tns device
position: 6
---<% } %>

# tns device

### Description

Lists all recognized connected Android <% if(isWindows || isMacOS) { %>or iOS devices <% } %>with serial number and index<% if(isWindows || isMacOS) { %>, grouped by platform<% } %>.

### Commands

Usage | Synopsis
------|---------
General | `$ tns device [<Command>]`

### Arguments

`<Command>` extends the `device` command. You can set the following values for this argument:
* `android` - Lists all recognized connected Android physical and running Android virtual devices.
<% if(isWindows || isMacOS) { %>* `ios` - Lists all recognized connected iOS devices. <% } %>
* `log` - Opens the device log stream for a selected connected device.
* `list-applications` - Lists the installed applications on all connected Android <% if(isWindows || isMacOS) { %>or iOS <%}%>devices.
* `run` - Runs the selected application on a connected Android <% if(isMacOS) { %>or iOS <%}%>device.

<% if(isHtml) { %>

### Command Limitations

* You can run `$ tns device ios` on Windows and macOS systems.

### Aliases

* You can use `$ tns devices` as an alias for `$ tns device`.

### Related Commands

Command | Description
----------|----------
[device android](device-android.html) | Lists all recognized connected physical and running virtual devices with serial number and index.
[device ios](device-ios.html) | Lists all recognized connected iOS devices with serial number and index.
[device list-applications](device-list-applications.html) | Lists the installed applications on all connected Android and iOS devices.
[device log](device-log.html) | Opens the device log stream for a selected connected device.
[device run](device-run.html) | Runs the selected application on a connected Android or iOS device.
<% } %>