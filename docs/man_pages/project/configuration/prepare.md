prepare
==========

Usage | Syntax
------|-------
General | `$ tns prepare <Platform>`
Android | `$ tns prepare android`
iOS | `$ tns prepare ios`

Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform
in the platforms directory. This lets you build the project with the SDK for the selected platform.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[platform](platform.html) | Lists all platforms that the project currently targets.
<% } %>