appstore
==========

Usage | Synopsis
---|---
List applications | `$ tns appstore [<Apple ID> [<Password>]]`
<% if((isConsole && isMacOS) || isHtml) { %>Upload | `$ tns appstore upload`<% } %>

Lists all application records in iTunes Connect. The list contains name, version and bundle ID for each application record.

### Attributes
<% if(isHtml) { %>
`<Apple ID>` and `<Password>` are your credentials for logging in iTunes Connect. If you do not provide them when running the command, the NativeScript CLI will prompt you to provide them.

### Options
* `--team-id` - Specified the team id for which Xcode will try to find distribution certificate and provisioning profile when exporting for AppStore submission.

### Command Limitations

* You can run `$ tns appstore upload` only on OS X systems.

### Related Commands

Command | Description
----------|----------
[appstore upload](appstore-upload.html) | Uploads project to iTunes Connect.
[build](../project/testing/build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[build ios](../project/testing/build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[deploy](../project/testing/deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[livesync](../project/testing/livesync.html) | Synchronizes the latest changes in your project to devices.
[livesync ios](../project/testing/livesync-ios.html) | Synchronizes the latest changes in your project to iOS devices or the iOS Simulator.
[run](../project/testing/run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[run ios](../project/testing/run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
<% } %>