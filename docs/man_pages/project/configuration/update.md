<% if (isJekyll) { %>---
title: tns update
position: 8
---<% } %>

# tns update

### Description

Updates a NativeScript to the latest compatible combination of NativeScript dependencies. The combination of dependencies is taken from the latest(or specified) version of the template for the type of the target project (Angular, Vue.js and etc.).

### Commands

Usage | Synopsis
------|-------
Update with the latest version |`$ tns update`
Update with specific version | `$ tns update <version>`

### Related Commands

Command | Description
----------|----------
[install](install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform](platform.html) | Lists all platforms that the project currently targets.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[resources update android](resources-update.html) | Updates the App_Resources/Android directory to the new v4.0 directory structure