<% if (isJekyll) { %>---
title: ns open
position: 10
---<% } %>

# ns open

### Description

Opens the iOS/Android native project from the corresponding `platforms` directory. 

If the native project has not already been generated, the `prepare` command will be issued to generate the project, and the project will then be opened.

### Commands

Usage | Synopsis
------|-------
<% if((isConsole && isMacOS) || isHtml) { %>General | `$ ns open <Platform>`<% } %><% if(isConsole && (isLinux || isWindows)) { %>General | `$ ns open android`<% } %>

<% if(isMacOS) { %>### Arguments
`<Platform>` is the target mobile platform for which you want to open the native project. You can set the following target platforms.
* `android` - Opens the Android project in Android Studio.
* `ios` - Opens native iOS project in Xcode.<% } %>

<% if(isHtml) { %>

### Command Limitations

* You can run `$ ns open ios` only on macOS systems.

### Related Commands

Command | Description
----------|----------
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>