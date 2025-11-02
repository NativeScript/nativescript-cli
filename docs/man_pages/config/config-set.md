<% if (isJekyll) { %>---
title: ns config set
position: 3
---<% } %>

# ns config set

### Description

Sets the value for a specific key in the project's NativeScript configuration.

### Commands

Usage | Synopsis
------|-------
General | `$ ns config set <key> <value>`

### Arguments

* `<key>` — The configuration key in dot-notation. Examples: `ios.id`, `android.codeCache`, `bundler`.
* `<value>` — The value to set. Parsed as JSON when possible (e.g. `true`, `42`, `{ "foo": "bar" }`). Otherwise treated as a string.

### Examples

* `$ ns config set ios.id org.nativescript.myapp`
* `$ ns config set android.codeCache true`
* `$ ns config set bundler vite`

### Notes

* Setting whole objects is not supported. Update individual keys instead. For example, use:
	`$ ns config set android.codeCache true`

### Related Commands

Command | Description
----------|----------
[config](config.html) | Lists all configuration values for the current project.
[config get](config-get.html) | Prints the value for the specified configuration key.
<% } %>