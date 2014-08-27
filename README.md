Telerik NativeScript Command-Line Interface
================
[![Build Status](https://travis-ci.org/NativeScript/nativescript-cli.svg?branch=build)][2]

*Create, build, and run native apps for iOS and Android using JavaScript*

The Telerik NativeScript CLI lets you create, build, and deploy NativeScript-based projects on iOS and Android devices.

* [What is NativeScript](#what-is-nativescript "Quick overview of Telerik NativeScript, the JavaScript framework for cross-platform development of native iOS and Android apps")
* [Supported Platforms](#supported-platforms "The mobile platforms you can target with NativeScript")
* [System Requirements](#system-requirements "The hardware and software requirements for setting up and working with the Telerik NativeScript CLI")
* [Installation](#installation "How to configure and install the Telerik NativeScript CLI")
* [Quick Start](#quick-start "Get started with the Telerik NativeScript CLI")
* [How to Contribute](#how-to-contribute "")
* [License](#license)

What is NativeScript
===

> Telerik NativeScript is currently available as a private preview. To sign up for the NativeScript Insiders program, visit <a href="http://www.telerik.com/nativescript-insiders-signup" target="_blank">http://www.telerik.com/nativescript-insiders-signup</a>.

Telerik NativeScript is a cross-platform JavaScript framework that lets you develop native iOS and Android apps from a single code base. The framework provides JavaScript access to the native APIs, user interface, and rendering engines of iOS and Android. By using JavaScript or TypeScript, you can create one project that builds into an iOS or Android app with completely native user experience.

To learn more about Telerik NativeScript, you can check the following resources:

* [The Telerik NativeScript web page][4]
* [NativeScript - a Technical Overview][9]
* [Development with NativeScript][3]
* [Announcing NativeScript - cross-platform framework for building native mobile applications][11]
* [The Telerik NativeScript Documentation Wiki][6]
* [The Telerik NativeScript API Reference][7]
* [The Telerik NativeScript FAQ][8]
* [On NativeScript for Android][10]

[Back to Top][1]

Supported Platforms
===

With the Telerik NativeScript CLI, you can target the following mobile platforms.

* Android 4.2 or later
* iOS 7.0 or later

[Back to Top][1]

System Requirements
===

You can install and run the Telerik NativeScript CLI on Windows or OS X.

* [Windows](#widnows)
* [OS X](#os-x)

## Windows

> On Windows systems, you can develop, build, and deploy NativeScript projects that target Android.

* Windows Vista or later
* Node.js 0.10.22 or later
* (Optional) Chocolatey
* JDK 6 or later
* Apache Ant 1.8 or later
* Android SDK 19 or later

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

	For example: PATH=...;...;%localappdata%\Android\android-sdk\tools;%localappdata%\Android\android-sdk\platform-tools
1. To update the Android SDK to 19 or later, run the following command.

	```Shell
	android update sdk
	```
1. Select all packages for the Android 19 SDK and any other SDKs that you want to install and click **Install**.

## OS X

> On OS X systems, you can develop, build, and deploy NativeScript projects that target iOS and Android.

* OS X Mavericks
* Node.js 0.10.22 or later
* For iOS development
	* iOS 7.0 SDK or later
	* Xcode 5 or later
	* Xcode command-line tools
* For Android development
	* JDK 6 or later 
	* Apache Ant 1.8 or later
	* Android SDK 19 or later 

If you want to develop for Android, verify that you have added the following paths in `/etc/paths`.

```
Path to the bin subdirectory in the Apache Ant installation directory
Path to the tools subdirectory in the Android SDK installation directory
```

For example:
```
~/ant/apache-ant-1.9.4/bin
/Applications/Android Studio.app/sdk/tools
/Applications/Android Studio.app/sdk/platform-tools
```

[Back to Top][1]

Installation
===

The Telerik NativeScript CLI is available for installing as an npm package.

In the command prompt, run the following command.

```Shell
npm install nativescript -g
```

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

## The Commands

Run `tns help` to list all available commands. Run or `tns <Command> help` to view more information about a selected command.

* `help` lists all available commands.
* `create <App name> [--path <Directory>] [--appid <App ID>] [--copy-from <Directory>]` creates a new project with the specified settings.
* `platform list` lists the current target platforms for your project.
* `platform add <Platform>` adds a new target platform to your project.
* `platform remove <Platform>` removes the selected platform from the target platforms of the project.
* `prepare <Platform>` copies cross-platform and platform-specific content to the subdirectory for the selected target platform.
* `build <Platform>` builds the project for the selected target platform.
* `emulate <Platform>` builds the project for the selected target platform and runs it in the native emulator, if configured. 
* `deploy <Platform> [--device <Device ID>]` deploys an already built application on connected device.
* `run <Platform>` executes `prepare`, `build`, and `deploy`.
* `list-devices` lists connected devices.
* `feature-usage-tracking` configures anonymous feature usage tracking.

[Back to Top][1]

## Create Project

To create a new hybrid project from the default template, run the following command.

```Shell
tns create MyApp
```

The Telerik NativeScript creates a new project based on the JavaScript built-in template and sets the application identifier to `com.telerik.myapp`.

The CLI places the project in a new directory in the current directory. The newly created directory has the following structure.

```
MyApp/
|-- app/
|-- |-- app/
|-- |-- App_Resources/
|-- |-- |-- Android/
|-- |-- `-- iOS/ 
|-- |-- tns_modules/
|-- |-- |-- application/
|-- |-- |-- camera/
|-- |-- |-- console/
|-- |-- |-- file-system/
|-- |-- |-- globals/
|-- |-- |-- http/
|-- |-- |-- image-source/
|-- |-- |-- local-settings/
|-- |-- |-- location/
|-- |-- |-- promises/
|-- |-- |-- text/
|-- |-- |-- timer/
|-- |-- `-- utils/
|-- |-- LICENSE
|-- |-- package.json
|-- `-- README.md
|-- hooks/
|-- platforms/
|-- tns_modules/
`-- .tnsproject
```

[Back to Top][1]

## Add Platforms

After you have created your project, you can start adding target platforms to it. To be able to build your project into an application package for a selected target platform, you need to add the platform to your project. Currently, you can target Android and iOS with your NativeScript projects.

Navigate to the directory that contains your newly created project and run the following commands.

```Shell
tns platform add android
tns platform add ios
```

`platform add` creates the `android` and the `ios` subdirectories in the `platforms` directory. These subdirectories have the platform-specific project structure required for native development with the platform. 

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

[Back to Top][1]

## Develop Your Project

Develop your project in the `app` directory in the root of the project. Avoid making changes to the platform-specific subdirectories in `platforms`. The Telerik NativeScript CLI overrides such changes during the `prepare` operation.

You can use platform-specific files to provide customized functionality and design for each target platform. To indicate that a file is platform-specific, make sure that the file name is in the following format: `name.ios.extension` or `name.android.extension`. For example: `main.ios.js` or `main.android.js`. You can develop shared functionality or design in common files. To indicate that a file is common, make sure that the file name does not contain a `.android.` or `.ios.` string.

[Back to Top][1]

## Prepare for Build

When you run `build`, the Telerik NativeScript CLI uses the resources from the platform-specific subdirectory in the `platforms` directory. To populate the platform-specific subdirectory with the correct application assets, you need to run `prepare`.

```Shell
tns prepare android
tns prepare ios
```

`prepare <Platform>` takes content from `app`, analyzes it and copies it to the platform-specific subdirectory in `platforms`. This operation copies common content and platform-specific content that applies only to the selected platform. This ensures that your Android or iOS application will contain the correct assets.

Keep in mind that `prepare` overrides any changes made to the platform-specific subdirectory in `platforms`. To develop platform-specific functionality and design for your native apps, use platform-specific files in the `app` directory.

> **IMPORTANT:** Always run `prepare <Platform>` before running `build <Platform>` or `deploy <Platform>`. This ensures that the Telerik NativeScript CLI will build an application package that contains your latest code and resources.

[Back to Top][1]

## Build Your Project

After you have prepared your project, you can build it for your target mobile platforms.

```Shell
tns build android
tns build ios
```

The Telerik NativeScript CLI calls the SDK for the selected target platform and uses it to build your app locally. 

When you build for Android, the Telerik NativeScript CLI saves the application package as an `APK` in `platforms` -> `android` -> `bin`.

When you build for iOS, the Telerik NativeScript CLI saves the application package as an `IPA` in `platforms` -> `ios` -> `build` -> `device`.

> **IMPORTANT:** To build your app for iOS, you need to configure a valid pair of certificate and provisioning profile for code signing your application package. For more information, see [iOS Code Signing - A Complete Walkthrough](http://seventhsoulmountain.blogspot.com/2013/09/ios-code-sign-in-complete-walkthrough.html).

[Back to Top][1]

## Deploy Your Project

You can test your work in progress on connected Android or iOS devices.

To verify that the Telerik NativeScript CLI recognizes your connected devices, run the following command.

```Shell
tns list-devices
```

The Telerik NativeScript CLI lists all connected physical devices and running virtual Android devices managed by the Android Virtual Device manager.

After you have listed the available devices, you can deploy your app on all devices from the selected target platform.


```Shell
tns deploy android
tns deploy ios
```

The Telerik NativeScript CLI calls the SDK for the selected target platform and uses it to build your app locally. After the build is complete, the Telerik NativeScript CLI downloads and installs the application package on your connected devices. The app does not run automatically on the device.

> **IMPORTANT:** To deploy your app on iOS devices, you need to configure a valid pair of certificate and provisioning profile for code signing your application package. For more information, see [iOS Code Signing - A Complete Walkthrough](http://seventhsoulmountain.blogspot.com/2013/09/ios-code-sign-in-complete-walkthrough.html).

[Back to Top][1]

## Emulate Your Project

If you do not have any physical devices on which to test your app or if you have not configured any certificates and provisioning profiles for iOS, you can run your app in the native emulator of your target platform.

```Shell
tns emulate android
tns emulate ios
```

This operation launches the native device emulator for the selected target platform and runs your project in the virtual device.

For Android, the Telerik NativeScript CLI runs your app in the earliest created virtual device. Before running your app in the Android native emulator, make sure that you have configured at least one virtual device in the Android Virtual Device manager.

For iOS, the Telerik NativeScript CLI runs your app in the iOS Simulator.

[Back to Top][1]

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