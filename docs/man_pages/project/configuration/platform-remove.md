platform remove
==========

Usage | Syntax
------|-------
General | `$ tns platform remove <Platform>`
Android | `$ tns platform remove android`
iOS | `$ tns platform remove ios`

Removes the selected platform from the platforms that the project currently targets. After removing the target platform, you can no longer build and deploy your app on devices which run on the platform.

This operation deletes the subdirectory for the selected platform from the platforms directory.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[platform](platform.html) | Lists all platforms that the project currently targets.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>