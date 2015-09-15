library add
==========

Usage | Synopsis
------|-------
General | `$ tns library add <Platform> <Library Path>`

Adds a locally stored native library to the current project. <% if(isHtml) { %>Copies the library files to the `lib/<platform>` folder in your project and configures the platform-specific projects in `platforms/<platform>` to work with the library. Build operations might perform additional configuration changes on the platform-specific project in `platforms/<platform>`.<% } %>

IMPORTANT: The `tns library add` command is deprecated and will be removed in a future release. Use the `tns plugin` set of commands instead. For more information, <% if(isHtml) { %>see the [plugin](plugin.html) set of commands.<% } %><% if(isConsole) { %>run `tns help plugin`.<% } %>.

IMPORTANT: When adding frameworks, keep in mind the following behaviors.

* Any functionality exposed by the library will become available in the built application package.
* The first build operation after you run this command is significantly slower.
<% if(isMacOS) { %>* When you add an iOS framework, the NativeScript CLI automatically changes your build target to iOS 8.0.<% } %>

### Attributes

* `<Platform>` is the target mobile platform for which you want to add a native library. You can set the following target platforms.
    * `android` - Adds an Android native library.
	<% if(isMacOS) { %>* `ios` - Adds an iOS native library.<% } %>
* `<Library Path>` is the file path to a locally stored framework.<% if(isHtml) { %>
    When you want to add an iOS framework, `<Library Path>` must be the complete file path to the `*.framework` file that you want to use.
    When you want to add an Android framework, `<Library Path>` might be any of the following:

    * The file path to a directory containing one or more `*.jar` files.
    * The file path to a directory containing the `project.properties` files for an Android library project created with Eclipse.

### Prerequisites

Before adding a framework, verify that your project meets the following requirements:

* You have added the platform for which you want to add a native library by running `$ tns platform add <Platform>`

Before adding an iOS framework, verify that your system and the framework meets the following requirements.

* You have Xcode 6 and the iOS 8.0 SDK installed.
* The framework is a Cocoa Touch Framework with all build architectures enabled.
* If the framework relies on other third-party frameworks, make sure to add these frameworks manually as well.

Before adding an Android framework, verify that the framework meets the following requirements.

* If you want to add an Android library project, the project must be created and developed with Eclipse.
* If an Android library project depends on other libraries, make sure that these libraries are accessible locally.
* If a `*.jar` file depends on other libraries, make sure to add the dependent libraries by storing them in the same directory and passing this directory to `<Library Path>`. Otherwise, make sure to add each dependent library manually as well.

### Command Limitations

* You can work with native iOS libraries only on OS X systems.

### Related Commands

Command | Description
----------|----------
[library](library.html) | You must run the library command with a related command.
<% } %>