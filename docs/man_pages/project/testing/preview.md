<% if (isJekyll) { %>---
title: tns preview
position: 1
---<% } %>

# tns preview

### Description

Produces a QR code which can be used to preview the app on a device without the need to install various SDKs and tools or configure your environment for local iOS or Android development.

To scan the QR code and deploy your app on a device, you need to have the NativeScript Playground app:
* `App Store (iOS)`: https://itunes.apple.com/us/app/nativescript-playground/id1263543946?mt=8&ls=1
* `Google Play (Android)`: https://play.google.com/store/apps/details?id=org.nativescript.play

After scanning the QR code with the scanner provided in the NativeScript Playground app, your app will be launched on your device through the Preview app. Additionally, any changes made to your project will be automatically synchronized with the deployed app.

### Commands

Usage | Synopsis
---|---
Generates a QR code that can be scanned by the NativeScript PlayGround app | `tns preview`

### Options

* `--no-hmr` - Disables Hot Module Replacement (HMR). In this case, when a change in the code is applied, CLI will transfer the modified files and restart the application.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed. Otherwise, the command will check the application compatibility with the current CLI version and could fail requiring `tns migrate`.

<% if(isHtml) { %>

### Command Limitations

* The Preview app comes with a predefined set of NativeScript plugins. If your app utilizes a plugin that is not present in the Preview app, you will see a warning message and your app might not work as expected.

<% } %>