<% if (isJekyll) { %>---
title: NativeScript CLI
position: 1
---<% } %>

# NativeScript CLI

Usage | Synopsis
------|-------
General | `$ tns <Command> [Command Parameters] [--command <Options>]`
Alias | `$ nativescript <Command> [Command Parameters] [--command <Options>]`

## General Commands

Command | Description
-------|----------
[help `<Command>`](general/help.html) | Shows additional information about the commands in this list in the browser.
[autocomplete](general/autocomplete.html) | Configures your current command-line completion settings.
[usage-reporting](general/usage-reporting.html) | Configures anonymous usage reporting for the NativeScript CLI.
[error-reporting](general/error-reporting.html) | Configures anonymous error reporting for the NativeScript CLI.
[doctor `<platform>`](general/doctor.html) | Checks your system for configuration problems which might prevent the NativeScript CLI from working properly for the specified platform, if configured.
[info](general/info.html) | Displays version information about the NativeScript CLI, core modules, and runtimes.
[proxy](general/proxy.html) | Displays proxy settings.
[migrate](general/migrate.html) | Migrates the app dependencies to a form compatible with NativeScript 6.0.
[update](general/update.html) | Updates the project with the latest versions of iOS/Android runtimes and cross-platform modules.
[package-manager](general/package-manager.html) | Prints the value of the current package manager.

## Project Development Commands
Command | Description
---|---
[create](project/creation/create.html) | Creates a new project for native development with NativeScript.
[clean](general/clean.html) | Cleans project artifacts.
[preview](project/testing/preview.html) | Generates a QR code that can be scanned by the NativeScript PlayGround app.
[platform add `<Platform>`](project/configuration/platform-add.html) | Configures the current project to target the selected platform.
[platform list](project/configuration/platform.html) | Lists all platforms that the project currently targets.
[platform remove `<Platform>`](project/configuration/platform-remove.html) | Removes the selected platform from the platforms that the project currently targets. This operation deletes all platform-specific files and subdirectories from your project.
[platform update `<Platform>`](project/configuration/platform-update.html) | Updates the NativeScript runtime for the specified platform.
[resources update](project/configuration/resources/resources-update.html) | Updates the App_Resources/<platform>'s internal folder structure to conform to that of an Android Studio project.
[resources generate splashes](project/configuration/resources/resources-generate-splashes.html) | Generates all splashscreens for Android and iOS platforms and places the generated images in the correct directories under `App_Resources/<platform>` directory.
[resources generate icons](project/configuration/resources/resources-generate-icons.html) | Generates all icons for Android and iOS platforms and places the generated images in the correct directories under `App_Resources/<platform>` directory.
[prepare `<Platform>`](project/configuration/prepare.html) | Copies relevant content from the app directory to the subdirectory for the selected target platform to let you build the project.
[build `<Platform>`](project/testing/build.html) | Builds the project for the selected target platform and produces an application package or an emulator package.
[deploy `<Platform>`](project/testing/deploy.html) | Deploys the project to a connected physical or virtual device.
[run](project/testing/run.html) | Runs your project on a connected device or in the native emulator, if configured.
[run `<Platform>`](project/testing/run.html) | Runs your project on a connected device or in the native emulator for the specified platform, if configured.
[debug `<Platform>`](project/testing/debug.html) | Debugs your project on a connected physical or virtual device.
[test init](project/testing/test-init.html) | Configures your project for unit testing with a selected framework.
[test `<Platform>`](project/testing/test.html) | Runs the unit tests in your project on a connected physical or virtual device.
[install](project/configuration/install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
[plugin](lib-management/plugin.html) | Lets you manage the plugins for your project.

## Publishing Commands
Command | Description
---|---
[appstore](publishing/appstore.html) | Lists applications registered in iTunes Connect.
[appstore upload](publishing/appstore-upload.html) | Uploads project to iTunes Connect.

## Device Commands
Command | Description
---|---
[device](device/device.html) | Lists all recognized connected physical or virtual devices.
[device log](device/device-log.html) | Opens the log stream for the selected device.
[device run](device/device-run.html) | Runs the selected application on a connected device.
[device list-applications](device/device-list-applications.html) | Lists the installed applications on all connected devices.

## Environment Configuration Commands
Command | Description
---|---
[setup](env-configuration/setup.html) | Run the setup script to try to automatically configure your environment for local builds.
[setup cloud](cloud/cloud-setup.html) | Install the `nativescript-cloud extension` to configure your environment for cloud builds.

## Global Options
Option | Description
-------|---------
--help, -h, /? | Prints help about the selected command in the console.
--path `<Directory>` | Specifies the directory that contains the project. If not set, the project is searched for in the current directory and all directories above it.
--version | Prints the client version.
--log trace | Prints a detailed diagnostic log for the execution of the current command.
