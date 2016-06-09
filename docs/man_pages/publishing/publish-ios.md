publish ios
==========

Usage | Synopsis
---|---
Build and upload package | `$ tns publish ios [<Apple ID> [<Password> [<Mobile Provisioning Profile Identifier> [<Code Sign Identity>]]]]]`
Upload package | `$ tns publish ios [<Apple ID> [<Password>]] --ipa <Ipa File Path>`

Uploads project to iTunes Connect. The command either issues a production build and uploads it to iTunes Connect, or uses an already built package to upload.

<% if(isConsole && (isLinux || isWindows)) { %>WARNING: You can run this command only on OS X systems. To view the complete help for this command, run `$ tns help publish ios`<% } %>
<% if((isConsole && isMacOS) || isHtml) { %>

### Options
* `--ipa` - If set, will use provided .ipa file instead of building the project.
* `--team-id` - Specified the team id for which Xcode will try to find distribution certificate and provisioning profile when exporting for AppStore submission.

### Attributes
* `<Apple ID>` and `<Password>` are your credentials for logging into iTunes Connect.
* `<Mobile Provisioning Profile Identifier>` the identifier of the mobile provision(e.g. d5d40f61-b303-4fc8-aea3-fbb229a8171c) which will be used for building. This can easily be acquired through the iPhone Configuration Utility.
* `<Code Sign Identity>` the code sign identity which will be used for building. You can set it to something generic like 'iPhone Distribution' to let the build automatically detect a code sign identity.

<% if(isHtml) { %>
### Command Limitations

* You can run `$ tns publish ios` only on OS X systems.

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
<% } %>