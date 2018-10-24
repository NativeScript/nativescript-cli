<% if (isJekyll) { %>---
title: tns device run
position: 5
---<% } %>

# tns device run

### Description

Runs the selected application on a connected Android <% if(isMacOS) { %>or iOS <% } %>device.

<% if(isConsole && (isWindows || isLinux)) { %>WARNING: You can work only with connected Android devices.<% } %>

### Commands

Usage | Synopsis
------|-------
General | `$ tns device run <Application ID> [--device <Device ID>]`

### Options

* `--device` - If multiple devices are connected, sets the device on which you want to run the app. `<Device ID>` is the device index or identifier as listed by the `$ tns device` command.

### Arguments

* `<Application ID>` is the application identifier as listed by `$ tns device list-applications`.

<% if(isHtml) { %>

### Prerequisites

Before running your app on an iOS device, verify that your system and app meet the following requirements.
* You are running the NativeScript CLI on a macOS system.
* You have installed the latest version of Xcode.
* You have built your app with the debug build configuration.

Before running your app on an Android device, verify that your app meets the following requirement.

* You have built your app with the debug build configuration.

### Command Limitations

* You can run this command on one connected device at a time.
* You can run this command for iOS devices only on macOS systems.

### Related Commands

Command | Description
----------|----------
[device](device.html) | Lists all recognized connected devices with serial number and index, grouped by platform.
[device android](device-android.html) | Lists all recognized connected physical and running virtual devices with serial number and index.
[device ios](device-ios.html) | Lists all recognized connected iOS devices with serial number and index.
[device list-applications](device-list-applications.html) | Lists the installed applications on all connected Android and iOS devices.
[device log](device-log.html) | Opens the device log stream for a selected connected device.
<% } %>