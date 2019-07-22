<% if (isJekyll) { %>---
title: tns prepare
position: 7
---<% } %>

# tns prepare

### Description

Starts a Webpack compilation and prepares the app's `App_Resources` and the plugins `platforms` directories. The output is generated in a subdirectory for the selected target platform in the `platforms` directory. This lets you build the project for the selected platform. <% if(isMacOS) { %>You must specify the target platform for which you want to prepare your project.<% } %>

When running this command the HMR (Hot Module Replacement) is not enabled by default. In case you want to enable HMR, you can pass `--hmr` flag.

<% if(isHtml) { %>
> NOTE: When passing `--release` CLI will disable HMR.
<% } %>

### Commands

Usage | Synopsis
------|-------
<% if((isConsole && isMacOS) || isHtml) { %>General | `$ tns prepare <Platform>`<% } %><% if(isConsole && (isLinux || isWindows)) { %>General | `$ tns prepare android`<% } %>

<% if(isMacOS) { %>### Arguments
`<Platform>` is the target mobile platform for which you want to prepare your project. You can set the following target platforms.
* `android` - Prepares your project for an Android build.
* `ios` - Prepares your project for an iOS build.<% } %>

### Options

* `--hmr` - Enables the hot module replacement (HMR) feature.
* `--force` - If set, skips the application compatibility checks and forces `npm i` to ensure all dependencies are installed. Otherwise, the command will check the application compatibility with the current CLI version and could fail requiring `tns migrate`.

<% if(isHtml) { %>

### Command Limitations

* You can run `$ tns prepare ios` only on macOS systems.

### Related Commands

Command | Description
----------|----------
[install](install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[platform](platform.html) | Lists all platforms that the project currently targets.
<% } %>