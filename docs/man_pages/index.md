#NativeScript

Usage | Synopsis
------|-------
General | `$ tns <Command> [Command Parameters] [--command <Options>]`
Alias | `$ nativescript <Command> [Command Parameters] [--command <Options>]`

## General Commands

Command | Description
-------|----------
[help `<Command>`](general/help.html) | Shows additional information about the commands in this list in the browser.
[autocomplete](general/autocomplete.html) | Configures your current command-line completion settings.
[feature-usage-tracking](general/feature-usage-tracking.html) | Configures anonymous feature usage tracking.

## Project Development Commands
Command | Description
---|---
[create](project/creation/create.html) | Creates a new project for native development with NativeScript.
[platform add `<Platform>`](project/configuration/platform-add.html) | Configures the current project to target the selected platform.
[platform list](project/configuration/platform.html) | Lists all platforms that the project currently targets.
[platform&nbsp;remove&nbsp;`<Platform>`](project/configuration/platform-remove.html) | Removes the selected platform from the platforms that the project currently targets. This operation deletes all platform-specific files and subdirectories from your project.
[platform update `<Platform>`](project/configuration/platform-update.html) | Updates the NativeScript runtime for the specified platform.
[library add `<Platform>`](lib-management/library-add.html) | Adds a locally stored native library to the current project.
[prepare `<Platform>`](project/configuration/prepare.html) | Copies relevant content from the app directory to the subdirectory for the selected target platform to let you build the project.
[build `<Platform>`](project/testing/build.html) | Builds the project for the selected target platform and produces an application package or an emulator package.
[deploy `<Platform>`](project/testing/deploy.html) | Deploys the project to a connected physical or virtual device.
[emulate `<Platform>`](project/testing/emulate.html) | Deploys the project in the native emulator for the selected target platform.
[run `<Platform>`](project/testing/run.html) | Runs your project on a connected device or in the native emulator, if configured.
[debug `<Platform>`](project/testing/debug.html) | Debugs your project on a connected device. 
[plugin](plugin.html) | Lists all installed plugins for your project or lets you manage the plugins for your project.

## Device Commands
Command | Description
---|---
[device](device/device.html) | Lists all recognized connected physical or virtual devices.
[device log](device/device-log.html) | Opens the log stream for the selected device.
[device run](device/device-run.html) | Runs the selected application on a connected device.
[device list-applications](device/device-list-applications.html) | Lists the installed applications on all connected devices.  

## Global Options
Option | Description
-------|---------
--help, -h, /? | Prints help about the selected command in the console.
--path `<Directory>` | Specifies the directory that contains the project. If not set, the project is searched for in the current directory and all directories above it.
--version | Prints the client version.
--log trace | Prints a detailed diagnostic log for the execution of the current command.