platform clean
==========

Usage | Synopsis
------|-------
<% if((isConsole && isMacOS) || isHtml) { %>General | `$ tns platform clean <Platform>`<% } %>
<% if(isConsole && (isLinux || isWindows)) { %>General | `$ tns platform clean android`<% } %>

Removes and adds the selected platform to the project currently targets. <% if(isMacOS) { %>You must specify the target platform that you want to remove.<% } %>

<% if(isMacOS) { %>### Attributes
`<Platform>` is the target mobile platform that you want to clean in your project. You can set the following target platforms.
* `android` - Removes configuration changes for Android development.
* `ios` - Removes configuration changes for iOS development.<% } %>

<% if(isHtml) { %>
### Command Limitations

* You can run `$ tns platform clean ios` only on OS X systems.
* Clean command will not preserve your current installed platform version but will download and install latest platform version.  

### Related Commands

Command | Description
----------|----------
[install](install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[platform](platform.html) | Lists all platforms that the project currently targets.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>