device log
==========

Usage:
    `$ tns device log --device <Device ID>`
Opens the device log stream for a selected connected device. 

`<Device ID>` is the device index or identifier as listed by `$ tns device`
Options:
* `--device` - If multiple devices are connected, sets the device for which you want to stream the log in the console.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[device android](device-android.html) | Lists all recognized connected physical and running virtual devices with serial number and index.
[device ios](device-ios.html) | Lists all recognized connected iOS devices with serial number and index.
[device list-applications](device-list-applications.html) | Lists the installed applications on all connected Android and iOS devices.
[device run](device-run.html) | Runs the selected application on a connected Android or iOS device.
[device](device.html) | Lists all recognized connected devices with serial number and index, grouped by platform.
<% } %>