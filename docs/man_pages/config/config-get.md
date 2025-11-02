<% if (isJekyll) { %>---
title: ns config get
position: 2
---<% } %>

# ns config get

### Description

Prints the value for a specific key from the project's NativeScript configuration.

### Commands

Usage | Synopsis
------|-------
General | `$ ns config get <key>`

### Arguments

* `<key>` — The configuration key in dot-notation. Examples: `ios.id`, `android.codeCache`, `bundler`.

### Examples

* `$ ns config get ios.id`
* `$ ns config get android.codeCache`
* `$ ns config get bundler`

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[config](config.html) | Lists all configuration values for the current project.
[config set](config-set.html) | Sets the value for the specified configuration key.
<% } %>