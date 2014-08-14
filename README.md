nativescript-cli
================
[![Build Status](https://travis-ci.org/NativeScript/nativescript-cli.svg?branch=build)](https://travis-ci.org/NativeScript/nativescript-cli)

Command-line interface for creating and building NativeScript projects

#Prerequisites
The installation of the Telerik NativeScript Command-line Interface requires [Node.js](http://nodejs.org/)

#Installation
To install the nativescript-cli, simply run
`npm install -g nativescript`

#Usage
`$ tns <command> [command parameters] [--command <options>]`
or, the longer
`$ nativescript <command> [command parameters] [--command <options>]`

##Main commands

| Command | Does |
| ------- | ---- |
| [`help <command>`](#helpcommand) | Shows additional information about the commands in this list. |
|[`create`](#createcommand) | Creates a new NativeScript project with given project name and application identifier. |
|[`platform add`](#platformaddcommand) | Creates a new platform specific project. |
|[`platform list`](#platformlistcommand) | Lists all available and all installed platforms. |
|[`platform remove`](#platformremovecommand) | Removes the platform specific project. |
|[`prepare`](#preparecommand) | Copies files for specified platform, so that the project is ready to build in platform specific SDK. |
|[`build`](#buildcommand) | Builds the project for the selected target platform and produces an application package. |
|[`run`](#runcommand)| This is shorthand for prepare and build. |

##General commands

| Command | Does |
| ------ | ---- |
| `--help` | Prints help about the command. |
| `--path <Directory>` | Specifies the directory that contains the project. If not set, the project is searched for in the current directory and all directories above it. |
| `--version` | Prints the client version.|

##`help`<a name="helpcommand"></a>

**Usage**

`$ tns help [<Command>]`
Lists the available commands or shows information about the selected command.
<Command> is any of the available commands as listed by $ tns help.

##`create`<a name="createcommand"></a>

**Usage**

 `$ tns create <App name> [--path <Directory>] [--appid <App ID>] [--copy-from <Directory>]`

Creates a new NativeScript project.
&lt;App name> is the name of project. It should conform to platform package type limitations. For example classes in Java don't begin with numbers.

**Options**

| Option | Does |
| ------ | ---- |
| `--path` | Specifies the directory where you want to create the project, if different from the current directory. The directory must be empty. |
| `--appid` | Sets the application identifier for your project. The application identifier must consist of at least three alphanumeric strings, separated by a dot (.). Each string must start with a letter. The application identifier corresponds to the Bundle ID for iOS apps and to the package identifier for Android apps. If not specified, the application identifier is set to com.telerik.&lt;App name>. |
| `--copy-from` | Specifies the directory where your javascript files are located. If not set, the default hello world template is used. |

##`platform`

**Usage**

`$ tns platform <Command>`

&lt;Command> is a related command that extends the platform command. You can run the following related commands:

| Command | Does |
| ------- | ---- |
| `list` | Lists all available and installed platforms. |
| `add` | Enables a project with deployment capabilities for the specified platform |
| `remove` | Removes the deployment capabilities of a project for the specified platform|

##`platform add`<a name="platformaddcommand"></a>

**Usage**

`$ tns platform add <platform>`

**Platform-specific usage**

`$ tns platform add android`

`$ tns platform add ios`

Creates a new platform specific project. The current version of the Telerik NativeScript has support for iOS and Android projects.
Android projects can be created on Linux, Windows and Mac machines. iOS projects can only be created on a MAC machine.

##`platform remove`<a name="platformremovecommand"></a>

**Usage**

`$ tns platform remove <platform>`

**Platform-specific usage**

`$ tns platform remove android`

`$ tns platform remove ios`

Removes the deployment capabilities of a project for the specified platform.

##`prepare`<a name="preparecommand"></a>

**Usage**

`$ tns prepare [<platform>]`

**Platform-specific usage**

`$ tns prepare android`

`$ tns prepare ios`

Copies files for specified platform, so that the project is ready to build in each SDK.

##`build`<a name="buildcommand"></a>

**Usage**

`$ tns build [<platform>]`

**Platform-specific usage**

`$ tns build android`

`$ tns build ios`

Builds the project for specified platform. This generates platform-specific code within the project's platforms subdirectory.

##`run`<a name="runcommand"></a>

**Usage**

`$ tns run [<platform>]`

**Platform-specific usage**

`$ tns run android`

`$ tns run ios`

This is shorthand for prepare and build.
