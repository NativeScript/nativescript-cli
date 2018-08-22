<% if (isJekyll) { %>---
title: tns plugin create
position: 1
---<% } %>
# tns plugin create

Usage | Synopsis
---|---
Create a new plugin | `$ tns plugin create <Plugin Repository Name> [--path <Directory>]`

Creates a new project for NativeScript plugin development. The project uses the [NativeScript Plugin Seed](https://github.com/NativeScript/nativescript-plugin-seed) as a base and contains the following directories:

* `src` - source code of the plugin
* `demo` - simple NativeScript application used to test and show plugin features
* `publish` - shell scripts used to build and pack the plugin source code and publish it in [NPM](https://www.npmjs.com/)

The project is setup for easy commit in Github, which is why the command will ask you for your Github username.
<% if(isHtml) { %>Before starting to code your first plugin, you can visit the NativeScript documentation page for [building plugins](https://docs.nativescript.org/plugins/building-plugins#step-2-set-up-a-development-workflow) or the [plugin seed repository](https://github.com/NativeScript/nativescript-plugin-seed/blob/master/README.md).<% } %>

### Options

* `--path` - Specifies the directory where you want to create the project, if different from the current directory.
* `--username` - Specifies the Github username, which will be used to build the URLs in the plugin's package.json file.
* `--pluginName` - Used to set the default file and class names in the plugin source.

### Attributes

* `<Plugin Repository Name>` is the name of repository where your plugin will reside. A directory with the same name will be created. For example: `nativescript-awesome-list`. If a directory with the name already exists and is not empty, the plugin create command will fail.