prepare
==========

Usage | Synopsis
------|-------
<% if((isConsole && isMacOS) || isHtml) { %>General | `$ tns prepare <Platform>`<% } %><% if(isConsole && (isLinux || isWindows)) { %>General | `$ tns prepare android`<% } %>

Copies common and relevant platform-specific content from the `app` directory to the subdirectory for the selected target platform
in the `platforms` directory. This lets you build the project with the SDK for the selected platform. <% if(isMacOS) { %>You must specify the target platform for which you want to prepare your project.<% } %>

<% if(isMacOS) { %>### Attributes

`<Platform>` is the target mobile platform for which you want to prepare your project. You can set the following target platforms.
* `android` - Prepares your project for an Android build.
* `ios` - Prepares your project for an iOS build.<% } %>

<% if(isHtml) { %> 
### Command Limitations

* You can run `$ tns prepare ios` only on OS X systems.

### Related Commands

Command | Description
----------|----------
[install](install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[platform](platform.html) | Lists all platforms that the project currently targets.
<% } %>