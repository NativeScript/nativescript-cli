<% if (isJekyll) { %>---
title: tns device android
position: 1
---<% } %>

# tns device android

### Description

Lists all recognized connected Android physical and running virtual devices with serial number and index. <% if(isHtml) { %>If a connected Android device is not shown in the list, make sure that you have installed the required Android USB drivers on your system and that USB debugging is enabled on the device.<% } %>

### Commands

Usage | Synopsis
------|-------
General | `$ tns device android [--timeout <Milliseconds>]`

### Options

* `--available-devices` - Lists all available emulators for Android.
* `--timeout` - Sets the time in milliseconds for the operation to search for connected devices before completing. If not set, the default value is 4000. <% if(isHtml) { %>The operation will continue to wait and listen for newly connected devices and will list them after the specified time expires.

### Related Commands

Command | Description
----------|----------
[device](device.html) | Lists all recognized connected devices with serial number and index, grouped by platform.
[device ios](device-ios.html) | Lists all recognized connected iOS devices with serial number and index.
[device list-applications](device-list-applications.html) | Lists the installed applications on all connected Android and iOS devices.
[device log](device-log.html) | Opens the device log stream for a selected connected device.
[device run](device-run.html) | Runs the selected application on a connected Android or iOS device.
<% } %>