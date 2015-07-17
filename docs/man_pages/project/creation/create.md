create
==========

Usage | Synopsis
---|---
General | `$ tns create <App Name> [--path <Directory>] [--appid <App ID>] [--copy-from <Directory>]`

Creates a new project for native development with NativeScript from the default template or from an existing NativeScript project.

### Options
* `--path` - Specifies the directory where you want to create the project, if different from the current directory. The directory must be empty.
* `--appid` - Sets the application identifier for your project. 
* `--copy-from` - Specifies a directory which contains an existing NativeScript project. If not set, the NativeScript CLI creates the project from the default hello-world template.

### Attributes
* `<App Name>` is the name of project. The specified name must meet the requirements of all platforms that you want to target. <% if(isConsole) { %>For more information about the `<App Name>` requirements, run `$ tns help create`<% } %><% if(isHtml) { %>For projects that target Android, you can use uppercase or lowercase letters, numbers, and underscores. The name must start with a letter.  
For projects that target iOS, you can use uppercase or lowercase letters, numbers, and hyphens.<% } %>    
* `<App ID>` is the application identifier for your project. It must be a domain name in reverse and must meet the requirements of all platforms that you want to target. If not specified, the application identifier is set to `org.nativescript.<App name>` <% if(isConsole) { %>For more information about the `<App ID>` requirements, run `$ tns help create`<% } %><% if(isHtml) { %>For projects that target Android, you can use uppercase or lowercase letters, numbers, and underscores in the strings of the reversed domain name, separated by a dot. Strings must be separated by a dot and must start with a letter. For example: `com.nativescript.My_Andro1d_App`  
For projects that target iOS, you can use uppercase or lowercase letters, numbers, and hyphens in the strings of the reversed domain name. Strings must be separated by a dot. For example: `com.nativescript.My-i0s-App`.<% } %>

<% if(isHtml) { %> 
### Related Commands

Command | Description
----------|----------
[init](init.html) | Initializes a project for development. The command prompts you to provide your project configuration interactively and uses the information to create a new package.json file or update the existing one.
[install](/lib-management/install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
<% } %> 