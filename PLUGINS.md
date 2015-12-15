PLUGINS
=========

Starting with NativeScript CLI 1.1.0, you can develop or use plugins in your NativeScript projects.

* [What Are NativeScript Plugins](#what-are-nativescript-plugins)
* [Create a Plugin](#create-a-plugin)
  * [Directory Structure](#directory-structure)
  * [`package.json` Specification](#packagejson-specification)
  * [`include.gradle` Specification](#includegradle-specification)
  * [`build.xcconfig` Specification](#buildxcconfig-specification)
* [Install a Plugin](#install-a-plugin)
  * [Valid Plugin Sources](#valid-plugin-sources)
  * [Installation Specifics](#installation-specifics)
  * [Manual Steps After Installation](#manual-steps-after-installation)
* [Use a Plugin](#use-a-plugin)
* [Remove a Plugin](#remove-a-plugin)
  * [Removal Specifics](#removal-specifics)
  * [Manual Steps After Removal](#manual-steps-after-removal)

## What Are NativeScript Plugins

A NativeScript plugin is any npm package, published or not, that exposes a native API via JavaScript and consists of the following elements.

* A `package.json` file which contains the following metadata: name, version, supported runtime versions, dependencies and others. For more information, see the [`package.json` Specification](#packagejson-specification) section.
* One or more CommonJS modules that expose a native API via a unified JavaScript API. For more information about Common JS modules, see the [CommonJS Wiki](http://wiki.commonjs.org/wiki/CommonJS).
* (Optional) `AndroidManifest.xml` and `Info.plist` which describe the permissions, features or other configurations required or used by your app for Android and iOS, respectively.
* (Optional) Native Android libraries and the native Android `include.gradle` configuration file which describes the native dependencies. For more information, see the [`include.gradle` Specification](#includegradle-specification) section.
* (Optional) Native iOS libraries and the native `build.xcconfig` configuration file which describes the native dependencies. For more information, see the [`build.xcconfig` Specification](#buildxcconfig-specification) section.

The plugin must have the directory structure, described in the [Directory Structure](#directory-structure) section.

## Create a Plugin

If the NativeScript framework does not expose a native API that you need, you can develop a plugin which exposes the required functionality. When you develop a plugin, keep in mind the following requirements.

* The plugin must be a valid npm package.
* The plugin must expose a built-in native API or a native API available via custom native libraries.
* The plugin must be written in JavaScript and must comply with the CommonJS specification. If you are using a transpiler, make sure to include the transpiled JavaScript files in your plugin.
* The plugin directory structure must comply with the specification described below.
* The plugin must contain a valid `package.json` which complies with the specification described below.
* If the plugin requires any permissions, features or other configuration specifics, it must contain `AndroidManifest.xml` or `Info.plist` file which describe them.
* If the plugin depends on native libraries, it must contain a valid `include.gradle` or `build.xcconfig` file, which describes the dependencies.

### Directory Structure

NativeScript plugins which consist of one CommonJS module might have the following directory structure.

```
my-plugin/
├── index.js
├── package.json
└── platforms/
    ├── android/
    │   ├── res/
    │   └── AndroidManifest.xml
    └── ios/
        └── Info.plist
```

NativeScript plugins which consist of multiple CommonJS modules might have the following directory structure.

```
my-plugin/
├── index.js
├── package.json
├── MyModule1/
│   ├── index1.js
│   └── package.json
├── MyModule2/
│   ├── index2.js
│   └── package.json
└── platforms/
    ├── android/
    │   ├── AndroidManifest.xml
    │   └── res/
    └── ios/
        └── Info.plist
```

* `index.js`: This file is the CommonJS module which exposes the native API. You can use platform-specific `*.platform.js` files. For example: `index.ios.js` and `index.android.js`. During the plugin installation, the NativeScript CLI will copy the platform resources to the `tns_modules` subdirectory in the correct platform destination in the `platforms` directory of your project.<br/>Alternatively, you can give any name to this CommonJS module. In this case, however, you need to point to this file by setting the `main` key in the `package.json` for the plugin. For more information, see [Folders as Modules](https://nodejs.org/api/modules.html#modules_folders_as_modules).
* `package.json`: This file contains the metadata for your plugin. It sets the supported runtimes, the plugin name and version and any dependencies. The `package.json` specification is described in detail below.
* `platforms\android\AndroidManifest.xml`: This file describes any specific configuration changes required for your plugin to work. For example: required permissions. For more information about the format of `AndroidManifest.xml`, see [App Manifest](http://developer.android.com/guide/topics/manifest/manifest-intro.html).<br/>During build, gradle will merge the plugin `AndroidManifest.xml` with the `AndroidManifest.xml` for your project. The NativeScript CLI will not resolve any contradicting or duplicate entries during the merge. After the plugin is installed, you need to manually resolve such issues.
* `platforms\android\res`:  (Optional) This directory contains resources declared by the `AndroidManifest.xml` file. You can look at the folder structure [here](http://developer.android.com/guide/topics/resources/providing-resources.html#ResourceTypes).
* `platforms\ios\Info.plist`: This file describes any specific configuration changes required for your plugin to work. For example, required permissions. For more information about the format of `Info.plist`, see [About Information Property List Files](https://developer.apple.com/library/ios/documentation/General/Reference/InfoPlistKeyReference/Articles/AboutInformationPropertyListFiles.html).<br/>During the plugin installation, the NativeScript CLI will merge the plugin `Info.plist` with the `Info.plist` for your project. The NativeScript CLI will not resolve any contradicting or duplicate entries during the merge. After the plugin is installed, you need to manually resolve such issues.

NativeScript plugins which contain both native Android and iOS libraries might have the following directory structure.

```
my-plugin/
├── ...
└── platforms/
    ├── android/
    │   ├── res/
    │   ├── MyLibrary.jar
    │   ├── MyLibrary.aar
    │   ├── include.gradle
    │   └── AndroidManifest.xml
    └── ios/
        ├── MyiOSFramework.framework
        ├── build.xcconfig
        ├── Podfile
        ├── Info.plist
        ├── MyStaticiOSLibrary.a
        └── include/
            └── MyStaticiOSLibrary/
                └── ...
```

* `platforms\android`: This directory contains any native Android libraries packaged as `*.jar` and `*.aar` packages. These native libraries can reside in the root of this directory or in a user-created sub-directory. During the plugin installation, the NativeScript CLI will configure the Android project in `platforms\android` to work with the plugin.
* `platforms\android\res`:  (Optional) This directory contains resources declared by the `AndroidManifest.xml` file. You can look at the folder structure [here](http://developer.android.com/guide/topics/resources/providing-resources.html#ResourceTypes).
* `platforms\android\include.gradle`: This file modifies the native Android configuration of your NativeScript project such as native dependencies, build types and configurations. For more information about the format of `include.gradle`, see [`include.gradle` file](#includegradle-specification).
* `platforms\ios`: This directory contains native dynamic iOS Cocoa Touch Frameworks (`.framework`) and Cocoa Touch Static Libraries (`.a`). During the plugin installation, the NativeScript CLI will copy these files to `lib\iOS` in your project and will configure the iOS project in `platforms\ios` to work with the libraries.  If the library is written in Swift, only APIs exposed to Objective-C are exposed to NativeScript. In case the plugin contains a Cocoa Touch Static Library (`.a`), you must place all public headers (`.h`) under `include\<Static Library Name>\`. Make sure that the static libraries are built at least for the following processor architectures - armv7, arm64, i386.
* `platforms\ios\build.xcconfig`: This file modifies the native iOS configuration of your NativeScript project such as native dependencies and configurations. For more information about the format of `build.xcconfig`, see [`build.xcconfig` file](#buildxcconfig-specification).
* `platforms\ios\Podfile`: This file describes the dependency to the library that you want to use. For more information, see [the CocoaPods article](CocoaPods.md).

### Package.json Specification

Every NativeScript plugin should contain a valid `package.json` file in its root. This `package.json` file must meet the following requirements.

* It must comply with the [npm specification](https://docs.npmjs.com/files/package.json).<br/>The `package.json` must contain at least `name` and `version` pairs. You will later use the plugin in your code by requiring it by its `name`.
* It must contain a `nativescript` section which describes the supported NativeScript runtimes and their versions. This section can be empty. If you want to define supported platforms and runtimes, you can nest a `platforms` section. In this `platforms` section, you can nest `ios` and `android` key-value pairs. The values in these pairs must be valid runtime versions or ranges of values specified by a valid semver(7) syntax.
* If the plugin depends on other npm modules, it must contain a `dependencies` section as described [here](https://docs.npmjs.com/files/package.json#dependencies).<br/>The NativeScript CLI will resolve the dependencies during the plugin installation.

#### Package.json Example

The following is an example of a `package.json` file for a NativeScript plugin which supports the 1.0.0 version of the iOS runtime and the 1.1.0 version of the Android runtime.

```JSON
{
  "name": "myplugin",
  "version": "0.0.1",
  "nativescript": {
    "platforms": {
      "ios": "1.0.0",
      "android": "1.1.0"
    }
  }
}
```

### Include.gradle Specification

Every NativeScript plugin, which contains native Android dependencies, should also contain a valid `include.gradle` file in the root of its `platforms\android` directory. This `include.gradle` file must meet the following requirements.

* It must contain its own [configuration](http://developer.android.com/tools/building/configuring-gradle.html).
* It might contain native dependencies required to build the plugin properly.
* Any native dependencies should be available in [jcenter](https://bintray.com/bintray/jcenter) or from the Android SDK installed on your machine.

> **IMPORTANT:** If you don't have an `include.gradle` file, at build time, gradle will create a default one containing all default elements.

#### Include.gradle Example
```gradle
//default elements
android {
  productFlavors {
    "my-plugin" {
      dimension "my-plugin"
    }
  }
}

//optional elements
dependencies {
    compile "groupName:pluginName:ver"
}
```

### Build.xcconfig Specification
Every NativeScript plugin, which contains native iOS dependencies, can also contain a [valid](https://pewpewthespells.com/blog/xcconfig_guide.html) `build.xcconfig` file in the root of its `platforms\ios` directory. This `build.xcconfig` file might contain native dependencies required to build the plugin properly.

#### Build.xcconfig Example
```
OTHER_LDFLAGS = $(inherited) -framework "QuartzCore" -l"sqlite3"
```

## Install a Plugin

To install a plugin for your project, inside your project, run the following command.

```Shell
tns plugin add <Plugin>
```

### Valid Plugin Sources

You can specify a plugin by name in the npm registry, local path or URL. The following are valid values for the `<Plugin>` attribute.

* A `<Name>` or `<Name>@<Version>` for plugins published in the npm registry.
* A `<Local Path>` to the directory which contains the plugin files and its `package.json` file.
* A `<Local Path>` to a `.tar.gz` archive containing a directory with the plugin and its `package.json` file.
* A `<URL>` which resolves to a `.tar.gz` archive containing a directory with the plugin and its `package.json` file.
* A `<git Remote URL>` which resolves to a `.tar.gz` archive containing a directory with the plugin and its `package.json` file.

### Installation Specifics

The installation of a NativeScript plugin mimics the installation of an npm module.

The NativeScript CLI takes the plugin and installs it to the `node_modules` directory in the root of your project. During this process, the NativeScript CLI resolves any dependencies described in the plugin `package.json` file and adds the plugin to the project `package.json` file in the project root.

If the NativeScript CLI detects any native iOS libraries in the plugin, it copies the library files to the `lib\ios` folder in your project and configures the iOS-specific projects in `platforms\ios` to work with the library.

Next, the NativeScript CLI runs a partial `prepare` operation for the plugin for all platforms configured for the project. During this operation, the CLI copies only the plugin to the `tns_modules` subdirectories in the `platforms\android` and `platforms\ios` directories in your project. If your plugin contains platform-specific `JS` files, the CLI copies them to the respective platform subdirectory and renames them by removing the platform modifier.

> **TIP:** If you have not configured any platforms, when you run `$ tns platform add`, the NativeScript CLI will automatically prepare all installed plugins for the newly added platform.

Finally, the CLI merges the plugin `Info.plist` file with `platforms\ios\Info.plist` in your project. The plugin `AndroidManifest.xml` will be merged with `platforms\android\AndroidManifest.xml` later, at build time.

> **IMPORTANT:** Currently, the merging of the platform configuration files does not resolve any contradicting or duplicate entries.

#### AndroidManifest.xml Merge Example

The following is an example of a plugin `AndroidManifest`, project `AndroidManifest.xml` and the resulting merged file after the plugin installation.

**The Plugin Manifest**

```XML
<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.READ_CONTACTS"/>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_LOCATION_EXTRA_COMMANDS" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="com.example.towntour.permission.MAPS_RECEIVE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.READ_PHONE_STATE" />
    <uses-permission android:name="com.google.android.providers.gsf.permission.READ_GSERVICES" />

</manifest>
```

**The Project Manifest Located in `platforms\android\`**

```XML
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="org.nativescript.test"
    android:versionCode="1"
    android:versionName="1.0" >

   <uses-sdk
        android:minSdkVersion="17"
        android:targetSdkVersion="17" />

    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
    <uses-permission android:name="android.permission.INTERNET"/>

    <application
        android:name="com.tns.NativeScriptApplication"
        android:allowBackup="true"
        android:icon="@drawable/icon"
        android:label="@string/app_name"
        android:theme="@style/AppTheme" >
        <activity
            android:name="com.tns.NativeScriptActivity"
            android:label="@string/title_activity_kimera"
            android:configChanges="keyboardHidden|orientation|screenSize">

             <intent-filter>
                <action android:name="android.intent.action.MAIN" />

                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

**The Merged Manifest Located in `platforms\android\`**

```XML
<?xml version="1.0" encoding="utf-8"?>
<manifest
  xmlns:android="http://schemas.android.com/apk/res/android" package="org.nativescript.test" android:versionCode="1" android:versionName="1.0">
  <uses-sdk android:minSdkVersion="19" android:targetSdkVersion="21"/>
  <uses-permission android:name="android.permission.READ_CONTACTS"/>
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
  <uses-permission android:name="android.permission.ACCESS_LOCATION_EXTRA_COMMANDS"/>
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
  <uses-permission android:name="com.example.towntour.permission.MAPS_RECEIVE"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.CALL_PHONE"/>
  <uses-permission android:name="android.permission.READ_PHONE_STATE"/>
  <!--
    Some comment here
  -->
  <uses-permission android:name="com.google.android.providers.gsf.permission.READ_GSERVICES"/>
  <application android:name="com.tns.NativeScriptApplication" android:allowBackup="true" android:icon="@drawable/icon" android:label="@string/app_name" android:theme="@style/AppTheme">
    <activity android:name="com.tns.NativeScriptActivity" android:label="@string/title_activity_kimera" android:configChanges="keyboardHidden|orientation|screenSize">
      <intent-filter>
        <action android:name="android.intent.action.MAIN"/>
        <action android:name="android.intent.action.EDIT"/>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.LAUNCHER"/>
      </intent-filter>
    </activity>
  </application>
</manifest>
```

### Manual Steps After Installation

After the installation is complete, you need to open `platforms\android\AndroidManifest.xml` and `platforms\ios\Info.plist` in your project and inspect them for duplicate or contradicting entries. Make sure to preserve the settings required by the plugin. Otherwise, your app might not build or it might not work as expected, when deployed on device.

## Use a Plugin

To use a plugin inside your project, you need to add a `require` in your app.

```JavaScript
var myPlugin = require("myplugin");
```

This will look for a `myplugin` module with a valid `package.json` file in the `tns_modules` directory. Note that you must require the plugin with the value for the `name` key in the plugin `package.json` file.

## Remove a Plugin

To remove a plugin from your project, inside your project, run the following command.

```Shell
tns plugin remove <Plugin>
```

You must specify the plugin by the value for the `name` key in the plugin `package.json` file.

### Removal Specifics

The removal of a NativeScript plugin mimics the removal of an npm module.

The NativeScript CLI removes any plugin files from the `node_modules` directory in the root of your project. During this process, the NativeScript CLI removes any dependencies described in the plugin `package.json` file and removes the plugin from the project `package.json` file in the project root.

> **IMPORTANT:** For iOS, this operation does not remove files from the `platforms\ios` directories and native iOS libraries, and does not unmerge the `Info.plist` file. For Android, this operation unmerges the `AndroidManifest.xml` file and takes care of removing any plugin files located in `platforms\android`.

### Manual Steps After Removal

After the plugin removal is complete, make sure to remove any leftover native iOS library files from the `lib\ios` directory in the root of the project. Update the iOS-specific projects in `platforms\ios` to remove any dependencies on the removed native libraries.

Next, you need to run the following command.

```Shell
tns prepare <Platform>
```

Make sure to run the command for all platforms configured for the project. During this operation, the NativeScript CLI will remove any leftover plugin files from your `platforms\ios` directory.

> **TIP:** Instead of `$ tns prepare` you can run `$ tns build`, `$ tns run`, `$ tns deploy` or `$ tns emulate`. All these commands run `$ tns prepare`.

Next, open your `platforms\ios\Info.plist` file and remove any leftover entries from the plugin `Info.plist` file.

Finally, make sure to update your code not to use the uninstalled plugin.
