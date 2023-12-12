<% if (isJekyll) { %>---
title: ns package-manager set
position: 18
---<% } %>

# ns package-manager set

### Description

Enables the specified package manager for the NativeScript CLI. Supported values are npm, yarn and pnpm.

### Commands

Usage | Synopsis
------|-------
General | `$ ns package-manager set <PackageManager>`

### Arguments

* `<PackageManager>` is the name of the package manager. Supported values are npm, yarn and pnpm.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[package-manager-get](package-manager-get.html) | Prints the value of the current package manager.
<% } %>
