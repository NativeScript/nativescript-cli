Telerik NativeScript Command-Line Interface
================
[![Build Status](https://travis-ci.org/NativeScript/nativescript-cli.svg?branch=build)][2]

*Create, build, and run native apps for iOS and Android using JavaScript or TypeScript*

The Telerik NativeScript CLI lets you create, build, and deploy Telerik NativeScript-based projects on iOS and Android devices.

* [What is NativeScript](#what-is-nativescript "Quick overview of NativeScript, the JavaScript framework for cross-platform development of native iOS and Android apps")
* [Supported Platforms](#supported-platforms "The mobile platforms you can target with NativeScript")
* [System Requirements](#system-requirements "The hardware and software requirements for setting up and working with the NativeScript CLI")
* [Installation](#installation "How to configure and install the NativeScript CLI")
* [Quick Start](#quick-start "Get started with the NativeScript CLI")
	* [The Commands](#the-commands)
	* [Create Project](#create-project)
	* [Add Platforms](#add-platforms)
	* [Develop Your Project](#develop-your-project)
	* [Prepare for Build](#prepare-for-build)
	* [Build Your Project](#build-your-project)
	* [Deploy Your Project](#deploy-your-project)
	* [Emulate Your Project](#emulate-your-project)
	* [Run Your Project](#run-your-project)
* [Known Issues](#known-issues)
* [How to Contribute](#how-to-contribute)
* [License](#license)

What is NativeScript
===

> NativeScript is currently available as a private preview. To sign up for the NativeScript Insiders program, visit <a href="http://www.telerik.com/nativescript-insiders-signup" target="_blank">http://www.telerik.com/nativescript-insiders-signup</a>.

NativeScript is a cross-platform JavaScript framework that lets you develop native iOS and Android apps from a single code base. The framework provides JavaScript access to the native APIs, user interface, and rendering engines of iOS and Android. By using JavaScript or TypeScript, you can create one project that builds into an iOS or Android app with completely native user experience.

To learn more about NativeScript, you can check the following resources:

* [The NativeScript web page][4]
* [NativeScript - a Technical Overview][9]
* [Development with NativeScript][3]
* [Announcing NativeScript - cross-platform framework for building native mobile applications][11]
* [The NativeScript Documentation Wiki][6]
* [The NativeScript API Reference][7]
* [The NativeScript FAQ][8]
* [On NativeScript for Android][10]

[Back to Top][1]

Supported Platforms
===

With the NativeScript CLI, you can target the following mobile platforms.

* Android 4.2 or a later stable official release
* iOS 7.0 or later stable official release

[Back to Top][1]

System Requirements
===

You can install and run the NativeScript CLI on Windows or OS X.

* [Windows](#widnows)
* [OS X](#os-x)
* [Linux](#linux)

## Windows

> On Windows systems, you can develop, build, and deploy NativeScript projects that target Android.

* Windows Vista or later
* [Node.js 0.10.26][Node.js 0.10.26] or a later stable official release
* (Optional) [Chocolatey][Chocolatey]
* [JDK 7][JDK 7] or a later stable official release
* [Apache Ant 1.8][Apache Ant 1.8] or a later stable official release
* [Android SDK 19][Android SDK 19] or a later stable official release
* (Optional) [Genymotion][Genymotion]

If you want to develop for Android, verify that you have added the following paths in the `PATH` system environment variable.

```
Path to the bin directory in the Apache Ant installation folder
Path to tools directory in the Android SDK installation folder
Path to platform-tools directory in the Android SDK installation folder
```

For example: PATH=...;...;C:\tools\apache-ant-1.9.4\bin;C:\Users\MyUser\AppData\Local\Android\android-sdk\tools;C:\Users\MyUser\AppData\Local\Android\android-sdk\platform-tools;

If you have installed Chocolatey, you can complete these steps to set up JDK, Apache Ant, and Android SDK.

1. Run a Windows command prompt.
1. To install JDK, run the following command.

	```Shell
	choco install java
	```
1. If not present, create the following environment variable.

	```
	JAVA_HOME=Path to the jdk* install folder
	```

	For example: JAVA_HOME=C:\Program Files\Java\jdk1.8.0_11
1. To install Apache Ant, run the following command.

	```Shell
	choco install ant
	```
1. If not present, add the following file path to the `PATH` system environment variable.

	```
	Path to the bin directory in the Apache Ant installation folder
	```

	For example: PATH=...;...;C:\tools\apache-ant-1.9.4\bin
1. To install the Android SDK, run the following command.
	
	```Shell
	choco install android-sdk
	```
1. If not present, add the following file path to the `PATH` system environment variable.

	```
	Path to tools directory in the Android SDK installation folder
	Path to platform-tools directory in the Android SDK installation folder
	```

	For example: PATH=...;...;C:\Users\MyUser\AppData\Local\Android\android-sdk\tools;C:\Users\MyUser\AppData\Local\Android\android-sdk\platform-tools
1. To update the Android SDK to 19 or later, run the following command.

	```Shell
	android update sdk
	```
1. Select all packages for the Android 19 SDK and any other SDKs that you want to install and click **Install**.

## OS X

> On OS X systems, you can develop, build, and deploy NativeScript projects that target iOS and Android.

* OS X Mavericks
* [Node.js 0.10.26][Node.js 0.10.26] or a later stable official release
* For iOS development
	* [Xcode 6][12] or a later stable official release
	* [Xcode command-line tools][12]
	* (Optional) [Mono][Mono] installed via Homebrew
* For Android development
	* [JDK 7][JDK 7] or a later stable official release 
	* [Apache Ant 1.8][Apache Ant 1.8] or a later stable official release
	* [Android SDK 19][Android SDK 19] or a later stable official release 
	* (Optional) [Genymotion][Genymotion]

If you want to develop for Android, verify that you have added the following paths in your `PATH` in `~/.bash_profile`.

```
Path to the bin subdirectory in the Apache Ant installation directory
Path to the tools subdirectory in the Android SDK installation directory
Path to the platform-tools subdirectory in the Android SDK installation directory
```

For example:
```
export PATH=${PATH}:/ant/apache-ant-1.9.4/bin:/Applications/Android Studio.app/sdk/tools:/Applications/Android Studio.app/sdk/platform-tools
```

## Linux

> On Linux systems, you can develop, build, and deploy NativeScript projects that target Android.

* Ubuntu 14.04 LTS
* [Node.js 0.10.26][Node.js 0.10.26] or a later stable official release<br/>If installed via `sudo apt-get install`, use the `nodejs-legacy` package.

	```Shell
	sudo apt-get install nodejs-legacy
	```
* G++ compiler

	```Shell
	sudo apt-get install g++
    ```
* On 64-bit systems only
	* The runtime libraries for the ia32/i386 architecture.

		```Shell
		sudo apt-get install lib32z1 lib32ncurses5 lib32bz2-1.0 libstdc++6:i386
		```
* [JDK 7][JDK 7] or a later stable official release
* [Apache Ant 1.8][Apache Ant 1.8] or a later stable official release
* [Android SDK 19][Android SDK 19] or a later stable official release 
* (Optional) [Genymotion][Genymotion]

Verify that you have added the following paths in your `PATH`.

```
Path to the bin subdirectory in the Apache Ant installation directory
Path to the tools subdirectory in the Android SDK installation directory
Path to the platform-tools subdirectory in the Android SDK installation directory
```

For example:
```
export PATH=${PATH}:/ant/apache-ant-1.9.4/bin:/Applications/Android Studio.app/sdk/tools:/Applications/Android Studio.app/sdk/platform-tools
```

[Back to Top][1]

Installation
===

The NativeScript CLI is available for installing as an npm package.

In the command prompt, run the following command.

```Shell
npm install nativescript -g
```

> On OS X and Linux systems, you might need to run this command using sudo.

[Back to Top][1]

Quick Start
===

* [The Commands](#the-commands)
* [Create Project](#create-project)
* [Add Platforms](#add-platforms)
* [Develop Your Project](#develop-your-project)
* [Prepare for Build](#prepare-for-build)
* [Build Your Project](#build-your-project)
* [Deploy Your Project](#deploy-your-project)
* [Emulate Your Project](#emulate-your-project)
* [Run Your Project](#run-your-project)

## The Commands

Run `tns help` to list all available commands. Run or `tns <Command> --help` to view more information about a selected command.

* `help` lists all available commands.
* `create <App Name> [--path <Directory>] [--appid <App ID>] [--copy-from <Directory>]` creates a new project with the specified settings.
* `platform list` lists the current target platforms for your project.
* `platform add <Platform>` adds a new target platform to your project.
* `platform remove <Platform>` removes the selected platform from the target platforms of the project.
* `platform update <Platform>` updates the NativeScript runtime for the specified platform.
* `library add <Platform> <Library Path>` adds a locally stored native library to the current project.
* `prepare <Platform>` copies cross-platform and selected platform-specific content to the subdirectory for the target platform.
* `build <Platform>` builds the project for the selected target platform.
* `emulate <Platform>` builds the project for the selected target platform and runs it in the native emulator, if configured. 
* `deploy <Platform> [--device <Device ID>]` deploys an already built application on connected device.
* `run <Platform> [--device <Device ID>]` executes `prepare`, `build`, and `deploy`.
* `device` lists connected devices, including any running Android Virtual Devices or Genymotion virtual devices.
* `device log` opens the log stream for the selected device.
* `device run` runs a selected application on a connected device.
* `device list-applications` lists the installed applications on all connected devices.
* `feature-usage-tracking` configures anonymous feature usage tracking.

[Back to Top][1]

## Create Project

To create a new cross-platform project from the default template, run the following command.

```Shell
tns create MyApp
```

To create a new cross-platform project from an existing NativeScript project, run the following command.

```Shell
tns create MyApp --copy-from <Directory>
```

Where <Directory> is the complete path to the directory that contains your existing project. You can use any NativeScript project, created with the Telerik AppBuilder clients.

The NativeScript creates a new project based on the JavaScript built-in template and sets the application identifier to `org.nativescript.myapp`.

The CLI places the project in a new directory in the current directory. The newly created directory has the following structure.

```
MyApp/
|-- app/
|-- |-- app/
|-- |-- App_Resources/
|-- |-- |-- Android/
|-- |-- `-- iOS/ 
|-- |-- tns_modules/
|-- |-- `-- .../
|-- |-- LICENSE
|-- |-- package.json
|-- `-- README.md
|-- platforms/
`-- .tnsproject
```

* The `app` directory is the **development space for your application**. You should modify all common and platform-specific code within this directory. When you run `prepare <Platform>`, the NativeScript CLI copies relevant content to the platform-specific folders for each target platform. 
* The `platforms` directory is created empty. When you add a target platform to your project, the NativeScript CLI creates a new subdirectory with the platform name. The subdirectory contains the ready-to-build resources of your app. When you run `prepare <Platform>`, the NativeScript CLI copies relevant content from the `app` directory to the platform-specific subdirectory for each target platform.<br/>In the `platforms` directory, you can safely modify configuration files such as `AndroidManifest.xml` and `Info.plist`. 

[Back to Top][1]

## Add Platforms

After you have created your project, you can start adding target platforms to it. To be able to build your project into an application package for a selected target platform, you need to add the platform to your project first. Currently, you can target Android and iOS with your NativeScript projects.

Navigate to the directory that contains your newly created project and run the following commands.

```Shell
tns platform add android
tns platform add ios
```

`platform add` creates the `android` and the `ios` subdirectories in the `platforms` directory. These subdirectories have the platform-specific project structure required for native development with the native SDKs for the platform. 

```
...
platforms/
|-- android/
|-- |-- assets/
|-- |-- gen/
|-- |-- libs/
|-- |-- node_modules/
|-- |-- res/
|-- |-- src/
|-- |-- .project
|-- |-- AndroidManifest.xml
|-- |-- build.xml
|-- |-- local.properties
|-- |-- proguard-project.txt
|-- `-- project.properties
|-- ios/
|-- |-- libTNSBridge.a
|-- |-- node_modules
`-- |-- MyApp/
	`-- MyApp.xcodeproj
...
```

For more information about the structure of Android native projects, see [Android Projects](http://developer.android.com/tools/projects/index.html#ApplicationProjects).

For more information about the structure iOS native projects, see [Code Organization in Xcode Projects](http://akosma.com/2009/07/28/code-organization-in-xcode-projects/).

[Back to Top][1]

## Develop Your Project

* [Development with NativeScript](#development-with-nativescript)
* [Development in app](#development-in-app)
* [Development in platforms](#development-in-platforms)

### Development with NativeScript

For more information about working with NativeScript, see the following resources.

* [The NativeScript Documentation Wiki][6]
* [The NativeScript API Reference][7]

### Development in `app`

The `app` directory in the root of the project is the development space for your project. **Place all your common and platform-specific code in this directory.** When you run `prepare <Platform>`, the NativeScript CLI copies relevant content to the platform-specific folders for each target platform. 

In the `app` directory, you can use **platform-specific files** to provide customized functionality and design for each target platform. To indicate that a file is platform-specific, make sure that the file name is in the following format: `name.ios.extension` or `name.android.extension`. For example: `main.ios.js` or `main.android.js`. 

You can develop shared functionality or design in common files. To indicate that a file is common, make sure that the file name does not contain a `.android.` or `.ios.` string.

### Development in `platforms`

In `platforms`, you can safely modify files which are part of the native project structure and do not have a corresponding source located in the `app` directory in the root. For example, `AndroidManifest.xml` and `Info.plist`.

**Do not modify files and resources that have a corresponding file in the `app` directory in the root**, such as application scripts, icons, and splash screens. The NativeScript CLI overrides such files during the `prepare <Platform>` operation with the content from `app`.

[Back to Top][1]

## Prepare for Build

When you run `build`, the NativeScript CLI uses the resources from the platform-specific subdirectory in the `platforms` directory. To populate the platform-specific subdirectory with the correct application assets, you need to run `prepare`.

```Shell
tns prepare android
tns prepare ios
```

`prepare <Platform>` takes content from `app`, analyzes it and copies it to the platform-specific subdirectory in `platforms`. This operation copies common and relevant platform-specific content that applies to the selected platform. This ensures that your Android or iOS application contain only the correct assets.

Keep in mind that `prepare` overrides changes made to the platform-specific subdirectory in `platforms`. For more information, see [Development in platforms](#development-in-platforms).

> **IMPORTANT:** Always run `prepare <Platform>` before running `build <Platform>`, `deploy <Platform>`, or `emulate <Platform>`. This ensures that the NativeScript CLI will build an application package with your latest code and resources.

[Back to Top][1]

## Build Your Project

After you have prepared your project, you can build it for your target mobile platforms.

```Shell
tns build android
tns build ios
```

The NativeScript CLI calls the SDK for the selected target platform and uses it to build your app locally. 

When you build for Android, the NativeScript CLI saves the application package as an `APK` in `platforms` &#8594; `android` &#8594; `bin`.

When you build for iOS, if the `--device` flag is not set, the NativeScript CLI builds your project for the native emulator and saves the application package as an `APP` in `platforms` &#8594; `ios` &#8594; `build` &#8594; `emulator`. If the `--device` flag is set, the NativeScript CLI builds your project for device and saves the application package as an `IPA` in `platforms` &#8594; `ios` &#8594; `build` &#8594; `device`.

> **IMPORTANT:** To build your app for an iOS device, you must configure a valid certificate and provisioning profile pair, and have that pair present on your system for code signing your application package. For more information, see [iOS Code Signing - A Complete Walkthrough](http://seventhsoulmountain.blogspot.com/2013/09/ios-code-sign-in-complete-walkthrough.html).

[Back to Top][1]

## Deploy Your Project

You can test your work in progress on connected Android or iOS devices.

To verify that the NativeScript CLI recognizes your connected devices, run the following command.

```Shell
tns device
```

The NativeScript CLI lists all connected physical devices and running Android Virtual Devices.

After you have listed the available devices, you can deploy your app on all devices from the selected target platform.


```Shell
tns deploy android
tns deploy ios
```

The NativeScript CLI calls the SDK for the selected target platform and uses it to build your app locally. After the build is complete, the NativeScript CLI downloads and installs the application package on your connected devices. 

On Android devices, the app runs automatically.

On iOS devices, the app does not run automatically. To run the app, tap the app icon.

> **IMPORTANT:** To deploy your app on iOS devices, you need to configure a valid pair of certificate and provisioning profile for code signing your application package. For more information, see [iOS Code Signing - A Complete Walkthrough](http://seventhsoulmountain.blogspot.com/2013/09/ios-code-sign-in-complete-walkthrough.html).

[Back to Top][1]

## Emulate Your Project

If you do not have any physical devices on which to test your app or if you have not configured any certificates and provisioning profiles for iOS, you can run your app in the native emulator of your target platform.

```Shell
tns emulate android
tns emulate ios
```

This operation calls the SDK for the selected target platform, builds your app locally, launches the native device emulator for the selected target platform, and runs your project on the virtual device.

For Android, the NativeScript CLI runs your app in the earliest created virtual device or the currently running Android Virtual Device. Before running your app in the Android native emulator, make sure that you have configured at least one virtual device in the Android Virtual Device manager.

For iOS, the NativeScript CLI runs your app in the iOS Simulator. 

[Back to Top][1]

## Run Your Project

You can quickly run your app on connected devices, including all running Android Virtual Devices. The following command is shorthand for `prepare`, `build`, and `deploy`.

```Shell
tns run android
tns run ios
```

You can quickly deploy your app in the native emulators. The following command is shorthand for `prepare`, `build`, and `emulate`.

```Shell
tns run android --emulator
tns run ios --emulator
```

[Back to Top][1]

Known Issues
===

* On OS X systems with configured firewall or web proxy, when you run a command, the operation might not release the command line and you might not be able to run other commands until you break the current operation.<br/>If you have enabled feature usage tracking for the NativeScript CLI, but you have not authenticated with the firewall or web proxy on your OS X system, the NativeScript CLI might not release the command line after you run a command. To continue working with the NativeScript CLI, you need to break the current operation by pressing `Ctrl+C`.<br/>**Workaround:** Authenticate with the firewal or web proxy.
	1. Close the terminal.
	1. Run Safari.
	1. Attempt to open a web page.
	1. Provide your authentication credentials for accessing the Internet.
	1. Run the terminal and continue working with the NativeScript CLI.

How to Contribute
===

To learn how to log a bug that you just discovered, click [here](CONTRIBUTING.md#report-an-issue).

To learn how to suggest a new feature or improvement, click [here](CONTRIBUTING.md#request-a-feature).

To learn how to contribute to the code base, click [here](CONTRIBUTING.md#contribute-to-the-code-base).

[Back to Top][1]

License
===

This software is licensed under the Apache 2.0 license, quoted <a href="LICENSE" target="_blank">here</a>.

[Back to Top][1]

[1]: #telerik-nativescript-command-line-interface
[2]: https://travis-ci.org/NativeScript/nativescript-cli
[3]: http://docs.telerik.com/platform/appbuilder/nativescript/index
[4]: http://www.telerik.com/nativescript
[6]: https://github.com/nativescript/docs/wiki
[7]: https://github.com/nativescript/docs
[8]: http://www.telerik.com/nativescript/faq
[9]: http://developer.telerik.com/featured/nativescript-a-technical-overview/
[10]: http://developer.telerik.com/featured/nativescript-android/
[11]: http://blogs.telerik.com/valentinstoychev/posts.aspx/14-06-12/announcing-nativescript---cross-platform-framework-for-building-native-mobile-applications
[12]: https://developer.apple.com/xcode/downloads/
[Node.js 0.10.26]: http://nodejs.org/download/
[Chocolatey]: https://chocolatey.org/
[JDK 7]: http://www.oracle.com/technetwork/java/javase/downloads/index.html
[Apache Ant 1.8]: http://ant.apache.org/bindownload.cgi
[Android SDK 19]: http://developer.android.com/sdk/index.html
[Genymotion]: https://www.genymotion.com/#!/
[Mono]: http://www.mono-project.com