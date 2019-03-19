
<h1 align="center">
  <br>
  <a href="https://www.npmjs.com/package/nativescript"><img src="https://user-images.githubusercontent.com/760518/54612598-e70a3600-4a61-11e9-8d6d-7dd0c557e7cf.png" alt="Nativescript Logo" width="200"></a>
  <br>
	  <br>
   NativeScript Command-Line Interface
  <br>
</h1>

<h4 align="center">The NativeScript CLI lets you create, build, and deploy <a href="https://docs.nativescript.org/" target="_blank">NativeScript</a>-based projects on iOS and Android devices.</h4>
  </a>
</p>

<h5 align="center">Master Branch</h5>
<p align="center"> 
<img alt="Build Status" src="https://travis-ci.org/NativeScript/nativescript-cli.svg?branch=build">
<a href="https://waffle.io/NativeScript/nativescript-cli"><img alt="Waffle.io - NativeScript CLI" src="https://badge.waffle.io/NativeScript/nativescript-cli.svg?columns=In%20Progress"></a>
</p>

Get it using: `npm install -g nativescript`


* [What is NativeScript](#what-is-nativescript "Quick overview of NativeScript, the JavaScript framework for cross-platform development of native iOS and Android apps")
* [How the NativeScript CLI works](#how-the-nativescript-cli-works "How the CLI works in more detail")
* [Supported Platforms](#supported-platforms "The mobile platforms you can target with NativeScript")
* [System Requirements](#system-requirements "The hardware and software requirements for setting up and working with the NativeScript CLI")
* [Installation](#installation "How to configure and install the NativeScript CLI")
    * [Install the NativeScript CLI](#install-the-nativescript-cli)
    * [Configure Proxy Usage](#configure-proxy-settings)
* [Quick Start](#quick-start "Get started with the NativeScript CLI")
    * [The Commands](#the-commands)
    * [Create Project](#create-project)
    * [Add Platforms](#add-platforms)
    * [Develop Your Project](#develop-your-project)
    * [Prepare for Build](#prepare-for-build)
    * [Build Your Project](#build-your-project)
    * [Deploy Your Project](#deploy-your-project)
    * [Run Your Project](#run-your-project)
* [Extending the CLI](#extending-the-cli)
* [Troubleshooting](#troubleshooting)
* [Known Issues](#known-issues)
* [How to Contribute](#how-to-contribute)
* [How to Build](#how-to-build)
* [Get Help](#get-help)
* [License](#license)

What is NativeScript
===

NativeScript is a cross-platform JavaScript framework that lets you develop native iOS and Android apps from a single code base. The framework provides JavaScript access to the native APIs, user interface, and rendering engines of iOS and Android. By using JavaScript or TypeScript, you can create one project that builds into an iOS or Android app with completely native user experience.

To learn more about NativeScript, you can check the following resources:

* [The NativeScript web page][4]
* [NativeScript - a Technical Overview][9]
* [Development with NativeScript][3]
* [Announcing NativeScript - cross-platform framework for building native mobile applications][11]
* The NativeScript [Documentation repo][6] and [Documentation portal][7]
* [The NativeScript FAQ][8]
* [On NativeScript for Android][10]

[Back to Top][1]

How the NativeScript CLI works
===

The NativeScript CLI is the command-line interface for interacting with NativeScript. It incorporates several important services. Consider the following diagram:

![NativeScript CLI diagram](https://github.com/NativeScript/nativescript-cli/raw/release/ns-cli.png)

* **Commands** - pretty much what every CLI does - support of different command options, input validation and help  
* **Devices Service** - provides the communication between NativeScript and devices/emulators/simulators used to run/debug the app. Uses iTunes to talk to iOS and adb for Android
* **LiveSync Service** - redeploys applications when code changes during development
* **Hooks Service** - executes custom-written hooks in developed application, thus modifying the build process
* **Platforms Service** - provides app build functionalities, uses Gradle to build Android packages and Xcode for iOS. 

[Back to Top][1]

Supported Platforms
===

With the NativeScript CLI, you can target the following mobile platforms.

* Android 4.2 or a later stable official release
* iOS 7.0 or later stable official release

[Back to Top][1]

System Requirements
===

You can install and run the NativeScript CLI on Windows, macOS or Linux.

* [Windows](https://docs.nativescript.org/start/ns-setup-win)
* [macOS](https://docs.nativescript.org/start/ns-setup-os-x)
* [Linux](https://docs.nativescript.org/start/ns-setup-linux)

Installation
===

## Install the NativeScript CLI

The NativeScript CLI is available for installing as an npm package.

In the command prompt, run the following command.

OS | Node.js installed from http://nodejs.org/ | Node.js installed via package manager
---|---------------------|----
Windows | `npm install nativescript -g` | `npm install nativescript -g`
macOS | `sudo npm install nativescript -g --unsafe-perm` | `npm install nativescript -g`
Linux | `sudo npm install nativescript -g --unsafe-perm` | `npm install nativescript -g`

To check if your system is configured properly, run the following command.

```Shell
tns doctor
```

## Configure Proxy Settings

If you are working with the NativeScript CLI behind a web proxy, you need to configure your proxy settings.

### Set Proxy Settings

```Shell
tns proxy set <Url> <Username> <Password>
```

#### Attributes

<details><summary><code>&lt;Url&gt;</code></summary>
<strong>(Required)</strong> The full URL of the proxy. The <code>&lt;Url&gt;</code> attribute is required and if you do not provide it when running the command, the NativeScript CLI will prompt you to provide it. An example of a valid proxy URL is <code>http://127.0.0.1:8888</code>.</details>
 
<details><summary><code>&lt;Username&gt;</code> and <code>&lt;Password&gt;</code></summary>
<strong>(Optional)</strong> The credentials for the proxy. The <code>&lt;Username&gt;</code> and <code>&lt;Password&gt;</code> attributes are optional, however, if you choose to provide them, you must provide both.</details> 

#### Options

<details><summary><code>--insecure</code></summary>
The <code>--insecure</code> flag allows you to perform insecure SSL connections and transfers. This option is useful when your proxy does not have a CA certificate or the certificate is no longer valid.</details>

#### Limitations

* You can provide the `<Username>` and `<Password>` attributes only on Windows systems.
* Proxy settings for the npm and the Android Gradle need to be configured separately. For more information, see the following articles:
	* [Configure the npm proxy](https://docs.npmjs.com/misc/config#https-proxy)
	* [Configure the Android Gradle proxy](https://docs.gradle.org/3.3/userguide/build_environment.html#sec:accessing_the_web_via_a_proxy)

### Display Current Proxy Settings

```Shell
tns proxy
```

### Clear Proxy Settings

```Shell
tns proxy clear
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
* [Run Your Project](#run-your-project)

## The Commands

Run `tns help` to view all available commands in the browser. Run `tns help <Command>` to view more information about a selected command in the browser. `tns --help` opens console help, where help information is shown in the console.

[Back to Top][1]

## Create Project

To create a new cross-platform project from the default JavaScript template, run the following command.

```Shell
tns create MyApp
```

To create a new cross-platform project from the default TypeScript or Angular template, use the `template` option followed by either `typescript`, or `angular`.

```Shell
tns create MyApp --template typescript
tns create MyApp --template angular
```

Or you can simply use the shorthand `tsc` and `ng` options.

```Shell
tns create MyApp --tsc
tns create MyApp --ng
```
With the `template` option you can also specify a local or a remote path to the template that you want to use to create your project.
For example, if you want to use the nightly build of the default JavaScript template, run the following command.

```Shell
tns create MyApp --template https://github.com/NativeScript/template-hello-world.git
```

To create a new cross-platform project from an existing NativeScript project, run the following command.

```Shell
tns create MyApp --copy-from <Directory>
```

Where `<Directory>` is the complete path to the directory that contains your existing project. You can use any NativeScript project, created with the Telerik AppBuilder clients.

The NativeScript CLI creates a new project and sets the application identifier to `org.nativescript.myapp`.

The CLI places the project in a new directory in the current directory. The newly created directory has the following structure.

```
MyApp/
├── app
│   ├── app.css
│   ├── app.js
│   ├── bootstrap.js
│   ├── main-page.js
│   ├── main-page.xml
│   ├── App_Resources
│   │   └── ...
│   └── tns_modules
│       └── ...
└── platforms
    └── ...
```

* The `app` directory is the **development space for your application**. You should modify all common and platform-specific code within this directory. When you run `prepare <Platform>`, the NativeScript CLI copies relevant content to the platform-specific folders for each target platform.
* The `platforms` directory is created empty. When you add a target platform to your project, the NativeScript CLI creates a new subdirectory with the platform name. The subdirectory contains the ready-to-build resources of your app. When you run `prepare <Platform>`, the NativeScript CLI copies relevant content from the `app` directory to the platform-specific subdirectory for each target platform.

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

For more information about the structure of iOS native projects, see [Code Organization in Xcode Projects](http://akosma.com/2009/07/28/code-organization-in-xcode-projects/).

> **TIP:** The NativeScript team provides experimental support for the latest versions of iOS and Android. You can choose which platform runtime to use in your project by running `tns platform add <platform>@<Version>`<br/>To list all available versions for android, run $ npm view tns-android versions<br/>To list only experimental versions for android, run $ npm view tns-android dist-tags
To list all available versions for ios, run $ npm view tns-ios versions<br/>To list only experimental versions for ios, run $ npm view tns-ios dist-tags

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

> **IMPORTANT:** Avoid editing files located in the `platforms` subdirectory because the NativeScript CLI overrides such files during the `prepare <Platform>` using the contents of the `app` directory.

### Modifying Configuration Files

The NativeScript CLI respects any platform configuration files placed inside `app/App_Resources`. Those files are respectively `app/App_Resources/AndroidManifest.xml` for Android and `app/App_Resources/Info.plist` for iOS.

Additionaly, you can modify `app/App_Resources/build.xcconfig` and `app/App_Resources/app.gradle` for adding/removing additional build properties for iOS and Android, respectively.

### Modifying Entitlements File (iOS only)

To specify which Capabilities are required by your App - Maps, Push Notifications, Wallet and etc. you can add or edit the `app.entitlements` file placed inside `app/App_Resources/iOS`. When building the project, the default `app/App_Resources/iOS/app.entitlements` file gets merged with all Plugins entitlement files and a new `yourAppName.entitlements` is created in the platforms directory. The path would be `app/platforms/ios/<application name>/<application name>.entitlements` and will be linked in the `build.xcconfig` file.

You can always override the generated entitlements file, by pointing to your own entitlements file by setting the `CODE_SIGN_ENTITLEMENTS` property in the `app/App_Resources/iOS/build.xcconfig` file.

[Back to Top][1]

## Prepare for Build

When you run `build`, the NativeScript CLI uses the resources from the platform-specific subdirectory in the `platforms` directory. To populate the platform-specific subdirectory with the correct application assets, you need to run `prepare`.

```Shell
tns prepare android
tns prepare ios
```

`prepare <Platform>` takes content from `app`, analyzes it and copies it to the platform-specific subdirectory in `platforms`. This operation copies common and relevant platform-specific content that applies to the selected platform. This ensures that your Android or iOS application contain only the correct assets.

Keep in mind that `prepare` overrides changes made to the platform-specific subdirectory in `platforms`. For more information, see [Development in platforms](#development-in-platforms).

[Back to Top][1]

## Build Your Project

After you have prepared your project, you can build it for your target mobile platforms.

```Shell
tns build android
tns build ios
```

The NativeScript CLI calls the SDK for the selected target platform and uses it to build your app locally.

When you build for Android, the NativeScript CLI saves the application package as an `APK` in `platforms` &#8594; `android` &#8594; `bin`.

When you build for iOS, the NativeScript CLI will either build for a device, if there's a device attached, or for the native emulator if there are no devices attached. To trigger a native emulator build when a device is attached, set the `--emulator` flag.

The native emulator build is saved as an `APP` in `platforms` &#8594; `ios` &#8594; `build` &#8594; `emulator`. The device build is saved as an `IPA` in `platforms` &#8594; `ios` &#8594; `build` &#8594; `device`.

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
tns run android --emulator
tns run ios --emulator
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

[Back to Top][1]

Extending the CLI
===

The NativeScript CLI lets you extend its behavior and customize it to fit your needs by using [hooks](https://en.wikipedia.org/wiki/Hooking).

When you run one of the extendable commands (for example, `tns build`), the CLI checks for hooks and executes them. Plugins can also use hooks to control the compilation of the application package.

For more information, see the [Extending the CLI document](https://github.com/NativeScript/nativescript-cli/blob/master/extending-cli.md)

[Back to Top][1]

Troubleshooting
===

If the NativeScript CLI does not behave as expected, you might be facing a configuration issue. For example, a missing `JAVA` path. To check if your system is configured properly for the NativeScript CLI, run the following command.

```bash
tns doctor
```

This command prints warnings about current configuration issues and provides basic information about how to resolve them.

If addressing the configuration issues does not resolve your problem, you can [report an issue](https://github.com/NativeScript/nativescript-cli/blob/master/CONTRIBUTING.md#report-an-issue) or [post in the NativeScript forums](https://discourse.nativescript.org/).

[Back to Top][1]

Known Issues
===

* You cannot synchronize changes to apps on Android 4.3 devices and on some Samsung devices using the `run android` command.<br/>**Workaround:** Upgrade to a later version of Android to be able to use the `livesync` command. If you need to develop for Android 4.3 devices, re-build and re-deploy your app to get your latest changes on device.

* On macOS systems with configured firewall or web proxy, when you run a command, the operation might not release the command line and you might not be able to run other commands until you break the current operation.<br/>If you have enabled feature usage tracking for the NativeScript CLI, but you have not authenticated with the firewall or web proxy on your macOS system, the NativeScript CLI might not release the command line after you run a command. To continue working with the NativeScript CLI, you need to break the current operation by pressing `Ctrl+C`.<br/>**Workaround:** Authenticate with the firewall or web proxy.
    1. Close the terminal.
    1. Run Safari.
    1. Attempt to open a web page.
    1. Provide your authentication credentials for accessing the Internet.
    1. Run the terminal and continue working with the NativeScript CLI.

[Back to Top][1]

How to Contribute
===

To learn how to log a bug that you just discovered, click [here](https://github.com/NativeScript/nativescript-cli/blob/master/CONTRIBUTING.md#report-an-issue).

To learn how to suggest a new feature or improvement, click [here](https://github.com/NativeScript/nativescript-cli/blob/master/CONTRIBUTING.md#request-a-feature).

To learn how to contribute to the code base, click [here](https://github.com/NativeScript/nativescript-cli/blob/master/CONTRIBUTING.md#contribute-to-the-code-base).

[Back to Top][1]

How to Build
===
```
git clone https://github.com/NativeScript/nativescript-cli
cd nativescript-cli
npm run setup
```

To use the locally built CLI instead `tns` you can call `PATH_TO_CLI_FOLDER/bin/tns`. For example:
`PATH_TO_CLI_FOLDER/bin/tns run ios|android`

[Back to Top][1]

Get Help
===

Please, use [github issues](https://github.com/NativeScript/nativescript-cli/issues) strictly for [reporting bugs](CONTRIBUTING.md#report-an-issue) or [requesting features](CONTRIBUTING.md#request-a-feature). For general NativeScript questions and support, check out [Stack Overflow](https://stackoverflow.com/questions/tagged/nativescript) or ask our experts in the [NativeScript community Slack channel](http://developer.telerik.com/wp-login.php?action=slack-invitation).

[Back to Top][1]

License
===

This software is licensed under the Apache 2.0 license, quoted <a href="LICENSE" target="_blank">here</a>.

[Back to Top][1]

[1]: #nativescript-command-line-interface
[2]: https://travis-ci.org/NativeScript/nativescript-cli
[3]: http://docs.telerik.com/platform/appbuilder/nativescript/index
[4]: http://www.telerik.com/nativescript
[6]: https://github.com/nativescript/docs
[7]: https://docs.nativescript.org/
[8]: http://www.telerik.com/nativescript/faq
[9]: http://developer.telerik.com/featured/nativescript-a-technical-overview/
[10]: http://developer.telerik.com/featured/nativescript-android/
[11]: http://blogs.telerik.com/valentinstoychev/posts.aspx/14-06-12/announcing-nativescript---cross-platform-framework-for-building-native-mobile-applications
[12]: https://developer.apple.com/xcode/downloads/
[13]: https://rubygems.org/gems/xcodeproj/versions/0.28.2
[Chocolatey]: https://chocolatey.org/
[JDK 8]: http://www.oracle.com/technetwork/java/javase/downloads/index.html
[Android SDK 22]: http://developer.android.com/sdk/index.html
[Genymotion]: https://www.genymotion.com/#!/
[CocoaPods]: https://guides.cocoapods.org/using/getting-started.html#getting-started
[xcproj]: https://github.com/0xced/xcproj#installation
[Android SDK Build-tools 23.0.0]: http://developer.android.com/sdk/index.html
[Android Support Repository]: http://developer.android.com/sdk/index.html
![](https://ga-beacon.appspot.com/UA-111455-24/nativescript/nativescript-cli?pixel)
