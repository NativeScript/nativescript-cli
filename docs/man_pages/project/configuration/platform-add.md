platform add
==========

Usage | Synopsis
------|-------
Android latest runtime | `$ tns platform add android [--framework-path <File Path>] [--symlink] [--sdk <API Level>] [--platform-template <Platform Template>]`
Android selected runtime | `$ tns platform add android[@<Version>] [--framework-path <File Path>] [--symlink] [--sdk <API Level>] [--platform-template <Platform Template>]`
<% if (isMacOS) { %>iOS latest runtime | `$ tns platform add ios [--framework-path <File Path>] [--symlink]`
iOS selected runtime | `$ tns platform add ios[@<Version>] [--framework-path <File Path>] [--symlink] [--platform-template <Platform Template>]`<% } %>

Configures the current project to target the selected platform. <% if(isHtml) { %>When you add a target platform, the NativeScript CLI creates a corresponding platform-specific subdirectory under the platforms directory. This platform-specific directory contains the necessary files to let you build your project for the target platform.<% } %>

### Options
* `--framework-path` - Sets the path to a NativeScript runtime for the specified platform that you want to use instead of the default runtime. If `--symlink` is specified, `<File Path>` must point to directory in which the runtime is already extracted. If `--symlink` is not specified, `<File Path>` must point to a valid npm package.
* `--symlink` - Creates a symlink to a NativeScript runtime for the specified platform that you want to use instead of the default runtime. If `--frameworkPath` is specified, creates a symlink to the specified directory. If `--frameworkPath` is not specified, creates a symlink to platform runtime installed with your current version of NativeScript.
* `--sdk` - Sets the target Android SDK for the project.
* `--platform-template` - Sets the platform template that will be used for the native application.

### Attributes
* `<API Level>` is a valid Android API level. For example: 17, 19, MNC.<% if(isHtml) { %> For a complete list of the Android API levels and their corresponding Android versions, click [here](http://developer.android.com/guide/topics/manifest/uses-sdk-element.html#platform).<% } %>
* `<File Path>` is the complete path to a valid npm package or a directory that contains a NativeScript runtime for the selected platform.
* `<Platform Template>` is a valid npm package, path to directory, .tgz or GitHub URL that contains a native Android or iOS template.
* `<Version>` is any available version of the respective platform runtime published in npm. <% if(isHtml) { %>If `@<Version>` is not specified, the NativeScript CLI installs the latest stable runtime for the selected platform.
To list all available versions for Android, run `$ npm view tns-android versions`
To list only experimental versions for Android, run `$ npm view tns-android dist-tags`
To list all available versions for iOS, run `$ npm view tns-ios versions`
To list only experimental versions for iOS, run `$ npm view tns-ios dist-tags`

### Command Limitations

* You can run `$ tns platform add ios` only on OS X systems.

### Related Commands

Command | Description
----------|----------
[install](install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
[platform remove](platform-remove.html) | Removes the selected platform from the platforms that the project currently targets.
[platform update](platform-update.html) | Updates the NativeScript runtime for the specified platform.
[platform](platform.html) | Lists all platforms that the project currently targets.
[prepare](prepare.html) | Copies common and relevant platform-specific content from the app directory to the subdirectory for the selected target platform in the platforms directory.
<% } %>