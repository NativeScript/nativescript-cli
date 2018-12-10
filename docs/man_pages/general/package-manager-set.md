<% if (isJekyll) { %>---
title: tns package-manager set
position: 17
---<% } %>

# tns package-manager set

### Description

Enables the specified package manager for the NativeScript CLI. Supported values are npm and yarn.

### Commands

Usage | Synopsis
------|-------
General | `$ tns package-manager set <PackageManager>`

### Arguments

* `<PackageManager>` is the name of the package manager. Supported values are npm and yarn.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[package-manager-get](package-manager-get.html) | Prints the value of the current package manager.
<% } %>
