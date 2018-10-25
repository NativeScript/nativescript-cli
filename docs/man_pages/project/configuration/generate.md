<% if (isJekyll) { %>---
title: tns generate
position: 9
---<% } %>

# tns generate

### Description

Modifies the project by executing a specified schematic to it.

### Commands

Usage | Synopsis
------|-------
General | `$ tns generate <Schematic Name> [--collection <Collection>] [option=value]`

### Options

* `--collection` - specifies the node package to be used as schematics collection. If it's not specified, `@nativescript/schematics` will be used.

### Arguments

* `<Schematic Name>` - name of the schematic to be executed. The schematic should be specified in the used collection.
* `<option=value>` - options for executed schematic.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[update](update.md) | Updates a NativeScript project to the latest (or specified) version.
[resources generate icons](resources-generate-icons.md) | Generates icons for Android and iOS.
[resources generate splashes](resources-generate-splashes.md) | Generates splashscreens for Android and iOS.
<% } %>
