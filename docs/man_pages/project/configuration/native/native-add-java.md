<% if (isJekyll) { %>---
title: ns native add java
position: 2
---<% } %>

# ns native add java

### Description

Adds a newly generated Java file, which includes a class with the specified name, placing it in the appropriate directory.

### Commands

Usage | Synopsis
------|-------
Java | `$ ns native add java <Java class name>`

### Arguments

* `<Java class name>` is the fully qualified name of the `Class` to create, e.g. `org.nativescript.SomeClass`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[native add swift](native-add-swift.html) | Generates and adds a Swift file containing a class of the given name.
[native add objective-c](native-add-objective-c.html) | Generates and adds Objective-C files containing an interface of the given name.
[native add java](native-add-java.html) | Generates and adds a Java file containing a class of the given name.
[native add kotlin](native-add-kotlin.html) | Generates and adds a Kotlin file containing a class of the given name.
<% } %>