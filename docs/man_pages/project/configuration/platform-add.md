<% if (isJekyll) { %>---
title: tns platform add
position: 2
---<% } %>

# tns platform add

### Description

Configures the current project to target the selected platform. <% if(isHtml) { %>When you add a target platform, the NativeScript CLI creates a corresponding platform-specific subdirectory under the platforms directory. This platform-specific directory contains the necessary files to let you build your project for the target platform.<% } %>

### Commands

Usage | Synopsis
------|-------
Android latest runtime | `$ tns platform add android [--framework-path <File Path>]`
Android selected runtime | `$ tns platform add android[@<Version>] [--framework-path <File Path>] `
<% if (isMacOS) { %>iOS latest runtime | `$ tns platform add ios [--framework-path <File Path>]`
iOS selected runtime | `$ tns platform add ios[@<Version>] [--framework-path <File Path>] `<% } %>

### Options

* `--framework-path` - Sets the path to a NativeScript runtime for the specified platform that you want to use instead of the default runtime. `<File Path>` must point to a valid npm package.

### Arguments

* `<Version>` is any available version of the respective platform runtime published in npm. <% if(isHtml) { %>If `@<Version>` is not specified, the NativeScript CLI installs the latest stable runtime for the selected platform.
To list all available versions for Android, run `$ npm view tns-android versions`
To list only experimental versions for Android, run `$ npm view tns-android dist-tags`
To list all available versions for iOS, run `$ npm view tns-ios versions`
To list only experimental versions for iOS, run `$ npm view tns-ios dist-tags`

### Command Limitations

* You can run `$ tns platform add ios` only on macOS systems.

### Related Commands

Command | Description
----------|----------
[install](install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[platform](platform.html) | Lists all platforms that the project currently targets.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>