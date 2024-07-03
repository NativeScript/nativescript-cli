<% if (isJekyll) { %>---
title: ns native
position: 1
---<% } %>

# ns native

### Description

Commands to add native files to the application placing them in the correct directory.

### Commands

Usage | Synopsis
------|-------
Swift | `$ ns native add swift <Swift class name>`
Objective-C | `$ ns native add objective-c <Objective-C interface name>`
Java | `$ ns native add java <Java class name>`
Kotlin | `$ ns native add kotlin <Kotlin class name>`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[native add swift](native-add-swift.html) | Generates and adds a Swift file containing a class of the given name.
[native add objective-c](native-add-objective-c.html) | Generates and adds Objective-C files containing an interface of the given name.
[native add java](native-add-java.html) | Generates and adds a Java file containing a class of the given name.
[native add kotlin](native-add-kotlin.html) | Generates and adds a Kotlin file containing a class of the given name.
<% } %>