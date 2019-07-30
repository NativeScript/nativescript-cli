<% if (isJekyll) { %>---
title: tns apple-login
position: 5
---<% } %>

# tns apple-login

### Description

Uses the provided Apple credentials to obtain Apple session which can be used when publishing to Apple AppStore.

### Commands

Usage | Synopsis
---|---
General | `$ tns apple-login [<Apple ID>] [<Password>]`

### Arguments

* `<Apple ID>` and `<Password>` are your credentials for logging into iTunes Connect.

<% if(isHtml) { %>s

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