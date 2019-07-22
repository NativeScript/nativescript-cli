<% if (isJekyll) { %>---
title: tns plugin create
position: 1
---<% } %>

# tns plugin create

### Description

Creates a new project for NativeScript plugin development. The project uses the [NativeScript Plugin Seed](https://github.com/NativeScript/nativescript-plugin-seed) as a base and contains the following directories:

* `src` - source code of the plugin
* `publish` - shell scripts used to build and pack the plugin source code and publish it in [NPM](https://www.npmjs.com/)

The command will also propose you to setup demo applications and if you accept them, it will create the following additional directories: 
* `demo` - simple NativeScript application used to test and show plugin features
* `demo-angular` - simple Angular application used to test and show plugin features

The project is setup for easy commit in Github, which is why the command will ask you for your Github username.
<% if(isHtml) { %>Before starting to code your first plugin, you can visit the NativeScript documentation page for [building plugins](https://docs.nativescript.org/plugins/building-plugins#step-2-set-up-a-development-workflow) or the [plugin seed repository](https://github.com/NativeScript/nativescript-plugin-seed/blob/master/README.md).<% } %>

### Commands

Usage | Synopsis
---|---
Create from the default plugin seed | `$ tns plugin create <Plugin Repository Name> [--path <Directory>]`
Create from a custom plugin seed | `$ tns plugin create <Plugin Repository Name> [--path <Directory>] --template <Template>`

### Options

* `--path` - Specifies the directory where you want to create the project, if different from the current directory.
* `--username` - Specifies the Github username, which will be used to build the URLs in the plugin's package.json file.
* `--pluginName` - Used to set the default file and class names in the plugin source.
* `--includeTypeScriptDemo` - Specifies if TypeScript demo should be created. Default value is `y` (i.e. `demo` will be created), in case you do not want to create this demo, pass `--includeTypeScriptDemo=n`
* `--includeAngularDemo` - Specifies if Angular demo should be created. Default value is `y` (i.e. `demo-angular` will be created), in case you do not want to create this demo, pass `--includeAngularDemo=n`
* `--template` - Specifies the custom seed archive, which you want to use to create your plugin. If `--template` is not set, the NativeScript CLI creates the plugin from the default NativeScript Plugin Seed. `<Template>` can be a URL or a local path to a `.tar.gz` file with the contents of a seed repository.<% if(isHtml) { %> This must be a clone of the [NativeScript Plugin Seed](https://github.com/NativeScript/nativescript-plugin-seed) and must contain a `src` directory with a package.json file and a script at `src/scripts/postclone.js`. After the archive is extracted, the postclone script will be executed with the username (`gitHubUsername`) and plugin name (`pluginName`) parameters given to the `tns plugin create` command prompts. For more information, visit the default plugin seed repository and [examine the source script](https://github.com/NativeScript/nativescript-plugin-seed/blob/master/src/scripts/postclone.js) there. Examples:

  * Using a local file:

    `tns plugin create nativescript-testplugin --template ../seeds/seed1.tar.gz`

  * Using a `.tar.gz` file from a tag called `v4.0` in a Github repository:

    `tns plugin create nativescript-testplugin --template https://github.com/NativeScript/nativescript-plugin-seed/archive/v.4.0.tar.gz`<% } %>

### Arguments

* `<Plugin Repository Name>` is the name of repository where your plugin will reside. A directory with the same name will be created. For example: `nativescript-awesome-list`. If a directory with the name already exists and is not empty, the plugin create command will fail.
