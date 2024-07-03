<% if (isJekyll) { %>---
title: ns native add swift
position: 5
---<% } %>

# ns native add swift

### Description

Adds a newly generated Swift file, which includes a class with the specified name, placing it in the appropriate directory.

### Commands

Usage | Synopsis
------|-------
Swift | `$ ns native add swift <Swift class name>`

### Arguments

* `<Swift class name>` is the name of the `Class` to create, e.g. `SomeClass`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[native add swift](native-add-swift.html) | Generates and adds a Swift file containing a class of the given name.
[native add objective-c](native-add-objective-c.html) | Generates and adds Objective-C files containing an interface of the given name.
[native add java](native-add-java.html) | Generates and adds a Java file containing a class of the given name.
[native add kotlin](native-add-kotlin.html) | Generates and adds a Kotlin file containing a class of the given name.
<% } %>