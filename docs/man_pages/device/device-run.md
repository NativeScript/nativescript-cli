device run
==========

Usage:
    `$ tns device run <ApplicationId> [--device <Device ID>]`
Runs the selected application on a connected Android or iOS device.
You can run this command on one connected device at a time.

`<Application ID> is the application identifier as listed by `$ tns device list-applications`<Device ID>` is the device index or identifier as listed by run `$ tns device`
Prerequisites:
Before running your app on an iOS device, verify that your system and app meet the following requirements.
* You are running the NativeScript CLI on an OS X system.
* You have installed Xcode 5 or later.
* You have built your app with the debug build configuration. Before running your app on an Android device, verify that your app meets the following requirement.
* You have built your app with the debug build configuration.

Options:
* `--device` - If multiple devices are connected, sets the device on which you want to run the app. You can run this command on one connected device at a time.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[device android](device-android.html) | Lists all recognized connected physical and running virtual devices with serial number and index.
[device ios](device-ios.html) | Lists all recognized connected iOS devices with serial number and index.
[device list-applications](device-list-applications.html) | Lists the installed applications on all connected Android and iOS devices.
[device log](device-log.html) | Opens the device log stream for a selected connected device.
[device](device.html) | Lists all recognized connected devices with serial number and index, grouped by platform.
<% } %>