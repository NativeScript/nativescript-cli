platform update
==========

Usage | Syntax
------|-------
General |`$ tns platform update <Platform>[@<Version>]`
Android |`$ tns platform update android[@<Version>]`
iOS | `$ tns platform update ios[@<Version>]`

`<Version>` is any available version of the respective platform runtime published in npm. If @<Version> is not specified, the NativeScript CLI installs the latest stable runtime for the selected platform.
To list all available versions for android, run `$ npm view tns-android versions`. To list only experimental versions for android, run `$ npm view tns-android dist-tags`. To list all available versions for ios, run `$ npm view tns-ios versions`. To list only experimental versions for ios, run `$ npm view tns-ios dist-tags`

Updates the NativeScript runtime for the specified platform.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform](platform.html) | Lists all platforms that the project currently targets.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>