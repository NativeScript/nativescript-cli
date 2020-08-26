
<h1 id="nativescript-command-line-interface" align="center">
  <br>
  <a href="https://www.npmjs.com/package/nativescript"><img src="https://user-images.githubusercontent.com/760518/54612598-e70a3600-4a61-11e9-8d6d-7dd0c557e7cf.png" alt="Nativescript Logo" width="200"></a>
  <br>
	  <br>
   NativeScript Command-Line Interface
  <br>
</h1>

<h4 align="center">The NativeScript CLI lets you create, build, and deploy <a href="https://docs.nativescript.org/" target="_blank">NativeScript</a>-based apps on iOS and Android devices.</h4>
  </a>
</p>

<p align="center"> 
<a href="https://travis-ci.org/NativeScript/nativescript-cli"><img alt="Build Status" src="https://travis-ci.org/NativeScript/nativescript-cli.svg?branch=build"></a>
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
    * [Develop Your Project](#develop-your-project)
    * [Build Your Project](#build-your-project)
    * [Run Your Project](#run-your-project)
* [Extending the CLI](#extending-the-cli)
* [Troubleshooting](#troubleshooting)
* [How to Contribute](#how-to-contribute)
* [How to Build](#how-to-build)
* [Get Help](#get-help)
* [License](#license)

What is NativeScript
===

NativeScript is a cross-platform JavaScript framework that lets you develop native iOS and Android apps from a single code base. The framework provides JavaScript access to the native APIs, user interface, and rendering engines of iOS and Android. By using JavaScript or TypeScript, you can create one project that builds into an iOS or Android app with completely native user experience.

To learn more about NativeScript, you can check the following resources:

* [The NativeScript web page][2]
* [NativeScript - a Technical Overview][7]
* [Announcing NativeScript - cross-platform framework for building native mobile applications][8]
* The NativeScript [Documentation repo][3] and [Documentation portal][4]
* [The NativeScript FAQ][6]

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
* iOS 9.0 or later stable official release

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
ns doctor
```

## Configure Proxy Settings

If you are working with the NativeScript CLI behind a web proxy, you need to configure your proxy settings.

### Set Proxy Settings

```Shell
ns proxy set <Url> <Username> <Password>
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
* Proxy settings for the npm, the Android Gradle and (optional) Docker need to be configured separately. For more information, see the following articles:
	* [Configure the npm proxy](https://docs.npmjs.com/misc/config#https-proxy)
	* [Configure the Android Gradle proxy](https://docs.gradle.org/3.3/userguide/build_environment.html#sec:accessing_the_web_via_a_proxy)
    * [Configure the Docker proxy](https://docs.docker.com/network/proxy/)

### Display Current Proxy Settings

```Shell
ns proxy
```

### Clear Proxy Settings

```Shell
ns proxy clear
```

[Back to Top][1]

Quick Start
===

* [The Commands](#the-commands)
* [Create Project](#create-project)
* [Develop Your Project](#develop-your-project)
* [Build Your Project](#build-your-project)
* [Run Your Project](#run-your-project)

## The Commands

Run `ns help` to view all available commands in the browser. Run `ns help <Command>` to view more information about a selected command in the browser. `ns --help` opens console help, where help information is shown in the console.

[Back to Top][1]

## Create Project

To create a new cross-platform project from the default JavaScript template, run the following command.

```Shell
ns create MyApp --js
```

To create a new cross-platform project from the default TypeScript, Angular or Vue template, use the `template` option followed by either `typescript`, `angular` or `vue`.

```Shell
ns create MyApp --template typescript
ns create MyApp --template angular
ns create MyApp --template vue
```

Or you can simply use the shorthand `tsc` and `ng` options.

```Shell
ns create MyApp --tsc
ns create MyApp --ng
```
With the `template` option you can also specify a local or a remote path to the template that you want to use to create your project.
For example, if you want to create a React template, run the following command.

```Shell
ns create MyApp --template https://github.com/shirakaba/tns-template-blank-react.git
```

The NativeScript CLI creates a new project and sets the application identifier to `org.nativescript.myapp`.

The CLI places the project in a new directory in the current directory. The newly created directory has the following structure.

```
MyApp/
├── app
│   ├── App_Resources
│   └── ...
└── platforms
    └── ...
```

* The `app` directory is the **development space for your application**. You should modify all common and platform-specific code within this directory. When you run `prepare <Platform>`, the NativeScript CLI prepares relevant content to the platform-specific folders for each target platform.
* The `platforms` directory is created empty. When you add a target platform to your project, the NativeScript CLI creates a new subdirectory with the platform name. The subdirectory contains the ready-to-build resources of your app. When you run `prepare <Platform>`, the NativeScript CLI prepares relevant content from the `app` directory to the platform-specific subdirectory for each target platform.

[Back to Top][1]

## Develop Your Project

* [Development with NativeScript](#development-with-nativescript)
* [Development in app](#development-in-app)
* [Development in platforms](#development-in-platforms)

### Development with NativeScript

For more information about working with NativeScript, see the following resources.

* [The NativeScript Documentation Wiki][3]
* [The NativeScript API Reference][5]

### Development in `app`

The `app` directory in the root of the project is the development space for your project. **Place all your common and platform-specific code in this directory.**

In the `app` directory, you can use **platform-specific files** to provide customized functionality and design for each target platform. To indicate that a file is platform-specific, make sure that the file name is in the following format: `name.ios.extension` or `name.android.extension`. For example: `main.ios.js` or `main.android.js`.

You can develop shared functionality or design in common files. To indicate that a file is common, make sure that the file name does not contain a `.android.` or `.ios.` string.

### Development in `platforms`

> **IMPORTANT:** Avoid editing files located in the `platforms` subdirectory because the NativeScript CLI overrides such files.

### Modifying Configuration Files

The NativeScript CLI respects any platform configuration files placed inside `app/App_Resources`.

### Modifying Entitlements File (iOS only)

To specify which Capabilities are required by your App - Maps, Push Notifications, Wallet and etc. you can add or edit the `app.entitlements` file placed inside `app/App_Resources/iOS`. When building the project, the default `app/App_Resources/iOS/app.entitlements` file gets merged with all Plugins entitlement files and a new `yourAppName.entitlements` is created in the platforms directory. The path would be `app/platforms/ios/<application name>/<application name>.entitlements` and will be linked in the `build.xcconfig` file.

You can always override the generated entitlements file, by pointing to your own entitlements file by setting the `CODE_SIGN_ENTITLEMENTS` property in the `app/App_Resources/iOS/build.xcconfig` file.

[Back to Top][1]

## Build Your Project

You can build it for your target mobile platforms.

```Shell
ns build android
ns build ios
```

The NativeScript CLI calls the SDK for the selected target platform and uses it to build your app locally.

When you build for iOS, the NativeScript CLI will either build for a device, if there's a device attached, or for the native emulator if there are no devices attached. To trigger a native emulator build when a device is attached, set the `--emulator` flag.

> **IMPORTANT:** To build your app for an iOS device, you must configure a valid certificate and provisioning profile pair, and have that pair present on your system for code signing your application package. For more information, see [iOS Code Signing - A Complete Walkthrough](http://seventhsoulmountain.blogspot.com/2013/09/ios-code-sign-in-complete-walkthrough.html).

[Back to Top][1]

## Run Your Project

You can test your work in progress on connected Android or iOS devices.

To verify that the NativeScript CLI recognizes your connected devices, run the following command.

```Shell
ns devices
```

The NativeScript CLI lists all connected physical devices and running emulators/simulators.

After you have listed the available devices, you can quickly run your app on connected devices by executing:

```Shell
ns run android
ns run ios
```

[Back to Top][1]

Extending the CLI
===

The NativeScript CLI lets you extend its behavior and customize it to fit your needs by using [hooks](https://en.wikipedia.org/wiki/Hooking).

When you run one of the extendable commands (for example, `ns build`), the CLI checks for hooks and executes them. Plugins can also use hooks to control the compilation of the application package.

For more information, see the [Extending the CLI document](https://github.com/NativeScript/nativescript-cli/blob/master/extending-cli.md)

[Back to Top][1]

Troubleshooting
===

If the NativeScript CLI does not behave as expected, you might be facing a configuration issue. For example, a missing `JAVA` path. To check if your system is configured properly for the NativeScript CLI, run the following command.

```bash
ns doctor
```

This command prints warnings about current configuration issues and provides basic information about how to resolve them.

If addressing the configuration issues does not resolve your problem, you can [report an issue](https://github.com/NativeScript/nativescript-cli/blob/master/CONTRIBUTING.md#report-an-issue) or [ask the community](https://stackoverflow.com/questions/tagged/nativescript).

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
`PATH_TO_CLI_FOLDER/bin/ns run ios|android`

[Back to Top][1]

Get Help
===

Please, use [github issues](https://github.com/NativeScript/nativescript-cli/issues) strictly for [reporting bugs](CONTRIBUTING.md#report-an-issue) or [requesting features](CONTRIBUTING.md#request-a-feature). For general NativeScript questions and support, check out [Stack Overflow](https://stackoverflow.com/questions/tagged/nativescript) or ask our experts in the [NativeScript community Slack channel](https://www.nativescript.org/slack-invitation-form).

[Back to Top][1]

License
===

This software is licensed under the Apache 2.0 license, quoted <a href="LICENSE" target="_blank">here</a>.

[Back to Top][1]

[1]: #nativescript-command-line-interface
[2]: https://www.progress.com/nativescript
[3]: https://github.com/nativescript/docs
[4]: https://docs.nativescript.org/
[5]: https://docs.nativescript.org/api-reference
[6]: https://www.nativescript.org/faq
[7]: https://docs.nativescript.org/core-concepts/technical-overview
[8]: http://blogs.telerik.com/valentinstoychev/posts.aspx/14-06-12/announcing-nativescript---cross-platform-framework-for-building-native-mobile-applications
