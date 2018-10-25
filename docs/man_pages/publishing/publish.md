<% if (isJekyll) { %>---
title: tns publish
position: 4
---<% } %>

# tns publish

### Description

Uploads project to an application store.

<% if(isConsole && (isLinux || isWindows)) { %>WARNING: You can run this command only on macOS systems. To view the complete help for this command, run `$ tns help publish ios`<% } %>

### Commands

Usage | Synopsis
---|---
General | `$ tns publish ios`

<% if(isHtml) { %>

### Command Limitations

* You can run `$ tns publish` only on macOS systems.
* Currently, you can use `$ tns publish` only to publish iOS applications.

### Related Commands

Command | Description
----------|----------
[appstore](appstore.html) | Lists applications registered in iTunes Connect.
[appstore upload](appstore-upload.html) | Uploads project to iTunes Connect.
[build](../project/testing/build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[build ios](../project/testing/build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[deploy](../project/testing/deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[run](../project/testing/run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[run ios](../project/testing/run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
<% } %>