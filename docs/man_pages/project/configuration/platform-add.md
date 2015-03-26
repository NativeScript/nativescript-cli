platform add
==========

Usage | Syntax
------|-------
General | `$ tns platform add <Platform>[@<Version>] [--frameworkPath <File Path>] [--symlink]`
Android latest version | `$ tns platform add android [--frameworkPath <File Path>] [--symlink]`
Android specific version | `$ tns platform add android[@<Version>] [--frameworkPath <File Path>] [--symlink]`
iOS latest version | `$ tns platform add ios [--frameworkPath <File Path>] [--symlink]`
iOS specific version | `$ tns platform add ios[@<Version>] [--frameworkPath <File Path>] [--symlink]`

Configures the current project to target the selected platform. 

`<Version> is any available version of the respective platform runtime published in npm. If @<Version>` is not specified, the NativeScript CLI installs the latest stable runtime for the selected platform.
To list all available versions for android, run `$ npm view tns-android versions. To list only experimental versions for android, run $ npm view tns-android dist-tags`To list all available versions for ios, run `$ npm view tns-ios versions. To list only experimental versions for ios, run $ npm view tns-ios dist-tags`
`<File Path>` is the complete path to a valid npm package or a directory that contains a NativeScript runtime for the selected platform. 

When you add a target platform, the NativeScript CLI adds a corresponding platform-specific subdirectory under the platforms directory. This platform-specific directory contains the necessary files to let you build your project for the target platform.

In this version of the NativeScript CLI, you can target iOS and Android, based on your system. You need to have your system configured for development with the target platform.
On Windows and Linux systems, you can target Android. 
On OS X systems, you can target Android and iOS.

Options:
* `--frameworkPath` - Sets the path to a NativeScript runtime for the specified platform that you want to use instead of the default runtime. If `--symlink` is specified, `<File Path>` must point to directory in which the runtime is already extracted. If `--symlink` is not specified, `<File Path>` must point to a valid npm package. 
* `--symlink` - Creates a symlink to a NativeScript runtime for the specified platform that you want to use instead of the default runtime. If `--frameworkPath` is specified, creates a symlink to the specified directory. If `--frameworkPath` is not specified, creates a symlink to platform runtime installed with your current version of NativeScript.
<% if(isHtml) { %> 

#### Related Commands

Command | Description
----------|----------
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[platform](platform.html) | Lists all platforms that the project currently targets.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>