test ios
==========

Usage | Synopsis
------|-------
Run tests on all connected devices | `$ tns test ios [--watch]`
Run tests on a selected device | `$ tns test ios --device <Device ID> [--watch]`
Run tests in the iOS Simulator | `$ tns test ios --emulator [--watch]`

Runs the tests in your project on connected iOS devices or the iOS Simulator.

### Options
* `--watch` - If set, when you save changes to the project, changes are automatically synchronized to the connected device and tests are re-ran.
* `--device` - Specifies the serial number or the index of the connected device on which you want to run tests. To list all connected devices, grouped by platform, run `$ tns device`. You cannot set `--device` and `--emulator` simultaneously.
* `--emulator` - Runs tests on the iOS Simulator. You cannot set `--device` and `--emulator` simultaneously.

<% if(isHtml) { %> 
### Related commands
Command | Description
--------|------------
[test init](test-init.html) | Creates a test project in an existing NativeScript project
<% } %>
