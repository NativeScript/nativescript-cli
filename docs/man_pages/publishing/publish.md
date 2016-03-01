publish
==========

Usage | Synopsis
---|---
General | `$ tns publish ios`

Uploads project to an application store.

<% if(isConsole && (isLinux || isWindows)) { %>WARNING: You can run this command only on OS X systems. To view the complete help for this command, run `$ tns help publish ios`<% } %>
<% if(isHtml) { %>
### Command Limitations

* You can run `$ tns publish` only on OS X systems.
* Currently, you can run `$ tns publish` to publish only iOS applications.

### Related Commands

Command | Description
----------|----------
[appstore](appstore.html) | Lists applications registered in iTunes Connect.
[appstore upload](appstore-upload.html) | Uploads project to iTunes Connect.
[build](../project/testing/build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[build ios](../project/testing/build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[deploy](../project/testing/deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[livesync](../project/testing/livesync.html) | Synchronizes the latest changes in your project to devices.
[livesync ios](../project/testing/livesync-ios.html) | Synchronizes the latest changes in your project to iOS devices or the iOS Simulator.
[run](../project/testing/run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[run ios](../project/testing/run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
<% } %>