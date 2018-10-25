<% if (isJekyll) { %>---
title: tns resources update
position: 10
---<% } %>

# tns resources update

### Description

Updates the App_Resources/<platform>'s internal folder structure to conform to that of an Android Studio project. Android resource files and directories will be located at the following paths:
- `drawable-*`, `values`, `raw`, etc. can be found at  `App_Resources/Android/src/main/res`
- `AndroidManifest.xml` can be found at `App_Resources/Android/src/main/AndroidManifest.xml`
- Java source files can be dropped in at `App_Resources/Android/src/main/java` after creating the proper package subdirectory structure
- Additional arbitrary assets can be dropped in at `App_Resources/Android/src/main/assets`

### Commands

Usage | Synopsis
------|-------
`$ tns resources update` | Defaults to executing `$ tns resources update android`. Updates the App_Resources/Android's folder structure.
`$ tns resources update android` | Updates the App_Resources/Android's folder structure.

### Command Limitations

* The command works only for the directory structure under `App_Resources/Android`. Running `$ tns resources-update ios` will have no effect.

### Related Commands

Command | Description
----------|----------
[install](install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform](platform.html) | Lists all platforms that the project currently targets.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.