<% if (isJekyll) { %>---
title: ns cloud setup
position: 5
---<% } %>

# ns cloud setup

### Description

Install the `nativescript-cloud extension` to configure your environment for cloud builds.

### Commands

Usage | Synopsis
------|-------
Install the `nativescript-cloud extension` | `$ ns cloud setup`
Log in for cloud builds (will open browser login form) | `$ ns login`
Log in for cloud builds (through the CLI) | `$ ns dev-login <username> <password>`
Accept EULA agreement | `$ ns accept eula`
Perform iOS cloud build | `$ ns cloud build ios --accountId=<accountId>`
Perform Android cloud build | `$ ns cloud build android --accountId=<accountId>`
View accountId (after logging in) | `$ ns account`


### Related Commands

Command | Description
----------|----------
[setup](setup.html) | Run the setup script to try to automatically configure your environment for local builds.
