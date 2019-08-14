<% if (isJekyll) { %>---
title: tns appstore upload
position: 1
---<% } %>

# tns appstore upload

### Description

Uploads project to iTunes Connect. The command either issues a production build and uploads it to iTunes Connect, or uses an already built package to upload.
The user will be prompted interactively for verification code when two-factor authentication enabled account is used. As on non-interactive console (CI), you will not be prompt for verification code. In this case, you need to generate a login session for your apple's account in advance using `tns apple-login` command. The generated value must be provided via the `--appleSessionBase64` option and is only valid for up to a month. Meaning you'll need to create a new session every month.

<% if(isConsole && (isLinux || isWindows)) { %>WARNING: You can run this command only on macOS systems. To view the complete help for this command, run `$ tns help appstore upload`<% } %>
<% if((isConsole && isMacOS) || isHtml) { %>

### Commands

Usage | Synopsis
---|---
Build and upload package | `$ tns appstore upload [<Apple ID> [<Password> [<Mobile Provisioning Profile Identifier> [<Code Sign Identity>]]]]]`
Upload package | `$ tns appstore upload [<Apple ID> [<Password>]] --ipa <Ipa File Path>`

### Options

* `--ipa` - If set, will use provided .ipa file instead of building the project.
* `--appleApplicationSpecificPassword` - Specifies the password for accessing the information you store in iTunes Transporter application.
* `--appleSessionBase64` - The session that will be used instead of triggering a new login each time NativeScript CLI communicates with Apple's APIs.

### Arguments

* `<Apple ID>` and `<Password>` are your credentials for logging into iTunes Connect.
* `<Mobile Provisioning Profile Identifier>` the identifier of the mobile provision(e.g. d5d40f61-b303-4fc8-aea3-fbb229a8171c) which will be used for building. This can easily be acquired through the iPhone Configuration Utility.
* `<Code Sign Identity>` the code sign identity which will be used for building. You can set it to something generic like 'iPhone Distribution' to let the build automatically detect a code sign identity.

<% if(isHtml) { %>

### Command Limitations

* You can run `$ tns appstore upload` only on macOS systems.

### Related Commands

Command | Description
----------|----------
[appstore](appstore.html) | Lists applications registered in iTunes Connect.
[build](../project/testing/build.html) | Builds the project for the selected target platform and produces an application package that you can manually deploy on device or in the native emulator.
[build ios](../project/testing/build-ios.html) | Builds the project for iOS and produces an APP or IPA that you can manually deploy in the iOS Simulator or on device, respectively.
[deploy](../project/testing/deploy.html) | Builds and deploys the project to a connected physical or virtual device.
[run](../project/testing/run.html) | Runs your project on a connected device or in the native emulator for the selected platform.
[run ios](../project/testing/run-ios.html) | Runs your project on a connected iOS device or in the iOS Simulator, if configured.
<% } %>
<% } %>