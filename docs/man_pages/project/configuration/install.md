<% if (isJekyll) { %>---
title: tns install
position: 1
---<% } %>

# tns install

### Description

Installs all dependencies described in a valid `package.json` or installs a selected NativeScript development module as a dev dependency.

<% if(isHtml) { %>
The `package.json` file must be a valid `package.json` describing the configuration of a NativeScript project. If missing or corrupted, you can recreate the file by running `$ tns init` in the directory of a NativeScript project.
<% } %>

### Commands

Usage | Synopsis
---|---
Install all dependencies | `$ tns install [--path]`
Install a selected npm module | `$ tns install <Module>`
Enable TypeScript support | `$ tns install typescript`

### Options

* `--path` - Specifies the directory which contains the `package.json` file, if different from the current directory.

### Arguments

* `<Module>` - Specifies a NativeScript development module by path to a local directory containing a valid npm module or by name in the npm registry.<% if(isHtml) { %> When a `<Module>` is specified, this command adds the module as a dev dependency in your `package.json`.

> **TIP:** When installing a module from the npm registry, you can specify it by full name or suffix. NativeScript development modules are published in the npm registry with the following name format: `nativescript-dev-<suffix>`.

### Related Commands

Command | Description
----------|----------
[platform add](platform-add.html) | Configures the current project to target the selected platform.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[platform](platform.html) | Lists all platforms that the project currently targets.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>
