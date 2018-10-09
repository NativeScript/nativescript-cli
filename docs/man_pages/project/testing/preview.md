<% if (isJekyll) { %>---
title: tns preview
position: 1
---<% } %>
# tns preview


Usage | Synopsis
---|---
Produces a QR code which can be used to priview the app on a device without the need to install various SDKs and tools or configure your environment for local iOS or Android development. | `tns preview`

To scan the QR code and deploy your app on a device, you need to have the NativeScript Playground app:
    App Store (iOS): https://itunes.apple.com/us/app/nativescript-playground/id1263543946?mt=8&ls=1
    Google Play (Android): https://play.google.com/store/apps/details?id=org.nativescript.play

After scanning the QR code with the scanner provided in the NativeScript Playground app, your app will be launched on your device through the Preview app. Additionally, any changes made to your project will be automatically synchronized with the deployed app.

Limitation: The Preview app comes with a predefined set of NativeScript plugins. If your app utilizes a plugin that is not present in the Preview app, you will see a warning message and your app might not work as expected.

### Options
`--bundle` - Specifies that a bundler (e.g. webpack) should be used if one is present. If no value is passed will default to `webpack`