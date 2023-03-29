<% if (isJekyll) { %>---
title: tns resources generate icons
position: 11
---<% } %>

# tns resources generate icons

### Description

Generates all icons for Android and iOS platforms and places the generated images in the correct directories under `App_Resources/<platform>` directory.

### Commands

Usage | Synopsis
------|-------
`$ tns resources generate icons <Path to image>` | Generate all icons for Android and iOS based on the specified image.

### Options

* `--background` Sets the background color of the icon. When no color is specified, a default value of `transparent` is used. `<Color>` is a valid color and can be represented with string, like `white`, `black`, `blue`, or with HEX representation, for example `#FFFFFF`, `#000000`, `#0000FF`. NOTE: As the `#` is special symbol in some terminals, make sure to place the value in quotes, for example `$ tns resources generate icons ../myImage.png --background "#FF00FF"`.

### Arguments

* `<Path to image>` is a valid path to an image that will be used to generate all icons.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[install](../install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
[platform add](../platform-add.html) | Configures the current project to target the selected platform.
[platform remove](../platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform](../platform.html) | Lists all platforms that the project currently targets.
[prepare](../prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
[resources update](resources-update.md) | Updates the `App_Resources/Android` internal folder structure to conform to that of an Android Studio project.
[resources generate splashes](resources-generate-splashes.md) | Generates splashscreens for Android and iOS.
<% } %>