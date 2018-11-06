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

To enable Hot Module Replacement (HMR) in Angular projects, follow the steps outlined in this wiki: https://github.com/NativeScript/nativescript-angular/wiki/HMR.

### Commands

Usage | Synopsis
---|---
Generates a QR code that can be scanned by the NativeScript PlayGround app | `tns preview`

### Options

* `--bundle` - (Beta) Specifies that the `webpack` bundler will be used to bundle the application.<% if(isConsole) { %> The support for webpack in preview is currently in Beta. Please, do not hesitate to report any problems that you experience with the feature by opening a new issue in the NativeScript CLI repository: https://github.com/NativeScript/nativescript-cli/issues/new/choose.<% } %>
* `--hmr` - (Beta) Enables the hot module replacement (HMR) feature. HMR depends on `webpack` and adding the `--hmr` flag to the command will automatically enable the `--bundle` option as well.<% if(isConsole) { %> The HMR feature is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/NativeScript/issues/6398.<% } %>

<% if(isHtml) { %>

>Note: Hot Module Replacement (HMR) is currently in Beta. For more information about the current development state and any known issues, please check the relevant GitHub issue: https://github.com/NativeScript/NativeScript/issues/6398.

>Note: Webpack support for the `tns preview` command is currently in Beta. Please, do not hesitate to report any problems that you experience with the feature by opening a new issue in the NativeScript CLI repository: https://github.com/NativeScript/nativescript-cli/issues/new/choose.

### Command Limitations

* The Preview app comes with a predefined set of NativeScript plugins. If your app utilizes a plugin that is not present in the Preview app, you will see a warning message and your app might not work as expected.

<% } %>