NativeScript CLI Changelog
================

1.2.1 (2015, July 24)
==

### Fixed

* [Fixed #690](https://github.com/NativeScript/nativescript-cli/issues/690): The `$ tns debug ios --debug-brk` command is not working.

1.2.0 (2015, July 24)
==

### New

* [Implemented #621](https://github.com/NativeScript/nativescript-cli/issues/621): Added the `$ tns error-reporting` command. By default, anonymous error reporting is enabled.
* [Implemented #620](https://github.com/NativeScript/nativescript-cli/issues/620): Renamed the `$ tns feature-usage-tracking` command to `$ tns usage-reporting`. By default, anonymous usage reporting is enabled.
* [Implemented #523](https://github.com/NativeScript/nativescript-cli/issues/523): Added the `$ tns livesync <Platform>` command. You can use it to quickly synchronize changes to connected devices without re-building and re-deploying your apps.
* [Implemented #510](https://github.com/NativeScript/nativescript-cli/issues/510): Improvements and updates to the `$ tns plugin` sets of commands.
	* You can create and work with custom NativeScript plugins which contain Android native libraries.
	* You can create and work with custom NativeScript plugins which contain iOS dynamic native libraries.
	* The `$ tns plugin remove` command removes the Android native libraries carried by the plugin.
* [Implemented #480](https://github.com/NativeScript/nativescript-cli/issues/480): Added the `$ tns doctor` command. You can use it to quickly check for any configuration issues which might prevent the NativeScript CLI from working properly.

### Fixed

* [Fixed #658](https://github.com/NativeScript/nativescript-cli/issues/658): The `$ tns platform remove` command does not remove framework data from `package.json` for the project.
* [Fixed #644](https://github.com/NativeScript/nativescript-cli/issues/644): You cannot build your app for Android, if it contains a custom `styles.xml`.
* [Fixed #632](https://github.com/NativeScript/nativescript-cli/issues/632): On OS X systems with custom Chrome builds, you cannot debug Android apps. To be able to debug Android apps, you need to set the name of the custom Chrome build in the `ANDROID_DEBUG_UI_MAC` setting in `config.json`.
* [Fixed #629](https://github.com/NativeScript/nativescript-cli/issues/629): The `$ tns prepare` command does not populate the platform-specific directories correctly, if your project contains both an npm module, installed using `$ npm install`, and a NativeScript plugin, installed using `$ tns plugin add`.
* [Fixed #574](https://github.com/NativeScript/nativescript-cli/issues/574): The `$ tns prepare ios` command does not preserve file name casing when populating the platform-specific directories.
* [Fixed #538](https://github.com/NativeScript/nativescript-cli/issues/538): The NativeScript CLI interprets files whose names contain `ios` or `android` as platform-specific files and renames them, even if they are not platform-specific.
* [Fixed #281](https://github.com/NativeScript/nativescript-cli/issues/281): The `$ tns platform remove` command does not print any status message when the operation is successful.
* [Fixed #271](https://github.com/NativeScript/nativescript-cli/issues/271): The `$ tns create` command does not validate the path provided with the `--copy-from` option.
* [Fixed #139](https://github.com/NativeScript/nativescript-cli/issues/139): The `$ tns prepare` command does not remove files from the platform-specific directories correctly.

1.1.2 (2015, July 2)
==

### New

* [Implemented #600](https://github.com/NativeScript/nativescript-cli/issues/600): Added the `$ tns init` command. You can use it to initialize a NativeScript project for development. The command recreates or updates the `package.json` file of the project. You can then run `$ tns install` to install the platforms and dependencies described in the `package.json` file.
* [Implemented #587](https://github.com/NativeScript/nativescript-cli/issues/587): Added the `$ tns install` command. You can use it to quickly install all platforms and dependencies described in a `package.json` file.

### Fixed

* [Fixed #606](https://github.com/NativeScript/nativescript-cli/issues/606): The NativeScript CLI lets you run `<Platform>`-based commands on operating systems which do not support development for this platform. For example, you can run `$ tns build ios` on a Windows system.
* [Fixed #601](https://github.com/NativeScript/nativescript-cli/issues/601): The NativeScript CLI does not treat the dependencies of devDependencies as devDependencies.
* [Fixed #599](https://github.com/NativeScript/nativescript-cli/issues/599): The NativeScript CLI always creates a `tmp` directory in the current directory when you run any command and modifies the `package.json` file for the project.
* [Fixed #584](https://github.com/NativeScript/nativescript-cli/issues/584): The NativeScript CLI references the files in the project with their absolute paths instead of their relative paths. This might cause the project to stop working when transfered to another location and might cause issues with your application packages.
* [Fixed #578](https://github.com/NativeScript/nativescript-cli/issues/578): Platform-specific files in NativeScript plugins are not processed correctly. The NativeScript CLI copies them to the correct platform-specific directory but does not rename them correctly.
* [Fixed #520](https://github.com/NativeScript/nativescript-cli/issues/520): iOS resources from the `App_Resources` folder are not included in the native Xcode project and are not accessible in the application package.

1.1.1 (2015, June 17)
==

### New

* [Implemented #551](https://github.com/NativeScript/nativescript-cli/issues/551): You can now develop for Android 5.1.1 (API Level 22). If you have this SDK installed on your system, the CLI will set it as the default target SDK when you run `$ tns platform add android`
* [Implemented #552](https://github.com/NativeScript/nativescript-cli/issues/552): You can now set the target Android SDK for your project by specifying the `--sdk ` option for `$ tns platform add android` operations.

### Fixed

* [Fixed #555](https://github.com/NativeScript/nativescript-cli/issues/555): In some cases, the CLI merges incorrectly the plugin platform-specific `AndroidManifest.xml` or `Info.plist` with the respective platform-specific configuration files from the project.
* [Fixed #567](https://github.com/NativeScript/nativescript-cli/issues/567): You cannot use npm as a package manager inside your project.
* [Fixed #569](https://github.com/NativeScript/nativescript-cli/issues/569): On some Windows systems, the CLI installation shows errors in the console.

1.1.0 (2015, June 10)
==

### Breaking

* Replaced `.tnsproject` with `package.json` to let you use npm and work with custom plugins in your project.<br/>The first time you run any NativeScript command on an existing project, your `.tnsproject` file will be automatically transformed into a `package.json` file describing your project configuration and data. After this, make sure to commit and push your changes if you are using version control.<br/>After the transformation is complete, you can install and use custom NativeScript plugins inside your project.

### New

* [Implemented #510](https://github.com/NativeScript/nativescript-cli/issues/510): You can work with custom NativeScript plugins in your project. You can add a plugin from an npm package, a local folder, a URL or a `.tar.gz` file. For more information, run `$ tns help plugin`
* [Implemented #362](https://github.com/NativeScript/nativescript-cli/issues/362): You can use npm as package manager for your NativeScript projects.
	
### Updated

* [Updated #358](https://github.com/NativeScript/nativescript-cli/issues/358): Multiple improvements and bug fixes for iOS debugging.

### Fixed

* [Fixed #446](https://github.com/NativeScript/nativescript-cli/issues/446): Autocompletion might continue to work after disabling because `tns autocomplete disable` does not update `.profile` files.
* [Fixed #391](https://github.com/NativeScript/nativescript-cli/issues/391): The default 9-patch image for Android projects is malformed and causes error messages in the build log.
* [Fixed #324](https://github.com/NativeScript/nativescript-cli/issues/324): When you run commands for the `ios` platform, the NativeScript CLI might show the following unrelated adb warning: `Unable to find adb in PATH. Default one from %s resources will be used.`
* [Fixed #309](https://github.com/NativeScript/nativescript-cli/issues/309): You cannot open the device log for streaming with the `tns device log` command.

1.0.2 (2015, May 27)
==

### Fixed

* [Fixed #498](https://github.com/NativeScript/nativescript-cli/issues/498): On some Linux and OS X systems, when the USER or SUDO_USER environment variables are missing, you cannot run NativeScript CLI commands. The following error appears when you attempt to run `nativescript` or `tns` commands: `TypeError: Arguments to path.join must be strings`.

1.0.1 (2015, May 8)
==

### Fixed

* [Fixed #459](https://github.com/NativeScript/nativescript-cli/issues/459): You cannot add a third-party iOS native library to your project, if the path to the library contains spaces. 
* [Fixed #458](https://github.com/NativeScript/nativescript-cli/issues/458): If you have installed Xcode 6.2 or earlier on your system, you cannot debug in the iOS Simulator.
* [Fixed #413](https://github.com/NativeScript/nativescript-cli/issues/413): If your project name contains a hyphen, the NativeScript CLI sets your application identifier inconsistently across the project.

1.0.0 (2015, April 28)
==

### New

* [Implemented #447](https://github.com/NativeScript/nativescript-cli/issues/447): `tns run ios`, `tns run android` and `tns emulate android` print the output of the running application in the console. 
* [Implemented #441](https://github.com/NativeScript/nativescript-cli/issues/441): Improved command-line completion.
* [Implemented #416](https://github.com/NativeScript/nativescript-cli/issues/416): Improved installation.
* [Implemented #358](https://github.com/NativeScript/nativescript-cli/issues/358): Improved `tns debug ios`.

### Fixed

* [Fixed #446](https://github.com/NativeScript/nativescript-cli/issues/446): `tns autocomplete disable` might not disable command-line completion properly.
* [Fixed #445](https://github.com/NativeScript/nativescript-cli/issues/445): For some commands, HTML help is shown instead of the console help.
* [Fixed #444](https://github.com/NativeScript/nativescript-cli/issues/444): When you attempt to install the `nativescript` npm module using `sudo`, errors might be shown.
* [Fixed #443](https://github.com/NativeScript/nativescript-cli/issues/443): When you attempt to configure command-line completion during installation, `ENOENT` error might be shown.
* [Fixed #442](https://github.com/NativeScript/nativescript-cli/issues/442): The console does not show links properly.
* [Fixed #394](https://github.com/NativeScript/nativescript-cli/issues/394): On OS X or Linux systems, the NativeScript CLI does not resolve symlinks and you cannot build your apps.
* [Fixed #391](https://github.com/NativeScript/nativescript-cli/issues/391): The Android splash screen image in the template is malformed and causes errors in the build log.
* [Fixed #324](https://github.com/NativeScript/nativescript-cli/issues/324): If the Android SDK is not properly configured, when you run `tns build ios`, `run ios`, `tns deploy ios` or `tns emulate ios`, the NativeScript CLI prints an irrelevant adb-related warning.
* [Fixed #309](https://github.com/NativeScript/nativescript-cli/issues/309): You cannot open the device log for streaming with `tns device log`.
* [Fixed #276](https://github.com/NativeScript/nativescript-cli/issues/276): On bash consoles, command-line completion does not work.

0.10.0 (2015, April 21)
==

### Breaking

* Introduced new project structure. To migrate to the new structure, complete the following steps.
	1. Manually move all files and folders from the inner `app` folder one level up inside the outer `app` folder.
	1. Remove the now empty inner `app` folder.
	1. Verify that your project structure reflects the structure described [here](README.md#create-project).

### New

* [Implemented #388](https://github.com/NativeScript/nativescript-cli/issues/388): Improved the `--log trace` global option.
* [Implemented #387](https://github.com/NativeScript/nativescript-cli/issues/387): Improved installation.
* [Implemented #350](https://github.com/NativeScript/nativescript-cli/issues/350): Improved command-line completion.
* [Implemented #175](https://github.com/NativeScript/nativescript-cli/issues/175): You can run your app in Android virtual devices, created from the Google APIs images from the Android SDK.
* [Implemented #88](https://github.com/NativeScript/nativescript-cli/issues/88), [#291](https://github.com/NativeScript/nativescript-cli/issues/291): Introduced context-aware console help which you can access by running `tns <Command> -h` and extended HTML help which you access by running `tns help <Command>`.

### Fixed

* [Fixed #380](https://github.com/NativeScript/nativescript-cli/issues/380): When you run `tns build android`, `tns run android`, `tns deploy android` or `tns emulate android`, the NativeScript CLI builds your project twice.
* [Fixed #371](https://github.com/NativeScript/nativescript-cli/issues/371): On Android 5.x devices, NativeScript apps load very slowly on first run.
* [Fixed #260](https://github.com/NativeScript/nativescript-cli/issues/260): On bash consoles, the `open` command might stop working.
* [Fixed #257](https://github.com/NativeScript/nativescript-cli/issues/257): On bash consoles, you cannot pass arguments with spaces, even if escaped.
* [Fixed #251](https://github.com/NativeScript/nativescript-cli/issues/251): On OS X systems, the command validation might not work properly.
* [Fixed #248](https://github.com/NativeScript/nativescript-cli/issues/248): On OS X systems, the `tns deploy` command might not release the console.
* [Fixed #169](https://github.com/NativeScript/nativescript-cli/issues/169): The native Xcode project is created with an incorrect name. 

0.9.4 (2015, March 18)
==

### Fixed

* [Fixed #348](https://github.com/NativeScript/nativescript-cli/issues/348): `tns platform add ios` downloads the latest experimental version of the ios runtime instead of the latest stable version.

0.9.3 (2015, March 18)
==

### Fixed

* [Fixed #312](https://github.com/NativeScript/nativescript-cli/issues/312): `tns platform add ios` does not preserve your app ID, if not default.

0.9.2 (2015, March 17)
===

### New

* [Implemented #305](https://github.com/NativeScript/nativescript-cli/issues/305), [#322](https://github.com/NativeScript/nativescript-cli/issues/322): You can quickly add or update your platform runtime to a specific version by running `tns platform update platform@version`<br/>For example: `tns platform update ios@0.9.2-beta`<br/>The NativeScript team will publish experimental support for the latest versions of iOS and Android.<br/>To list all available versions for android, run $ npm view tns-android versions<br/>To list only experimental versions for android, run $ npm view tns-android dist-tags
To list all available versions for ios, run $ npm view tns-ios versions<br/>To list only experimental versions for ios, run $ npm view tns-ios dist-tags 
* [Implemented #302](https://github.com/NativeScript/nativescript-cli/issues/302): You can configure proxy settings for the NativeScript CLI.

### Fixed

* [Fixed #299](https://github.com/NativeScript/nativescript-cli/issues/299): You cannot build the default `Hello World` app for Android on OS X systems.
* [Fixed #297](https://github.com/NativeScript/nativescript-cli/issues/297): You cannot install the NativeScript CLI.