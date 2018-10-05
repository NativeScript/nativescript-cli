<% if (isJekyll) { %>---
title: tns create
position: 1
---<% } %>
# tns create


Usage | Synopsis
---|---
Create from default JavaScript template | `$ tns create [<App Name>] [--js] [--path <Directory>] [--appid <App ID>]`
Create from default TypeScript template | `$ tns create [<App Name>] --ts [--path <Directory>] [--appid <App ID>]`
Create from default Angular template | `$ tns create [<App Name>] --ng [--path <Directory>] [--appid <App ID>]`
Create from default Vue.js template | `$ tns create [<App Name>] --vue [--path <Directory>] [--appid <App ID>]`
Create from custom template | `$ tns create [<App Name>] [--path <Directory>] [--appid <App ID>] --template <Template>`

Interactively creates a new NativeScript app.

### Options
* `--path` - Specifies the directory where you want to create the project, if different from the current directory. The directory must be empty.
* `--appid` - Sets the application identifier for your project.
* `--template` - Specifies a valid npm package which you want to use to create your project. If `--template` is not set, the NativeScript CLI will ask you to pick one from a predefined list afterwards.<% if(isHtml) { %> If one or more application assets are missing from the `App_Resources` directory in the package, the CLI adds them using the assets available in the default hello-world template.<% } %>
* `--js`, `--javascript` - Sets the template for your project to the JavaScript template.
* `--ts`, `--tsc`, `--typescript` - Sets the template for your project to the TypeScript template.
* `--ng`, `--angular` - Sets the template for your project to the Angular template.
* `--vue`, `--vuejs` - Sets the template for your project to the Vue.js template.

### Attributes
* `<App Name>` is the name of project. The specified name must meet the requirements of all platforms that you want to target. If not specified, the NativeScript CLI will ask you for it afterwards. <% if(isConsole) { %>For more information about the `<App Name>` requirements, run `$ tns help create`<% } %><% if(isHtml) { %>For projects that target Android, you can use uppercase or lowercase letters, numbers, and underscores. The name must start with a letter.
For projects that target iOS, you can use uppercase or lowercase letters, numbers, and hyphens.<% } %>
* `<App ID>` is the application identifier for your project. It must be a domain name in reverse and must meet the requirements of all platforms that you want to target. If not specified, the application identifier is set to `org.nativescript.<App name>` <% if(isConsole) { %>For more information about the `<App ID>` requirements, run `$ tns help create`<% } %><% if(isHtml) { %>For projects that target Android, you can use uppercase or lowercase letters, numbers, and underscores in the strings of the reversed domain name, separated by a dot. Strings must be separated by a dot and must start with a letter. For example: `com.nativescript.My_Andro1d_App`
For projects that target iOS, you can use uppercase or lowercase letters, numbers, and hyphens in the strings of the reversed domain name. Strings must be separated by a dot. For example: `com.nativescript.My-i0s-App`.
* `<Template>` is a valid npm package which you want to use as template for your app. You can specify the package by name in the npm registry or by local path or GitHub URL to a directory or .tar.gz containing a package.json file. The contents of the package will be copied to the `app` directory of your project.<% } %>

<% if(isHtml) { %>

### Templates Usage

Based on the selected options, the NativeScript CLI will use the project templates below:

Selected Option | Template 
----------|----------
`Plain JavaScript - Hello World`, `--js`, `--javascript` | tns-template-hello-world
`Plain JavaScript - SideDrawer` | tns-template-drawer-navigation
`Plain JavaScript - Tabs` | tns-template-tab-navigation
`Plain TypeScript - Hello World`, `--ts`, `--tsc`, `--typescript` | tns-template-hello-world-ts
`Plain TypeScript - SideDrawer` | tns-template-drawer-navigation-ts
`Plain TypeScript - Tabs` | tns-template-tab-navigation-ts
`Angular - Hello World`, `--ng`, `--angular` | tns-template-hello-world-ng
`Angular - SideDrawer` | tns-template-drawer-navigation-ng
`Angular - Tabs` | tns-template-tab-navigation-ng
`Vue.js`, `--vue`, `--vuejs` | tns-template-blank-vue

### Related Commands

Command | Description
----------|----------
[init](init.html) | Initializes a project for development. The command prompts you to provide your project configuration interactively and uses the information to create a new package.json file or update the existing one.
[install](/lib-management/install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
<% } %>
