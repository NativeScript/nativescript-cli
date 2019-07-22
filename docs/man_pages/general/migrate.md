<% if (isJekyll) { %>---
title: tns migrate
position: 15
---<% } %>

# tns migrate

### Description

Migrates the app dependencies to a form compatible with NativeScript 6.0. Running this command will not affect the codebase of the application and you might need to do additional changes manually.

The migrate command will update **"webpack.config.js"**, **"karma.conf.js"**, **"tsconfig.tns.json"**(not for code sharing projects) and **"package-lock.json"**. The original files will be moved to **".migration_backup"** folder.
The following folders will be removed: **"hooks"**, **"platforms"** and **"node_modules"**. The **"hooks"** folder will also be backed up in **".migration_backup"** folder.

The **"nativescript-dev-sass"** and **"nativescript-dev-typescript"** dependencies will be replaced with **"node-sass"** and **"typescript"** respectively.
The **"nativescript-dev-less"** dependency will be removed, but to enable LESS CSS support the user should follow the steps in this<% if(isConsole) { %> feature request: https://github.com/NativeScript/nativescript-dev-webpack/issues/967.<% } %><% if(isHtml) { %> [feature request](https://github.com/NativeScript/nativescript-dev-webpack/issues/967).<% } %>

The following dependencies will be updated if needed:
* tns-core-modules
* tns-core-modules-widgets
* tns-platform-declarations
* nativescript-dev-webpack
* nativescript-camera
* nativescript-geolocation
* nativescript-imagepicker
* nativescript-permissions
* nativescript-social-share
* nativescript-ui-chart
* nativescript-ui-dataform
* nativescript-ui-gauge
* nativescript-ui-listview
* nativescript-ui-sidedrawer
* nativescript-ui-calendar
* nativescript-ui-autocomplete
* nativescript-cardview
* nativescript-datetimepicker
* kinvey-nativescript-sdk
* nativescript-plugin-firebase
* nativescript-vue
* nativescript-vue-template-compiler
* nativescript-angular
* @angular/animiations
* @angular/platform-browser-dynamic
* @angular/common
* @angular/compiler
* @angular/compiler-cli
* @angular/core
* @angular/forms
* @angular/http
* @angular/platform-browser
* @angular/router
* @ngtools/webpack
* @angular-devkit/build-angular
* rxjs
* zone.js
* nativescript-unit-test-runner
* karma-webpack
* karma-jasmine
* karma-mocha
* karma-chai
* karma-qunit
* karma

### Commands

Usage | Synopsis
------|-------
General | `$ tns migrate`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[update](update.html) | Updates the project with the latest versions of iOS/Android runtimes and cross-platform modules.
[help](help.html) | Lists the available commands or shows information about the selected command.
[doctor](doctor.html) | Checks your system for configuration problems which might prevent the NativeScript CLI from working properly.
<% } %>
