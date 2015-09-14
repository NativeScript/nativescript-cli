# Using CocoaPods

When you develop for iOS, you can quickly add third-party libraries to your NativeScript projects via the [CocoaPods](https://cocoapods.org/) dependency manager.

To work with such libraries, you need to wrap them as a custom NativeScript plugin and add them to your project.

 * [Install CocoaPods](#install-cocoapods)
 * [Create CLI Project](#create-cli-project)
 * [Wrap the Library as NativeScript Plugin](#wrap-the-library-as-nativescript-plugin)
 * [Build the Project](#build-the-project)

## Install CocoaPods
You need to install CocoaPods. If you haven't yet, you can do so by running:

```
$ sudo gem install cocoapods
```
> **NOTE:** All operations and code in this article are verified against CocoaPods 0.38.2.

To check your current version, run the following command.

```
$ pod --version
```

To update CocoaPods, just run the installation command again.

```
sudo gem install cocoapods
```

## Create CLI Project
To start, create a project and add the iOS platform.

```bash
$ tns create MYCocoaPods
$ cd MYCocoaPods
$ tns platform add ios
```

## Wrap the Library as NativeScript Plugin

For more information about working with NativeScript plugins, click [here](PLUGINS.md).

```
cd ..
mkdir my-plugin
cd my-plugin
```

Create a package.json file with the following content:

```
{
  "name": "myplugin",
  "version": "0.0.1",
  "nativescript": {
    "platforms": {
      "ios": "1.3.0"
    }
  }
}
```

Create a [Podfile](https://guides.cocoapods.org/syntax/podfile.html) which describes the dependency to the library that you want to use. Move it to the `platforms/ios` folder.

```
my-plugin/
├── package.json
└── platforms/
    └── ios/
        └── Podfile
```

Next, install the plugin:

```
tns plugin add ../my-plugin
```

## Build the project

```
tns build ios
```

This modifies the `MYCocoaPods.xcodeproj` and creates a workspace with the same name.

> **IMPORTANT:** You will no longer be able to run the `xcodeproj` alone. NativeScript CLI will build the newly created workspace and produce the correct .ipa.