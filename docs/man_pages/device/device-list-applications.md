<% if (isJekyll) { %>---
title: tns device list-applications
position: 3
---<% } %>

# tns device list-applications

### Description

Lists the installed applications on all connected Android <% if(isWindows || isMacOS) { %>and iOS <% } %>devices.

### Commands

Usage | Synopsis
------|-------
General | `$ tns device list-applications [--device <Device ID>]`

### Options

* `--device` - If multiple devices are connected, sets the device for which you want to list all currently installed applications. `<Device ID>` is the device index or identifier as listed by the `$ tns device` command.

<% if(isHtml) { %>

### Command Limitations

* You cannot work with connected iOS devices on Linux systems.

### Related Commands

Command | Description
----------|----------
[device android](device-android.html) | Lists all recognized connected physical and running virtual devices with serial number and index.
[device ios](device-ios.html) | Lists all recognized connected iOS devices with serial number and index.
[device log](device-log.html) | Opens the device log stream for a selected connected device.
[device run](device-run.html) | Runs the selected application on a connected Android or iOS device.
[device](device.html) | Lists all recognized connected devices with serial number and index, grouped by platform.
<% } %>