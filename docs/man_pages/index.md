#NativeScript

Usage | Syntax
------|-------
General | $ tns <command> [command parameters] [--command <options>]

## General commands:
Command | Description
-------|----------
    help <command>                  |Shows additional information about the commands in this list.
    create                          |Creates a new project for native development with NativeScript.
    platform add                    |Configures the current project to target the selected platform.
    platform list                   |Lists all platforms that the project currently targets.
    platform remove                 |Removes the selected platform from the platforms that the project currently targets. This operation deletes all platform-specific files and subdirectories from your project.
    platform update                 |Updates the NativeScript runtime for the specified platform.
    library add                     |Adds a locally stored native library to the current project.
    prepare                         |Copies relevant content from the app directory to the subdirectory for the selected target platform. This lets you build the project with the SDK for the selected platform and deploy it on device.
    build                           |Builds the project for the selected target platform and produces an application package or an emulator package.
    deploy                          |Deploys the project to a connected physical or virtual device.
    emulate                         |Deploys the project in the native emulator for the selected target platform.
    run                             |Runs your project on a connected device or in the native emulator, if configured.  This is shorthand for prepare, build, and deploy.
    debug                           |Debugs your project on a connected device. 
    device                          |Lists all recognized connected physical or virtual device.
    device log                      |Opens the log stream for the selected device.
    device run                      |Runs the selected application on a connected device.
    device list-applications        |Lists the installed applications on all connected devices.  
    feature-usage-tracking          |Configures anonymous feature usage tracking.
    autocomplete                    |Turn on command line autocompletion for bash and zsh


## Global Options:
Option | Description
-------|---------
    --help, -h, /?      |Prints help about the selected command.
    --path <Directory>  |Specifies the directory that contains the project. If not set, the project is searched for in the current directory and all directories above it.
    --version           |Prints the client version.
    --log trace         |Prints a detailed diagnostic log for the execution of the current command.