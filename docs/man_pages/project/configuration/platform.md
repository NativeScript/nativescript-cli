<% if (isJekyll) { %>---
title: tns platform
position: 6
---<% } %>

# tns platform

### Description

Lists all platforms that the project currently targets. You can build and deploy your project only for these target platforms.

### Commands

Usage | Synopsis
---|---
General | `$ tns platform list`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[install](install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>