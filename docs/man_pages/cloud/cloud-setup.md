<% if (isJekyll) { %>---
title: tns cloud setup
position: 5
---<% } %>

# tns cloud setup

### Description

Install the `nativescript-cloud extension` to configure your environment for cloud builds.

### Commands

Usage | Synopsis
------|-------
Install the `nativescript-cloud extension` | `$ tns cloud setup`
Log in for cloud builds (will open browser login form) | `$ tns login`
Log in for cloud builds (through the CLI) | `$ tns dev-login <username> <password>`
Accept EULA agreement | `$ tns accept eula`
Perform iOS cloud build | `$ tns cloud build ios --accountId=<accountId>`
Perform Android cloud build | `$ tns cloud build android --accountId=<accountId>`
View accountId (after logging in) | `$ tns account`


### Related Commands

Command | Description
----------|----------
[setup](setup.html) | Run the setup script to try to automatically configure your environment for local builds.
