<% if (isJekyll) { %>---
title: ns native add objective-c
position: 4
---<% } %>

# ns native add objective-c

### Description

Adds newly generated Objective-C files, which include an interface with the specified name, placing them in the appropriate directory.

Objective-C usage requires that the `module.modulemap` is modified to include the header file, the command will set this entry.

### Commands

Usage | Synopsis
------|-------
Objective-C | `$ ns native add objective-c <Objective-C interface name>`

### Arguments

* `<Objective-C interface name>` is the name of the `interface` to create, e.g. `SomeInterface`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[native add swift](native-add-swift.html) | Generates and adds a Swift file containing a class of the given name.
[native add objective-c](native-add-objective-c.html) | Generates and adds Objective-C files containing an interface of the given name.
[native add java](native-add-java.html) | Generates and adds a Java file containing a class of the given name.
[native add kotlin](native-add-kotlin.html) | Generates and adds a Kotlin file containing a class of the given name.
<% } %>