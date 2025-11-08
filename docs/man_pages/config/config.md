<% if (isJekyll) { %>---
title: ns config
position: 1
---<% } %>

# ns config

### Description

View and manage your project's NativeScript configuration stored in `nativescript.config.(js|ts)` (or legacy `nsconfig.json`).

### Commands

Usage | Synopsis
------|---------
List all config | `$ ns config`
Get a value | `$ ns config get <key>`
Set a value | `$ ns config set <key> <value>`

### Examples

* `$ ns config` — prints all configuration values.
* `$ ns config get ios.id` — prints the iOS bundle identifier.
* `$ ns config set android.codeCache true` — enables Android V8 code cache.

### Notes

* Keys use dot-notation, for example: `ios.id`, `android.codeCache`, `bundler`.
* Values are parsed as JSON when possible. Use quotes for strings with spaces.

<% if(isHtml) { %>

### Related Commands

Command | Description
----------|----------
[config get](config-get.html) | Prints the value for the specified configuration key.
[config set](config-set.html) | Sets the value for the specified configuration key.
<% } %>