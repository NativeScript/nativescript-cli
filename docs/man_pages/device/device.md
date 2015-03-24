device
==========

Usage:
    `$ tns device [<Command>]`
Lists all recognized connected devices with serial number and index, grouped by platform. In this version of the NativeScript CLI,
you can connect only iOS and Android devices.

`<Command>` is a related command that extends the device command. You can run the following related commands:
* `android` - Lists all recognized connected Android physical and running Android virtual devices.
* `ios` - Lists all recognized connected iOS devices.
* `log` - Opens the device log stream for a selected connected device.
* `list-applications` - Lists the installed applications on all connected Android `<% if(isWindows || isMacOS) { %>or iOS <%}%>`devices.
* `run` - Runs the selected application on a connected Android `<% if(isMacOS) { %>or iOS <%}%>`device.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[device android](device-android.html) | Lists all recognized connected physical and running virtual devices with serial number and index.
[device ios](device-ios.html) | Lists all recognized connected iOS devices with serial number and index.
[device list-applications](device-list-applications.html) | Lists the installed applications on all connected Android and iOS devices.
[device log](device-log.html) | Opens the device log stream for a selected connected device.
[device run](device-run.html) | Runs the selected application on a connected Android or iOS device.
<% } %>