<% if (isJekyll) { %>---
title: tns create
position: 1
---<% } %>

# tns create

### Description

Interactively creates a new NativeScript app based on a predefined template.

### Commands

Template | Synopsis
---------|---------
JavaScript based | `$ tns create [<App Name>] [--js] [--path <Directory>] [--appid <App ID>]`
TypeScript based | `$ tns create [<App Name>] --ts [--path <Directory>] [--appid <App ID>]`
Angular based | `$ tns create [<App Name>] --ng [--path <Directory>] [--appid <App ID>]`
Vue.js based | `$ tns create [<App Name>] --vue [--path <Directory>] [--appid <App ID>]`
Custom template | `$ tns create [<App Name>] [--path <Directory>] [--appid <App ID>] --template <Template>`

### Options

* `--path` - Specifies the directory where you want to create the project, if different from the current directory. `<Directory>` is the absolute path to an empty directory in which you want to create the project.
* `--appid` - Sets the application identifier of your project. `<App ID>` is the value of the application identifier and it must meet the specific requirements of each platform that you want to target. If not specified, the application identifier is set to `org.nativescript.<App name>`.<% if(isConsole) { %> For more information about the `<App ID>` requirements, run `$ tns help create`.<% } %><% if(isHtml) { %> The application identifier must be a domain name in reverse. For projects that target Android, you can use uppercase or lowercase letters, numbers, and underscores in the strings of the reversed domain name, separated by a dot. Strings must be separated by a dot and must start with a letter. For example: `com.nativescript.My_Andro1d_App`. For projects that target iOS, you can use uppercase or lowercase letters, numbers, and hyphens in the strings of the reversed domain name. Strings must be separated by a dot. For example: `com.nativescript.My-i0s-App`.
* `--template` - Specifies a valid npm package which you want to use as a base to create your project. If `--template` is not set, the NativeScript CLI will ask you to pick one from a predefined list afterwards.<% if(isHtml) { %> If one or more application assets are missing from the `App_Resources` directory in the package, the CLI adds them using the assets available in the default hello-world template.<% } %> `<Template>` can be the name of a package in the npm registry, a local path or a GitHub URL to a directory, or a `.tar.gz` archive containing a `package.json` file. The contents of the package will be copied to the `app` directory of your project.<% } %>
* `--js`, `--javascript` - Sets the template for your project to the JavaScript template.
* `--ts`, `--tsc`, `--typescript` - Sets the template for your project to the TypeScript template.
* `--ng`, `--angular` - Sets the template for your project to the Angular template.
* `--vue`, `--vuejs` - Sets the template for your project to the Vue.js template.

### Arguments

`<App Name>` is the name of project and must meet the requirements of each platform that you want to target. If not specified in the initial command, the NativeScript CLI will ask you for it afterwards.<% if(isConsole) { %> For more information about the `<App Name>` requirements, run `$ tns help create`.<% } %><% if(isHtml) { %> For projects that target Android, you can use uppercase or lowercase letters, numbers, and underscores. The name must start with a letter. For projects that target iOS, you can use uppercase or lowercase letters, numbers, and hyphens.
<% } %>

<% if(isHtml) { %>

### Application Templates

Below you can see a list of the recommended NativeScript starting templates and the commands you should use to generate them.

Template | Command
---------|----------
`JavaScript - Hello World`, `--js`, `--javascript` | tns create --template tns-template-hello-world
`JavaScript - SideDrawer` | tns create --template tns-template-drawer-navigation
`JavaScript - Tabs` | tns create --template tns-template-tab-navigation
`TypeScript - Hello World`, `--ts`, `--tsc`, `--typescript` | tns create --template tns-template-hello-world-ts
`TypeScript - SideDrawer` | tns create --template tns-template-drawer-navigation-ts
`TypeScript - Tabs` | tns create --template tns-template-tab-navigation-ts
`Angular - Hello World`, `--ng`, `--angular` | tns create --template tns-template-hello-world-ng
`Angular - SideDrawer` | tns create --template tns-template-drawer-navigation-ng
`Angular - Tabs` | tns create --template tns-template-tab-navigation-ng
`React - Hello World`, `--react`, `--reactjs` | tns create --template tns-template-blank-react
`Vue.js - Blank`, `--vue`, `--vuejs` | tns create --template tns-template-blank-vue
`Vue.js - SideDrawer`, | tns create --template tns-template-drawer-navigation-vue
`Vue.js - Tabs` | tns create --template tns-template-tab-navigation-vue

### Related Commands

Command | Description
----------|----------
[install](/lib-management/install.html) | Installs all platforms and dependencies described in the `package.json` file in the current directory.
<% } %>
