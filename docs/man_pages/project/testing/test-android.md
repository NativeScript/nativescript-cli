test android
==========

Usage | Synopsis
------|-------
General | `$ tns test android [--watch] [--device <Device ID>] [--debug-brk]`

Runs the tests in your project on connected Android devices and emulators.

### Options
* `--watch` - If set, when you save changes to the project, changes are automatically synchronized to the connected device and tests are re-run.
* `--device` - Specifies the serial number or the index of the connected device on which to run the tests. To list all connected devices, grouped by platform, run `$ tns device`
* `--debug-brk` - Run the tests under the debugger. The debugger will break just before your tests are executed, so you have a chance to place breakpoints.

### Attributes
* `<Device ID>` is the device index or identifier as listed by `$ tns device`

<% if(isHtml) { %>
### Related commands
Command | Description
--------|------------
[test init](test-init.html) | Creates a test project in an existing NativeScript project
<% } %>
