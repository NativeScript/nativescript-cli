<% if (isJekyll) { %>---
title: ns hooks
position: 1
---<% } %>

# ns create

### Description

Manages lifecycle hooks from installed plugins.

### Commands

Usage | Synopsis
---------|---------
Install | `$ ns hooks install`
List | `$ ns hooks list`
Lock | `$ ns hooks lock`
Verify | `$ ns hooks verify`

#### Install

Installs hooks from each installed plugin dependency.

#### List

Lists the plugins which have hooks and which scripts they install

#### Lock

Generates a `hooks-lock.json` containing the hooks that are in the current versions of the plugins.

#### Verify

Verifies that the hooks contained in the installed plugins match those listed in the `hooks-lock.json` file.
