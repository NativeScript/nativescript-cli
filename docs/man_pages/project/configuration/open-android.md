<% if (isJekyll) { %>---
title: ns open android
position: 10
---<% } %>

# ns open ios

### Description

Opens the Android native project from the corresponding `platforms` directory. 

If the native project has not already been generated, the `prepare` command will be issued to generate the project, and the project will then be opened.

### Commands

Usage | Synopsis
------|-------
Open the project in Android Studio | `$ ns open android`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>