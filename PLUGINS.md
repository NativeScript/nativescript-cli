PLUGINS
=========

Starting with NativeScript CLI 1.1.0, you can develop or use plugins in your NativeScript projects.

* [What Are NativeScript Plugins](#what-are-nativescript-plugins)
* [Create a Plugin](#create-a-plugin)
  * [Directory Structure](#directory-structure)
  * [Package.json Specification](#packagejson-specification)
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

* A `package.json` file which contains the following metadata: name, version, supported runtime versions, dependencies and others. For more information, see the [Package.json Specification](#packagejson-specification) section.
* One or more CommonJS modules that expose a native API via a unified JavaScript API. For more information about Common JS modules, see the [CommonJS Wiki](http://wiki.commonjs.org/wiki/CommonJS).
* `AndroidManifest.xml` and `Info.plist` which describe the permissions, features or other configurations required or used by your app for Android and iOS, respectively.

The plugin must have the directory structure, described in the [Directory Structure](#directory-structure) section.

## Create a Plugin

If the NativeScript framework does not expose a native API that you need, you can develop a plugin which exposes the required functionality. When you develop a plugin, keep in mind the following requirements.

* The plugin must be a valid npm package.
* The plugin must expose a built-in native API. Currently, you cannot expose native APIs available via custom native libraries.
* The plugin must be written in JavaScript or TypeScript and must comply with the CommonJS specification. If written in TypeScript, make sure to include the compiled `JavaScript` file in your plugin.
* The plugin directory structure must comply with the specification described below.
* The plugin must contain a valid `package.json` which complies with the specification described below.
* If the plugin requires any permissions, features or other configuration specifics, it must contain `AndroidManifest.xml` and `Info.plist` file which describe them.

### Directory Structure

NativeScript plugins which consist of one CommonJS module must have the following directory structure.

```
my-plugin/
├── index.js
├── package.json
└── platforms/
    ├── android/
    │   └── AndroidManifest.xml
    └── ios
        └── Info.plist
```

NativeScript plugins which consist of multiple CommonJS modules must have the following directory structure.

```
my-plugin/
├── package.json
├── MyModule1/
│   ├── index1.js
│   └── package.json
├── MyModule2/
│   ├── index2.js
│   └── package.json
└── platforms/
    ├── android/
    │   └── AndroidManifest.xml
    └── ios
        └── Info.plist
```

* `index.js`: This file is the CommonJS module which exposes the native API. You can use platform-specific `*.platform.js` files. For example: `index.ios.js` and `index.android.js`. During the plugin installation, the NativeScript CLI will copy the platform resources to the `tns_modules` subdirectory in the correct platform destination in the `platforms` directory of your project.
* `package.json`: This file contains the metadata for your plugin. It sets the supported runtimes, the plugin name and version and any dependencies. The `package.json` specification is described in detail below.
* `platforms\android\AndroidManifest.xml`: This file describes any specific configuration changes required for your plugin to work. For example: required permissions. For more information about the format of `AndroidManifest.xml`, see [App Manifest](http://developer.android.com/guide/topics/manifest/manifest-intro.html).<br/>During the plugin installation, the NativeScript CLI will merge the plugin `AndroidManifest.xml` with the `AndroidManifest.xml` for your project. The NativeScript CLI will not resolve any contradicting or duplicate entries during the merge. After the plugin is installed, you need to manually resolve such issues. 
* `platforms\ios\Info.plist`: This file describes any specific configuration changes required for your plugin to work. For example: required permissions. For more information about the format of `Info.plist`, see [About Information Property List Files](https://developer.apple.com/library/ios/documentation/General/Reference/InfoPlistKeyReference/Articles/AboutInformationPropertyListFiles.html).<br/>During the plugin installation, the NativeScript CLI will merge the plugin `Info.plist` with the `Info.plist` for your project. The NativeScript CLI will not resolve any contradicting or duplicate entries during the merge. After the plugin is installed, you need to manually resolve such issues. 

> **IMPORTANT:** Currently, you cannot add any platform-specific resources other than `AndroidManifest.xml` and `Info.plist` in the `platforms` directory of the plugin.

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

Next, the NativeScript CLI runs a partial `prepare` operation for the plugin for all platforms configured for the project. During this operation, the CLI copies only the plugin to the `tns_modules` subdirectories in the `platforms\android` and `platform\ios` directories in your project. If your plugin contains platform-specific `JS` files, the CLI copies them to the respective platform subdirectory and renames them by removing the platform modifier. 

> **TIP:** If you have not configured any platforms, when you run `$ tns platform add`, the NativeScript CLI will automatically prepare all installed plugins for the selected platform.

Finally, the CLI merges the plugin `AndroidManifest.xml` and `Info.plist` files with `platforms\android\AndroidManifest.xml` and `platforms\ios\Info.plist` in your project.

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

> **IMPROTANT:** This operation does not remove files from the `platforms\android` and `platforms\ios` directories and does not unmerge the `AndroidManifest.xml` and `Info.plist` files. 

### Manual Steps After Removal

After the plugin removal is complete, you need to run the following command.

```Shell
tns prepare <Platform>
```

Make sure to run the command for all platforms configured for the project. During this operation, the NativeScript CLI will remove any leftover plugin files from your `platforms\android` and `platforms\ios` directories.

> **TIP:** Instead of `$ tns prepare` you can run `$ tns build`, `$ tns run`, `$ tns deploy` or `$ tns emulate`. All these commands run `$ tns prepare`.

Next, open your `platforms\android\AndroidManifest.xml` and `platforms\ios\Info.plist` files and remove any leftover entries from the plugin `AndroidManifest.xml` and `Info.plist` files.

Finally, make sure to update your code not to use the uninstalled plugin.