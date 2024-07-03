<% if (isJekyll) { %>---
title: ns native add kotlin
position: 3
---<% } %>

# ns native add kotlin

### Description

Adds a newly generated Kotlin file, which includes a class with the specified name, placing it in the appropriate directory.

Kotlin usage requires that the `useKotlin` property is set in `gradle.properties`, the command will set this to `true`.

### Commands

Usage | Synopsis
------|-------
Kotlin | `$ ns native add kotlin <Kotlin class name>`

### Arguments

* `<Kotlin class name>` is the fully qualified name of the `Class` to create, e.g. `org.nativescript.SomeClass`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[native add swift](native-add-swift.html) | Generates and adds a Swift file containing a class of the given name.
[native add objective-c](native-add-objective-c.html) | Generates and adds Objective-C files containing an interface of the given name.
[native add java](native-add-java.html) | Generates and adds a Java file containing a class of the given name.
[native add kotlin](native-add-kotlin.html) | Generates and adds a Kotlin file containing a class of the given name.
<% } %>